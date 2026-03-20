import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, User } from 'lucide-react';

const LiveChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");

  return (
    <div className="fixed bottom-8 right-8 z-[100]">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="mb-6 w-80 md:w-96 bg-[#0a0a0a] border border-white/10 rounded-[40px] shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Chat Header */}
            <div className="bg-orange-600 p-6 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-black rounded-2xl flex items-center justify-center font-black italic">M</div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest leading-none">Mate Support</h4>
                  <p className="text-[8px] font-bold uppercase tracking-widest opacity-60">Online - Expedition Control</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:rotate-90 transition-transform"><X size={20}/></button>
            </div>

            {/* Messages Area */}
            <div className="h-80 p-6 overflow-y-auto space-y-4 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-orange-600/20 flex items-center justify-center flex-shrink-0"><User size={14} className="text-orange-500"/></div>
                <div className="bg-white/5 p-4 rounded-[20px] rounded-tl-none border border-white/5 text-[11px] font-medium text-white/60 leading-relaxed uppercase tracking-wider">
                  Namaste Shardul! How can I help with your Uttarakhand expedition today?
                </div>
              </div>
            </div>

            {/* Input Area */}
            <div className="p-6 bg-black border-t border-white/5 flex gap-3">
              <input 
                type="text" 
                placeholder="Type transmission..."
                className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:border-orange-500"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <button className="w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center hover:scale-105 transition-all shadow-lg active:scale-95">
                <Send size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <motion.button 
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-orange-600 rounded-[25px] flex items-center justify-center text-white shadow-[0_20px_50px_rgba(234,88,12,0.4)] relative group"
      >
        <div className="absolute inset-0 bg-orange-600 rounded-[25px] animate-ping opacity-20"></div>
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </motion.button>
    </div>
  );
};

export default LiveChat;