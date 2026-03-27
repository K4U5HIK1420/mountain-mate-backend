import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, Minimize2, Maximize2, Bot } from "lucide-react";
import API from "../utils/api";
import socket from "../utils/socket";

const STORAGE_KEY = "mm_support_conversation_id";

function mapMessage(message) {
  return {
    id: `${message.sender}-${message.createdAt || Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    text: message.text,
    sender: message.sender === "user" ? "user" : "bot",
    timestamp: message.createdAt ? new Date(message.createdAt) : new Date(),
  };
}

const LiveChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      text: "Welcome to Mountain Mate. Ask about stays, rides, routes, or planning, and I will answer from live platform records first.",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState(() => localStorage.getItem(STORAGE_KEY) || "");
  const [queueStatus, setQueueStatus] = useState("");
  const messagesEndRef = useRef(null);

  const canSend = useMemo(() => inputMessage.trim().length > 0, [inputMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (!conversationId) return;

    localStorage.setItem(STORAGE_KEY, conversationId);
    socket.emit("support:join", conversationId);

    const handleConversationUpdate = (conversation) => {
      if (conversation.id !== conversationId) return;
      setQueueStatus(conversation.status);
      setMessages(conversation.messages.map(mapMessage));
    };

    socket.on("support:conversation-updated", handleConversationUpdate);
    return () => {
      socket.off("support:conversation-updated", handleConversationUpdate);
    };
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId) return;

    const syncConversation = async () => {
      try {
        const res = await API.get(`/support/conversations/${conversationId}`);
        const conversation = res.data?.data;
        if (conversation) {
          setQueueStatus(conversation.status);
          setMessages(conversation.messages.map(mapMessage));
        }
      } catch {
        // Keep local widget usable even if sync fails.
      }
    };

    syncConversation();
  }, [conversationId]);

  const sendMessage = async () => {
    if (!canSend) return;

    const text = inputMessage.trim();
    const userMessage = {
      id: `user-${Date.now()}`,
      text,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);

    try {
      const res = await API.post("/support/chat", {
        message: text,
        conversationId: conversationId || undefined,
      });

      const { answer, conversation, needsHuman } = res.data || {};

      if (conversation?.id) {
        setConversationId(conversation.id);
        setQueueStatus(conversation.status);
        setMessages(conversation.messages.map(mapMessage));
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            text: answer || "I could not generate a response just now.",
            sender: "bot",
            timestamp: new Date(),
          },
        ]);
      }

      if (needsHuman) {
        setQueueStatus(conversation?.status || "queued");
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          text: "Support uplink is temporarily unstable. Please try again in a moment.",
          sender: "bot",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const queueLabel =
    queueStatus === "queued"
      ? "Waiting for admin"
      : queueStatus === "open"
        ? "Admin joined"
        : "AI live";

  return (
    <>
      <motion.button
        onClick={() => {
          setIsOpen((prev) => !prev);
          if (!isOpen) setIsMinimized(false);
        }}
        className="fixed bottom-6 right-6 z-[10020] rounded-full border border-white/20 bg-gradient-to-br from-[#F97316] to-[#EA580C] p-4 text-white shadow-2xl transition-all duration-300 hover:scale-110"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <MessageSquare size={24} />
        {queueStatus === "queued" && <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-red-500" />}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`fixed right-4 top-28 z-[10010] flex w-[calc(100vw-2rem)] max-w-md flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#050505] shadow-2xl backdrop-blur-3xl sm:right-6 sm:w-96 ${
              isMinimized ? "h-14" : "bottom-24"
            }`}
          >
            <div className="shrink-0 bg-gradient-to-r from-[#F97316] to-[#EA580C] p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bot size={20} />
                  <div className="text-left">
                    <h3 className="text-sm font-bold leading-none">M-Mate Intelligence</h3>
                    <p className="mt-1 text-[10px] font-black uppercase tracking-widest italic opacity-70">Expedition Support</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setIsMinimized((prev) => !prev)} className="rounded-lg p-1 transition-colors hover:bg-white/10">
                    {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                  </button>
                  <button onClick={() => setIsOpen(false)} className="rounded-lg p-1 transition-colors hover:bg-white/10">
                    <X size={16} />
                  </button>
                </div>
              </div>
            </div>

            {!isMinimized && (
              <>
                <div className="flex-1 space-y-4 overflow-y-auto p-4">
                  {messages.map((message) => (
                    <motion.div key={message.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[85%] rounded-2xl p-4 ${
                          message.sender === "user"
                            ? "bg-orange-600 text-white shadow-lg"
                            : "border border-white/10 bg-white/5 text-white"
                        }`}
                      >
                        <p className="text-[13px] font-medium leading-relaxed">{message.text}</p>
                        <p className="mt-2 text-[9px] font-black uppercase tracking-tighter opacity-40">
                          {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </motion.div>
                  ))}

                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                        <div className="flex gap-1.5">
                          <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1 }} className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                          <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                          <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="border-t border-white/5 bg-white/[0.02] p-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask about stays, rides, routes..."
                      className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[13px] font-medium text-white placeholder:text-white/20 transition-all focus:border-orange-600 focus:outline-none"
                    />
                    <motion.button
                      onClick={sendMessage}
                      disabled={!canSend}
                      className="rounded-xl bg-orange-600 p-3 text-white shadow-lg transition-all hover:bg-white hover:text-black disabled:grayscale disabled:opacity-30"
                      whileTap={{ scale: 0.9 }}
                    >
                      <Send size={18} />
                    </motion.button>
                  </div>
                  <div className="mt-3 flex items-center justify-between px-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/20 italic">AI + Admin Support</span>
                    <span className={`text-[9px] font-black uppercase tracking-widest italic ${queueStatus === "queued" ? "text-amber-400" : "text-orange-600/50"}`}>
                      {queueLabel}
                    </span>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default LiveChat;
