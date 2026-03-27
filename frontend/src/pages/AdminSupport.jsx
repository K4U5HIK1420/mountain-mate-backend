import React, { useEffect, useMemo, useRef, useState } from "react";
import { LifeBuoy, Loader2, Lock, MessageSquare, Send, ShieldAlert, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import API from "../utils/api";
import socket from "../utils/socket";
import { useAuth } from "../context/AuthContext";
import { useNotify } from "../context/NotificationContext";
import { Container } from "../components/ui/Container";
import { Button } from "../components/ui/Button";

function formatTime(value) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusTone(status) {
  if (status === "queued") return "text-amber-300 border-amber-500/20 bg-amber-500/10";
  if (status === "open") return "text-orange-300 border-orange-500/20 bg-orange-500/10";
  if (status === "resolved") return "text-emerald-300 border-emerald-500/20 bg-emerald-500/10";
  return "text-white/55 border-white/10 bg-white/5";
}

function normalizeConversation(raw) {
  return {
    ...raw,
    messages: Array.isArray(raw?.messages) ? raw.messages : [],
  };
}

export default function AdminSupport() {
  const { user } = useAuth();
  const { notify } = useNotify();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [reply, setReply] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedId, conversations]);

  useEffect(() => {
    const loadConversations = async () => {
      setLoading(true);
      setAccessDenied(false);
      try {
        const res = await API.get("/support/admin/conversations");
        const rows = (res.data?.data || []).map(normalizeConversation);
        setConversations(rows);
        setSelectedId((prev) => prev || rows[0]?.id || "");
      } catch (error) {
        setConversations([]);
        if ([401, 403].includes(error?.response?.status)) {
          setAccessDenied(true);
        } else {
          notify("Support queue failed to load", "error");
        }
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, [notify]);

  useEffect(() => {
    socket.emit("support:join-admin");

    const handleQueueUpdate = (incoming) => {
      const nextConversation = normalizeConversation(incoming);
      setConversations((prev) => {
        const existing = prev.some((item) => item.id === nextConversation.id);
        const merged = existing
          ? prev.map((item) => (item.id === nextConversation.id ? nextConversation : item))
          : [nextConversation, ...prev];
        return [...merged].sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
      });
      setSelectedId((prev) => prev || nextConversation.id);
    };

    socket.on("support:queue-updated", handleQueueUpdate);
    return () => {
      socket.off("support:queue-updated", handleQueueUpdate);
    };
  }, []);

  const selectedConversation = useMemo(
    () => conversations.find((item) => item.id === selectedId) || null,
    [conversations, selectedId]
  );

  const pendingCount = useMemo(
    () => conversations.filter((item) => item.status === "queued").length,
    [conversations]
  );

  const handleReply = async (status = "open") => {
    if (!selectedConversation || !reply.trim()) return;

    setSending(true);
    try {
      const res = await API.post(`/support/admin/conversations/${selectedConversation.id}/reply`, {
        message: reply.trim(),
        status,
      });
      const updated = normalizeConversation(res.data?.data);
      setConversations((prev) =>
        prev
          .map((item) => (item.id === updated.id ? updated : item))
          .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0))
      );
      setReply("");
      notify(status === "resolved" ? "Conversation resolved" : "Reply sent", "success");
    } catch (_error) {
      notify("Reply could not be sent", "error");
    } finally {
      setSending(false);
    }
  };

  if (!user || accessDenied) {
    return (
      <div className="min-h-screen bg-[#040404] pt-36 text-white">
        <Container>
          <div className="mx-auto max-w-xl rounded-[36px] border border-white/10 bg-white/[0.03] p-10 text-center shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-[24px] bg-orange-500/10 text-orange-300">
              <Lock size={26} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-orange-300">Admin Access Required</p>
            <h1 className="mt-4 text-3xl font-black uppercase italic tracking-tight text-white">Support queue is locked.</h1>
            <p className="mt-4 text-sm leading-7 text-white/55">
              This inbox only appears for authenticated admins. Once the backend confirms your role, the live queue will unlock here.
            </p>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#040404] pb-24 pt-36 text-white">
      <Container className="space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[40px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.16),transparent_38%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-8 shadow-[0_32px_120px_rgba(0,0,0,0.45)]"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.45em] text-orange-300">Admin Support</p>
              <h1 className="mt-4 text-4xl font-black uppercase italic tracking-[-0.05em] text-white md:text-6xl">
                Live support <span className="text-orange-500">handoff.</span>
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/55">
                The AI assistant answers from live platform records first. Anything uncertain or missing is queued here for an admin to pick up.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-[24px] border border-white/10 bg-black/30 px-5 py-4">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/30">Queued</p>
                <p className="mt-2 text-3xl font-black italic text-amber-300">{pendingCount}</p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-black/30 px-5 py-4">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/30">Active</p>
                <p className="mt-2 text-3xl font-black italic text-orange-300">
                  {conversations.filter((item) => item.status === "open").length}
                </p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-black/30 px-5 py-4">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/30">Resolved</p>
                <p className="mt-2 text-3xl font-black italic text-emerald-300">
                  {conversations.filter((item) => item.status === "resolved").length}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <div className="overflow-hidden rounded-[34px] border border-white/10 bg-white/[0.03] shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
            <div className="border-b border-white/10 px-6 py-5">
              <div className="flex items-center gap-3">
                <LifeBuoy size={18} className="text-orange-400" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/35">Support Queue</p>
                  <p className="mt-1 text-sm text-white/60">Incoming unresolved customer questions.</p>
                </div>
              </div>
            </div>

            <div className="max-h-[70vh] space-y-3 overflow-y-auto p-4">
              {loading ? (
                <div className="flex items-center justify-center gap-3 py-16 text-[10px] font-black uppercase tracking-[0.35em] text-white/35">
                  <Loader2 size={16} className="animate-spin text-orange-400" />
                  Loading queue
                </div>
              ) : conversations.length === 0 ? (
                <div className="rounded-[28px] border border-dashed border-white/10 bg-black/20 p-8 text-center">
                  <Sparkles size={24} className="mx-auto text-orange-400/70" />
                  <p className="mt-4 text-[10px] font-black uppercase tracking-[0.32em] text-white/35">No pending conversations</p>
                  <p className="mt-3 text-sm leading-7 text-white/50">New AI escalations will appear here automatically.</p>
                </div>
              ) : (
                conversations.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    className={`w-full rounded-[28px] border p-5 text-left transition-all ${
                      selectedId === item.id
                        ? "border-orange-500/30 bg-orange-500/10"
                        : "border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-white">{item.userEmail || item.guestLabel || "Explorer"}</p>
                        <p className="mt-1 text-[11px] leading-6 text-white/45">
                          {item.lastUserMessage || "Awaiting first message"}
                        </p>
                      </div>
                      <span className={`rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-[0.22em] ${statusTone(item.status)}`}>
                        {item.status}
                      </span>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-white/25">
                      <span>{item.messages?.length || 0} messages</span>
                      <span>{formatTime(item.updatedAt)}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-[34px] border border-white/10 bg-white/[0.03] shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
            {!selectedConversation ? (
              <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
                <MessageSquare size={30} className="text-orange-400/70" />
                <p className="mt-5 text-[10px] font-black uppercase tracking-[0.35em] text-white/35">Select a conversation</p>
                <p className="mt-4 max-w-md text-sm leading-7 text-white/50">
                  Choose any queued thread to review the AI response, see the customer question, and reply as an admin.
                </p>
              </div>
            ) : (
              <div className="flex min-h-[70vh] flex-col">
                <div className="border-b border-white/10 px-6 py-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-300">Conversation</p>
                      <h2 className="mt-2 text-2xl font-black uppercase italic tracking-tight text-white">
                        {selectedConversation.userEmail || selectedConversation.guestLabel || "Explorer"}
                      </h2>
                      <p className="mt-2 text-sm text-white/50">
                        {selectedConversation.handoffReason || "AI escalated this thread for human review."}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] ${statusTone(selectedConversation.status)}`}>
                        {selectedConversation.status}
                      </span>
                      <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-white/35">
                        <ShieldAlert size={14} className="text-orange-400" />
                        {formatTime(selectedConversation.updatedAt)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
                  {selectedConversation.messages.map((message, index) => {
                    const senderLabel =
                      message.sender === "user" ? "Explorer" : message.sender === "admin" ? "Admin" : "AI";
                    const tone =
                      message.sender === "user"
                        ? "ml-auto bg-orange-600 text-white"
                        : message.sender === "admin"
                          ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-50"
                          : "border border-white/10 bg-white/5 text-white";

                    return (
                      <div key={`${message.sender}-${message.createdAt || index}`} className="flex">
                        <div className={`max-w-[85%] rounded-[24px] px-5 py-4 shadow-lg ${tone}`}>
                          <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-[0.26em] opacity-70">
                            <span>{senderLabel}</span>
                            <span>{formatTime(message.createdAt)}</span>
                          </div>
                          <p className="mt-3 text-sm leading-7">{message.text}</p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                <div className="border-t border-white/10 px-6 py-5">
                  <textarea
                    value={reply}
                    onChange={(event) => setReply(event.target.value)}
                    rows={4}
                    placeholder="Reply as admin..."
                    className="w-full rounded-[28px] border border-white/10 bg-black/30 px-5 py-4 text-sm leading-7 text-white outline-none transition-all placeholder:text-white/20 focus:border-orange-500/40"
                  />
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
                    <Button variant="ghost" size="sm" onClick={() => handleReply("resolved")} disabled={sending || !reply.trim()}>
                      {sending ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                      Resolve with Reply
                    </Button>
                    <Button size="sm" onClick={() => handleReply("open")} disabled={sending || !reply.trim()}>
                      {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                      Send Reply
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}
