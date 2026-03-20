import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, BrainCircuit, ArrowRight, Zap } from 'lucide-react';

const AIAdvisor = ({ currentDestination }) => {
  const [isThinking, setIsThinking] = useState(true);
  const [suggestion, setSuggestion] = useState(null);

  useEffect(() => {
    // Mock AI Logic: In real, this will call your backend AI route
    const timer = setTimeout(() => {
      setIsThinking(false);
      setSuggestion({
        title: "Tungnath Sky-View Camp",
        reason: `Since you're planning for ${currentDestination || 'Chopta'}, the weather is perfect for high-altitude camping. This stay has a 4.9 rating from solo trekkers.`,
        discount: "15% OFF for M-Mate Users"
      });
    }, 2500);
    return () => clearTimeout(timer);
  }, [currentDestination]);

  return (
    <div className="bg-[#0a0a0a] border border-orange-600/20 rounded-[40px] p-8 relative overflow-hidden group shadow-2xl">
      <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-all">
        <BrainCircuit size={100} className="text-orange-500" />
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-10 h-10 bg-orange-600 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(234,88,12,0.4)]">
            <Sparkles size={20} className="text-white animate-pulse" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/50 italic">Mountain-Mate Intelligence</span>
        </div>

        <AnimatePresence mode="wait">
          {isThinking ? (
            <motion.div 
              key="loader"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="space-y-4 py-4"
            >
              <div className="h-4 bg-white/5 rounded-full w-3/4 animate-pulse"></div>
              <div className="h-4 bg-white/5 rounded-full w-1/2 animate-pulse"></div>
              <p className="text-[10px] font-bold text-orange-500/50 uppercase italic tracking-widest">Analyzing Himalayan Terrain Data...</p>
            </motion.div>
          ) : (
            <motion.div 
              key="content"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <h3 className="text-2xl font-black italic uppercase tracking-tighter leading-none">
                Elite Recommendation: <br/> <span className="text-orange-500">{suggestion.title}</span>
              </h3>
              <p className="text-white/40 text-[11px] font-medium leading-relaxed uppercase tracking-wider">
                "{suggestion.reason}"
              </p>
              
              <div className="flex items-center justify-between pt-6 border-t border-white/5">
                <div className="flex items-center gap-2 text-green-500 text-[9px] font-black uppercase tracking-widest">
                  <Zap size={12} /> {suggestion.discount}
                </div>
                <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white hover:text-orange-500 transition-colors group/btn">
                  View Detail <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AIAdvisor;