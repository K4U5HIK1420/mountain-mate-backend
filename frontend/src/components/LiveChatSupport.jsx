import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Minimize2, Maximize2, User, Bot } from 'lucide-react';

const LiveChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "🏔️ Welcome to Mountain Mate! I'm here to help you plan your perfect Himalayan journey.",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate bot response
    setTimeout(() => {
      const botResponses = [
        "I can help you find the perfect stays in Uttarakhand! Would you like to see our premium properties?",
        "Our AI recommendation engine suggests personalized trips based on your preferences. Shall I show you some options?",
        "Planning a Kedarnath Yatra? I can help you book verified stays and transportation.",
        "Looking for adventure activities? I can suggest the best trekking routes and local experiences!"
      ];
      
      const randomResponse = botResponses[Math.floor(Math.random() * botResponses.length)];
      
      const botMessage = {
        id: Date.now() + 1,
        text: randomResponse,
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setIsMinimized(false);
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <motion.button
        onClick={toggleChat}
        className="fixed bottom-6 right-6 z-[100] bg-gradient-to-br from-[#F97316] to-[#EA580C] text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-all duration-300 border border-white/20"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <MessageSquare size={24} />
        {isOpen && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"
          />
        )}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`fixed bottom-24 right-6 z-[100] w-96 bg-[#050505] border border-white/10 rounded-2xl shadow-2xl backdrop-blur-3xl overflow-hidden flex flex-col ${
              isMinimized ? 'h-14' : 'h-[500px]'
            }`}
          >
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-[#F97316] to-[#EA580C] text-white p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <Bot size={20} />
                <div className="text-left">
                  <h3 className="font-bold text-sm leading-none">M-Mate Intelligence</h3>
                  <p className="text-[10px] opacity-70 mt-1 uppercase tracking-widest font-black italic">Expedition Support</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMinimize}
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                >
                  {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                </button>
                <button
                  onClick={toggleChat}
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Chat Messages */}
            {!isMinimized && (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[85%] p-4 rounded-2xl ${
                        message.sender === 'user'
                          ? 'bg-orange-600 text-white shadow-lg'
                          : 'bg-white/5 border border-white/10 text-white'
                      }`}>
                        <div className="flex items-start gap-2">
                          <p className="text-[13px] leading-relaxed font-medium">{message.text}</p>
                        </div>
                        <p className="text-[9px] opacity-40 mt-2 font-black uppercase tracking-tighter">
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                  
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-white/5 border border-white/10 p-3 rounded-2xl">
                        <div className="flex gap-1.5">
                          <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                          <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                          <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Chat Input */}
                <div className="p-4 border-t border-white/5 bg-white/[0.02]">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask for directions or stays..."
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white placeholder:text-white/20 focus:outline-none focus:border-orange-600 transition-all font-medium"
                    />
                    <motion.button
                      onClick={sendMessage}
                      disabled={!inputMessage.trim()}
                      className="bg-orange-600 text-white p-3 rounded-xl disabled:opacity-30 disabled:grayscale hover:bg-white hover:text-black transition-all shadow-lg"
                      whileTap={{ scale: 0.9 }}
                    >
                      <Send size={18} />
                    </motion.button>
                  </div>
                  <div className="flex items-center justify-between mt-3 px-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/20 italic">AI Powered Engine</span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-orange-600/50 italic">Sync Active</span>
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