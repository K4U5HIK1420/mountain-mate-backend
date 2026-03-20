import React, { useMemo, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Send, ShieldCheck, Activity, User, Headset, Clock, Zap } from "lucide-react";

export default function SupportChat() {
  const [text, setText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);
  
  const [messages, setMessages] = useState([
    { 
      from: "support", 
      text: "Namaste explorer! Tactical Support is online. How can I assist your expedition today?",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    },
  ]);

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const canSend = useMemo(() => text.trim().length > 0, [text]);

  const send = () => {
    if (!canSend) return;
    const t = text.trim();
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    setText("");
    setMessages((prev) => [...prev, { from: "me", text: t, time: now }]);

    // Fake typing effect for tactical feel
    setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev, 
          { 
            from: "support", 
            text: "Uplink received. A flight controller is reviewing your logs. Stay on the frequency.", 
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
          }
        ]);
      }, 2000);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-orange-600 relative overflow-hidden font-sans">
      
      {/* --- BACKGROUND AURA --- */}
      <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-orange-600/5 blur-[150px] rounded-full pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-white/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto pt-40 pb-24 px-6">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-8">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <p className="text-orange-500 font-black tracking-[0.6em] text-[10px] uppercase italic mb-3">Expedition Control</p>
            <h1 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter leading-none">
              LIVE <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-700 animate-text-shimmer">COMM-LINK</span>
            </h1>
          </motion.div>
          
          <div className="flex gap-4">
            <StatusBadge icon={<ShieldCheck size={12}/>} text="ENCRYPTED" color="text-green-500" />
            <StatusBadge icon={<Activity size={12}/>} text="LATENCY: 24ms" color="text-orange-500" />
          </div>
        </div>

        {/* CHAT INTERFACE */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="bg-white/[0.02] border border-white/10 rounded-[60px] overflow-hidden shadow-3xl backdrop-blur-3xl flex flex-col h-[65vh]"
        >
          {/* Top Bar */}
          <div className="p-8 border-b border-white/10 flex items-center justify-between bg-white/[0.01]">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-[22px] bg-gradient-to-br from-orange-600 to-orange-800 flex items-center justify-center shadow-xl shadow-orange-600/20">
                <Headset size={24} className="text-white" />
              </div>
              <div>
                <p className="text-white font-black uppercase tracking-widest text-[11px]">Mission Dispatch</p>
                <p className="text-green-500 text-[10px] font-bold flex items-center gap-2 italic animate-pulse">● SYSTEMS ONLINE</p>
              </div>
            </div>
            <div className="hidden md:flex flex-col items-end opacity-30">
               <p className="text-[9px] font-black uppercase tracking-widest">Protocol V3.2</p>
               <p className="text-[9px] font-black uppercase tracking-widest italic">Mountain-Mate Verified</p>
            </div>
          </div>

          {/* Messages Area */}
          <div 
            ref={scrollRef}
            className="flex-1 p-8 md:p-12 space-y-8 overflow-y-auto no-scrollbar scroll-smooth"
          >
            <AnimatePresence initial={false}>
              {messages.map((m, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={`flex flex-col ${m.from === "me" ? "items-end" : "items-start"}`}
                >
                  <div className="flex items-center gap-3 mb-2 px-2">
                    <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">
                      {m.from === "me" ? "Explorer" : "Fleet Support"}
                    </span>
                    <Clock size={10} className="text-white/10" />
                    <span className="text-[8px] font-black text-white/20 uppercase">{m.time}</span>
                  </div>
                  
                  <div
                    className={`max-w-[80%] md:max-w-[60%] rounded-[30px] px-8 py-5 text-sm md:text-base font-medium leading-relaxed border transition-all ${
                      m.from === "me"
                        ? "bg-gradient-to-br from-orange-600 to-orange-700 border-orange-500/30 text-white rounded-tr-none shadow-xl shadow-orange-600/10"
                        : "bg-white/[0.05] border-white/10 text-white/90 rounded-tl-none backdrop-blur-md"
                    }`}
                  >
                    {m.text}
                  </div>
                </motion.div>
              ))}

              {isTyping && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-start">
                   <div className="bg-white/[0.03] border border-white/5 rounded-[20px] px-6 py-4 flex gap-2">
                      <span className="w-1.5 h-1.5 bg-orange-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-orange-600 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                      <span className="w-1.5 h-1.5 bg-orange-600 rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
                   </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Input Area */}
          <div className="p-8 md:p-10 border-t border-white/10 bg-[#080808]">
            <div className="max-w-3xl mx-auto flex gap-4">
              <div className="relative flex-1 group">
                <div className="absolute -inset-1 bg-orange-600/20 blur-md opacity-0 group-focus-within:opacity-100 transition-opacity" />
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="TRANSMIT MESSAGE..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") send();
                  }}
                  className="relative w-full bg-white/[0.03] border border-white/10 rounded-[30px] px-8 py-5 text-white font-bold outline-none focus:border-orange-500 transition-all uppercase text-[11px] tracking-widest placeholder:text-white/20"
                />
              </div>
              <button 
                onClick={send} 
                disabled={!canSend} 
                className="w-16 h-16 rounded-[25px] bg-white text-black flex items-center justify-center hover:bg-orange-600 hover:text-white transition-all active:scale-90 disabled:opacity-20 disabled:grayscale shadow-2xl"
              >
                <Zap size={22} fill="currentColor" />
              </button>
            </div>
            <p className="text-center mt-6 text-[9px] font-black text-white/10 uppercase tracking-[0.4em] italic">End-to-End Encrypted Transmission</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// Sub-component for badges
const StatusBadge = ({ icon, text, color }) => (
  <div className={`flex items-center gap-3 px-5 py-2 rounded-full border border-white/5 bg-white/[0.02] backdrop-blur-md ${color}`}>
    {icon}
    <span className="text-[9px] font-black uppercase tracking-widest">{text}</span>
  </div>
);