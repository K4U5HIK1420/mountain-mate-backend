import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, MapPin, IndianRupee, ArrowRight, Star, Heart, Filter, Zap } from "lucide-react";
import API from "../utils/api";

export default function Recommendations() {
  const [location, setLocation] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const mockRecommendations = [
        {
          id: 1,
          name: "Kedarnath Base Camp Premium",
          location: "Guptakashi",
          price: 3500,
          rating: 4.8,
          image: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=600",
          description: "Luxury stay with panoramic mountain views and expert local guides.",
          tags: ["Premium", "Guided"],
          aiScore: 95,
          matchReason: "Perfect for adventure"
        },
        {
          id: 2,
          name: "Riverside Retreat Shivpuri",
          location: "Shivpuri",
          price: 2200,
          rating: 4.6,
          image: "https://images.unsplash.com/photo-1571896349842-33c42a7615?q=80&w=600",
          description: "Riverside luxury tents with rafting packages and bonfire nights.",
          tags: ["Rafting", "Adventure"],
          aiScore: 88,
          matchReason: "Great for water sports"
        },
        {
          id: 3,
          name: "Himalayan Eco Lodge",
          location: "Sonprayag",
          price: 1800,
          rating: 4.7,
          image: "https://images.unsplash.com/photo-1566073791251-50a00e745f?q=80&w=600",
          description: "Eco-friendly lodge with sustainable practices and local culture.",
          tags: ["Eco", "Budget"],
          aiScore: 82,
          matchReason: "Ideal for eco-conscious"
        }
      ];

      let filtered = mockRecommendations;
      if (location) filtered = filtered.filter(item => item.location.toLowerCase().includes(location.toLowerCase()));
      if (maxPrice) filtered = filtered.filter(item => item.price <= parseInt(maxPrice));

      setItems(filtered);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-orange-600 font-sans relative overflow-x-hidden">
      
      {/* --- BACKGROUND AURA --- */}
      <div className="fixed top-0 left-1/4 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-orange-950/20 blur-[100px] md:blur-[180px] rounded-full pointer-events-none z-0" />
      <div className="fixed bottom-0 right-1/4 w-[250px] md:w-[500px] h-[250px] md:h-[500px] bg-yellow-950/10 blur-[80px] md:blur-[150px] rounded-full pointer-events-none z-0" />

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative z-10 max-w-7xl mx-auto pt-32 md:pt-44 pb-24 px-4 md:px-8">
        
        {/* --- HEADER --- */}
        <div className="text-center mb-12 md:mb-20">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center gap-3 px-5 py-2 rounded-full border border-orange-500/30 bg-orange-950/20 backdrop-blur-xl mb-6 md:mb-8"
          >
            <Zap className="text-orange-500 animate-pulse" size={16} />
            <span className="text-[8px] md:text-[10px] font-black tracking-[0.4em] uppercase text-orange-400">
              AI-Powered Intel
            </span>
          </motion.div>
          
          <h1 className="text-4xl md:text-8xl font-black italic uppercase tracking-tighter leading-[0.9] mb-6">
            CURATED FOR <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-yellow-500 to-white">THE BRAVE.</span>
          </h1>
          <p className="text-sm md:text-lg text-white/40 max-w-xl mx-auto italic font-medium">
            Tactical Himalayan experiences mapped to your specific expedition style.
          </p>
        </div>

        {/* --- FILTERS (Responsive) --- */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="max-w-4xl mx-auto bg-white/[0.03] border border-orange-900/20 rounded-[30px] md:rounded-[45px] p-2 md:p-3 mb-16 backdrop-blur-3xl shadow-2xl"
        >
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 flex items-center gap-4 px-6 py-4 bg-white/[0.03] rounded-[22px] md:rounded-[35px] border border-white/5 focus-within:border-orange-600/40 transition-all">
              <MapPin size={18} className="text-orange-500" />
              <input 
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="SECTOR..." 
                className="bg-transparent w-full text-white font-black uppercase text-[10px] md:text-[12px] tracking-widest outline-none placeholder:text-white/20" 
              />
            </div>
            <div className="flex-1 flex items-center gap-4 px-6 py-4 bg-white/[0.03] rounded-[22px] md:rounded-[35px] border border-white/5 focus-within:border-orange-600/40 transition-all">
              <IndianRupee size={18} className="text-orange-500" />
              <input 
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="MAX BUDGET..." 
                className="bg-transparent w-full text-white font-black uppercase text-[10px] md:text-[12px] tracking-widest outline-none placeholder:text-white/20" 
              />
            </div>
            <button 
              onClick={load}
              className="bg-orange-600 hover:bg-white hover:text-black text-white px-8 md:px-12 py-4 md:py-5 rounded-[22px] md:rounded-[35px] font-black uppercase text-[10px] md:text-[12px] tracking-[0.3em] transition-all flex items-center justify-center gap-3 shadow-xl shadow-orange-950/20"
            >
              <Filter size={16} /> SCAN
            </button>
          </div>
        </motion.div>

        {/* --- GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
          <AnimatePresence mode="popLayout">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="h-[400px] md:h-[550px] bg-white/5 rounded-[40px] md:rounded-[60px] animate-pulse border border-white/5" />
              ))
            ) : (
              items.map((item, index) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -15 }}
                  className="group relative h-[450px] md:h-[600px] rounded-[40px] md:rounded-[60px] overflow-hidden border border-orange-950/10 shadow-3xl transition-all duration-500"
                >
                  {/* AI Match Badge */}
                  <div className="absolute top-6 right-6 z-20">
                    <div className="bg-orange-600 text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-2xl">
                      <Sparkles size={12} fill="currentColor" /> {item.aiScore}% MATCH
                    </div>
                  </div>

                  <img src={item.image} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-1000" alt={item.name} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                  {/* Content */}
                  <div className="absolute bottom-8 md:bottom-12 left-8 md:left-12 right-8">
                    <p className="text-orange-500 text-[8px] md:text-[9px] font-black tracking-[0.4em] uppercase mb-3 italic flex items-center gap-2">
                       <MapPin size={12}/> {item.location}
                    </p>
                    <h3 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter text-white mb-4 leading-none">
                      {item.name}
                    </h3>
                    
                    <div className="flex gap-2 mb-6">
                       {item.tags.map(tag => (
                         <span key={tag} className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-[7px] font-black uppercase tracking-widest border border-white/10 text-white/60">{tag}</span>
                       ))}
                    </div>

                    <div className="bg-orange-600/10 border border-orange-500/20 rounded-2xl p-4 mb-8">
                        <p className="text-[8px] font-black text-orange-400 uppercase tracking-widest mb-1 italic flex items-center gap-2">
                          <Zap size={10} fill="currentColor"/> AI Rationale
                        </p>
                        <p className="text-[11px] text-white/60 font-medium italic leading-relaxed">{item.matchReason}</p>
                    </div>

                    <div className="flex items-center justify-between border-t border-orange-900/30 pt-6">
                      <p className="text-xl md:text-2xl font-black text-white italic">₹{item.price}<span className="text-[10px] text-white/30 ml-2">/UNIT</span></p>
                      <button className="w-10 h-10 md:w-14 md:h-14 rounded-2xl md:rounded-3xl bg-white text-black flex items-center justify-center shadow-2xl hover:bg-orange-600 hover:text-white transition-all">
                        <ArrowRight size={22}/>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* --- EMPTY STATE --- */}
        {!loading && items.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-32 border-2 border-dashed border-orange-900/20 rounded-[60px] bg-orange-950/5 px-6">
             <Sparkles size={48} className="text-orange-900 mx-auto mb-6" />
             <p className="text-white/20 font-black tracking-[0.5em] uppercase italic text-xl">Tactical Match Not Found</p>
             <button onClick={() => {setLocation(""); setMaxPrice(""); load();}} className="mt-8 text-orange-500 font-black uppercase text-[10px] tracking-widest border-b border-orange-500/30 pb-1">Reset Intelligence Grid</button>
          </motion.div>
        )}

      </motion.div>
    </div>
  );
}