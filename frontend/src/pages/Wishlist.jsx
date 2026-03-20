import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Trash2, ArrowRight, MapPin, Navigation, Sparkles } from "lucide-react";
import API from "../utils/api";
import { useNotify } from "../context/NotificationContext";

export default function Wishlist() {
  const { notify } = useNotify();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await API.get("/user/wishlist/items");
      setItems(res.data?.data || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const remove = async (itemType, id) => {
    try {
      await API.post("/user/wishlist/toggle", { itemType, itemId: id });
      notify("Mission Aborted: Item Purged", "success");
      setItems((prev) => prev.filter((x) => String(x.item?._id) !== String(id)));
    } catch {
      notify("Authentication Required", "info");
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-32 md:pt-44 pb-24 px-4 md:px-8 font-sans relative overflow-x-hidden">
      
      {/* --- BACKGROUND AURA --- */}
      <div className="fixed top-0 right-0 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-orange-600/5 blur-[100px] md:blur-[150px] rounded-full pointer-events-none z-0" />
      <div className="fixed bottom-0 left-0 w-[200px] md:w-[400px] h-[200px] md:h-[400px] bg-white/5 blur-[80px] md:blur-[120px] rounded-full pointer-events-none z-0" />

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative z-10 max-w-7xl mx-auto">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-16 md:mb-24">
          <div>
            <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex items-center gap-3 mb-4">
               <div className="w-2 h-2 rounded-full bg-orange-600 animate-pulse" />
               <p className="text-orange-500 font-black tracking-[0.5em] text-[8px] md:text-[10px] uppercase italic">Personal Archive</p>
            </motion.div>
            <h1 className="text-5xl md:text-8xl font-black italic uppercase tracking-tighter leading-none">
              SAVED <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-600 to-white">VAULT.</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-4 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[25px] px-6 py-4 shadow-2xl">
            <Heart size={20} className="text-orange-500 fill-orange-500" />
            <span className="text-white font-black uppercase tracking-widest text-[11px] italic">{items.length} ASSETS SECURED</span>
          </div>
        </div>

        {/* --- CONTENT --- */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-[400px] bg-white/5 rounded-[40px] animate-pulse border border-white/5" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-24 md:py-40 bg-white/[0.02] border border-dashed border-white/10 rounded-[50px] px-6">
            <Sparkles size={48} className="text-white/10 mx-auto mb-6" />
            <p className="text-white/20 font-black tracking-[0.5em] uppercase italic text-xl mb-10">Vault is Empty</p>
            <a href="/explore-stays" className="inline-flex items-center gap-4 bg-white text-black px-10 py-5 rounded-full font-black uppercase text-[10px] tracking-widest hover:bg-orange-600 hover:text-white transition-all shadow-3xl active:scale-95 italic">
               Scout Stays <ArrowRight size={18} />
            </a>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
            <AnimatePresence mode="popLayout">
              {items.map((x, idx) => (
                <motion.div
                  layout
                  key={`${x.itemType}-${x.item._id}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ y: -10 }}
                  className="group relative bg-[#0a0a0a] border border-white/5 rounded-[50px] overflow-hidden shadow-3xl transition-all duration-500 hover:border-orange-500/20"
                >
                  {/* Image Sector */}
                  <div className="h-[300px] relative overflow-hidden">
                    <img
                      src={x.item?.images?.[0] || "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1600"}
                      className="absolute inset-0 w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 group-hover:scale-110 transition-all duration-1000 opacity-80"
                      alt=""
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
                    
                    {/* Badge */}
                    <div className="absolute top-8 left-8 bg-orange-600 px-4 py-1.5 rounded-full shadow-2xl">
                       <p className="text-[8px] font-black uppercase tracking-widest text-white italic">{x.itemType}</p>
                    </div>

                    <div className="absolute bottom-6 left-8 right-8">
                       <h3 className="text-3xl font-black italic uppercase tracking-tighter text-white leading-none">
                         {x.item?.hotelName || x.item?.vehicleType || "SECURED"}
                       </h3>
                    </div>
                  </div>

                  {/* Info Sector */}
                  <div className="p-8 md:p-10 bg-gradient-to-b from-transparent to-black/40">
                    <div className="flex items-center gap-3 mb-10 text-white/40 font-bold uppercase text-[10px] tracking-widest italic">
                       {x.itemType === 'Hotel' ? <MapPin size={16} className="text-orange-500" /> : <Navigation size={16} className="text-orange-500" />}
                       <span className="truncate">{x.item?.location || `${x.item?.routeFrom} → ${x.item?.routeTo}`}</span>
                    </div>

                    <div className="flex items-center justify-between gap-4 pt-8 border-t border-white/5">
                      <a href={x.itemType === 'Hotel' ? '/explore-stays' : '/rides'} className="flex-1 bg-white text-black py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest text-center italic hover:bg-orange-600 hover:text-white transition-all shadow-xl active:scale-95">
                         View Tactical
                      </a>
                      <button 
                        onClick={() => remove(x.itemType, x.item._id)}
                        className="w-14 h-14 rounded-2xl bg-red-600/10 border border-red-600/20 flex items-center justify-center text-red-500 hover:bg-red-600 hover:text-white transition-all active:scale-90 shadow-lg shadow-red-900/10"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </div>
  );
}