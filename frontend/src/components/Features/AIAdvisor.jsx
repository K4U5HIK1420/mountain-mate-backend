import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, BrainCircuit, Send, Bot, User, Terminal, Globe, Zap, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import API from '../../utils/api';

const AIAdvisor = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "SYSTEM ONLINE. Himalayan Intelligence is active. I can scan our database for elite stays, shared rides, or weather intel. What are your coordinates, Pilot?" }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  const suggestions = [
    "Best stays in Guptakashi?",
    "Weather in Kedarnath?",
    "Available rides for Chopta?",
    "Safety tips for trekking?"
  ];

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (forcedText = null) => {
    const textToSend = forcedText || input;
    if (!textToSend.trim() || isTyping) return;

    const userMsg = { role: 'user', content: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const res = await API.post("/ai/chat", { prompt: textToSend });
      const aiResponse = { role: 'assistant', content: res.data.answer };
      setMessages(prev => [...prev, aiResponse]);
    } catch (err) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "UPLINK ERROR: Neural connection failed. Manual Override: Please check your internet or retry transmission." 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col bg-[#050505] rounded-[50px] border border-white/5 overflow-hidden shadow-3xl relative">
      
      {/* HEADER */}
      <div className="p-8 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-600/20">
            <BrainCircuit className="text-white" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black italic uppercase tracking-tighter text-white">M-Mate Neural Link</h2>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.3em]">Direct Database Access Enabled</span>
            </div>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/5">
           <Globe size={12} className="text-orange-500" />
           <span className="text-[8px] font-black text-white/50 tracking-widest uppercase italic">Real-time Intel</span>
        </div>
      </div>

      {/* MESSAGES AREA */}
      <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
        {messages.map((msg, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${msg.role === 'user' ? 'bg-orange-600 border-orange-500 text-white shadow-lg shadow-orange-600/20' : 'bg-white/5 border-white/10 text-orange-500'}`}>
                {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
              </div>
              
              <div className={`p-6 rounded-[30px] shadow-2xl ${msg.role === 'user' ? 'bg-white/10 text-white rounded-tr-none' : 'bg-[#0d0d0d] text-white/80 border border-white/5 rounded-tl-none'}`}>
                {/* CRITICAL FIX: Removed className from ReactMarkdown to prevent Assertion Error. 
                   Styles are now applied through the wrapper div and components prop.
                */}
                <div className="text-[11px] font-medium leading-relaxed italic prose prose-invert max-w-none">
                  <ReactMarkdown 
                    components={{
                      p: ({node, ...props}) => <p className="mb-0 inline" {...props} />,
                      strong: ({node, ...props}) => <strong className="text-orange-500 font-bold" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc ml-4 my-2" {...props} />,
                      li: ({node, ...props}) => <li className="mb-1" {...props} />,
                      a: ({node, ...props}) => <a className="text-orange-400 underline" {...props} />
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
        {isTyping && (
          <div className="flex justify-start items-center gap-3">
             <div className="bg-white/5 px-6 py-4 rounded-full border border-white/5 flex gap-2">
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce [animation-delay:0.4s]" />
             </div>
             <span className="text-[7px] font-black text-white/20 uppercase tracking-[0.3em]">Scanning Listings...</span>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* INPUT & SUGGESTIONS */}
      <div className="p-8 bg-[#080808] border-t border-white/5">
        <div className="flex flex-wrap gap-2 mb-6 justify-center">
          {suggestions.map((text) => (
            <button 
              key={text}
              disabled={isTyping}
              onClick={() => handleSend(text)}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-[8px] font-black uppercase tracking-widest text-white/40 hover:text-orange-500 hover:border-orange-500/50 hover:bg-orange-500/5 transition-all italic active:scale-95 disabled:opacity-50"
            >
              {text}
            </button>
          ))}
        </div>

        <div className="relative max-w-4xl mx-auto group">
          <div className="absolute inset-0 bg-orange-600/10 blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
          <div className="relative flex items-center bg-[#0d0d0d] border border-white/10 rounded-[35px] p-2 pr-4 focus-within:border-orange-500/50 transition-all">
            <div className="px-5 text-white/20"><Terminal size={20} /></div>
            <input 
              value={input}
              disabled={isTyping}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder={isTyping ? "PROCESSING COORDINATES..." : "ASK FOR STAYS, RIDES, OR WEATHER..."}
              className="flex-1 bg-transparent py-5 text-[12px] font-black uppercase tracking-widest text-white outline-none placeholder:text-white/5 italic disabled:cursor-not-allowed"
            />
            <button 
              onClick={() => handleSend()}
              disabled={isTyping || !input.trim()}
              className="w-14 h-14 bg-orange-600 hover:bg-white text-white hover:text-black rounded-2xl flex items-center justify-center transition-all active:scale-90 shadow-xl shadow-orange-600/20 disabled:bg-white/10 disabled:text-white/20"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
        <p className="text-center text-[7px] font-black text-white/10 uppercase tracking-[0.5em] mt-6 italic">Secure neural transmission encrypted via M-Mate protocol</p>
      </div>
    </div>
  );
};

export default AIAdvisor;