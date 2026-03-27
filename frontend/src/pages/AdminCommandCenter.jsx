import React from "react";
import { Link } from "react-router-dom";
import { BookOpen, LifeBuoy, Shield, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "../components/ui/Button";

const quickLinks = [
  {
    to: "/admin-support",
    title: "Support Queue",
    label: "Live support handoff",
    description: "See AI escalations, join conversations, and reply to users in real time.",
    icon: LifeBuoy,
  },
  {
    to: "/admin-bookings",
    title: "Bookings",
    label: "Reservation control",
    description: "Review live booking records, payment status, and fulfillment progress.",
    icon: BookOpen,
  },
];

export default function AdminCommandCenter() {
  return (
    <div className="min-h-screen bg-[#040404] pb-24 pt-36 text-white">
      <div className="mx-auto max-w-7xl space-y-10 px-6 sm:px-8 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-[40px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.16),transparent_38%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-8 shadow-[0_32px_120px_rgba(0,0,0,0.45)] md:p-10"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.45em] text-orange-300">Admin Console</p>
              <h1 className="mt-4 text-4xl font-black uppercase italic tracking-[-0.05em] text-white md:text-6xl">
                Command center, <span className="text-orange-500">live.</span>
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/55">
                Monitor platform activity, jump into unresolved support chats, and keep operations moving from one clean control surface.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button as={Link} to="/admin-support" size="md">
                <LifeBuoy size={16} />
                Open Support Queue
              </Button>
              <Button as={Link} to="/admin-bookings" variant="ghost" size="md">
                <BookOpen size={16} />
                Review Bookings
              </Button>
            </div>
          </div>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-2">
          {quickLinks.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.to}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                className="rounded-[34px] border border-white/10 bg-white/[0.03] p-7 shadow-[0_24px_80px_rgba(0,0,0,0.35)]"
              >
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.32em] text-orange-300">{item.label}</p>
                    <h2 className="mt-4 text-3xl font-black uppercase italic tracking-tight text-white">{item.title}</h2>
                    <p className="mt-4 text-sm leading-7 text-white/55">{item.description}</p>
                  </div>
                  <div className="rounded-[22px] border border-orange-500/20 bg-orange-500/10 p-4 text-orange-300">
                    <Icon size={22} />
                  </div>
                </div>
                <div className="mt-6 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.28em] text-white/30">
                  <Shield size={14} className="text-orange-500" />
                  Admin-only surface
                </div>
                <Button as={Link} to={item.to} variant="ghost" size="sm" className="mt-6 w-full justify-center">
                  <Sparkles size={14} />
                  Open
                </Button>
              </motion.div>
            );
          })}
        </div>

        <div className="rounded-[40px] border border-white/10 bg-white/[0.03] p-8 shadow-[0_32px_120px_rgba(0,0,0,0.4)]">
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-orange-300">Operations Note</p>
          <h3 className="mt-4 text-3xl font-black uppercase italic tracking-tight text-white">Support escalations now land here first.</h3>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/55">
            The floating site assistant answers from live stay and ride records. When the data is missing or uncertain, the thread is queued for admins and becomes reply-ready inside the support queue.
          </p>
        </div>
      </div>
    </div>
  );
}
