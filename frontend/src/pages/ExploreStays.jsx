import API from "../utils/api";
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Calendar, Star, X, Check, Loader2, Users, Plus, Minus, 
  Wifi, Car, Coffee, Thermometer, ShieldCheck, Phone, Info, 
  ChevronLeft, ChevronRight, FileText, ArrowRight, Compass, Heart, Search, TrendingUp,
  Sparkles, Zap, Waves, Wind
} from 'lucide-react';
import { StaysGridSkeleton } from "../components/Skeletons";
import { useNotify } from "../context/NotificationContext";
import { useAuth } from "../context/AuthContext";

const ExploreStays = () => {
  const { notify } = useNotify();
  const { user } = useAuth();
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ratingMap, setRatingMap] = useState({});
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [currentImgIndex, setCurrentImgIndex] = useState(0); 
  
  const [locationFilter, setLocationFilter] = useState('');
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("newest");
  const [checkInDate, setCheckInDate] = useState('');
  
  const [showGuestMenu, setShowGuestMenu] = useState(false);
  const [roomCount, setRoomCount] = useState(1);
  const [adultCount, setAdultCount] = useState(2);
  const menuRef = useRef(null);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    document.body.style.overflow = selectedHotel ? "hidden" : "auto";
  }, [selectedHotel]);

  const fetchHotels = async () => {
    setLoading(true);
    try {
      const response = await API.get("/hotel/search", {
        params: { location: locationFilter.toLowerCase(), minPrice, maxPrice, sort }
      });
      const list = response.data.data || response.data || [];
      setHotels(list);

      const ids = list.map((h) => h._id).join(",");
      if (ids) {
        const summary = await API.get("/review/summary", { params: { ids } });
        setRatingMap(summary.data?.data || {});
      }
    } catch (error) {
      notify("Uplink Interrupted", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHotels(); }, []);

  const amenityIcons = {
    wifi: <Wifi size={16} />, parking: <Car size={16} />,
    breakfast: <Coffee size={16} />, hotWater: <Thermometer size={16} />,
    mountainView: <Wind size={16} />, powerBackup: <Zap size={16} />,
    pool: <Waves size={16} />
  };

  return (
    <div className="min-h-screen bg-[#020202] text-white selection:bg-orange-600 font-sans selection:text-white">
      
      {/* GLOW OVERLAYS */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-orange-600/10 blur-[150px] rounded-full pointer-events-none z-0" />
      <div className="fixed bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-600/5 blur-[150px] rounded-full pointer-events-none z-0" />

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative z-10 max-w-[1400px] mx-auto pt-32 pb-20 px-6">
        
        {/* --- HERO SECTION --- */}
        <div className="mb-24 relative">
          <motion.div 
            initial={{ y: 30, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }}
            className="flex flex-col items-center text-center"
          >
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/5 bg-white/5 backdrop-blur-md mb-8">
              <Sparkles size={12} className="text-orange-500" />
              <span className="text-[9px] font-black uppercase tracking-[0.4em] text-white/60 italic">Elite Habitats Decoded</span>
            </div>
            
            <h1 className="text-6xl md:text-[9rem] font-black italic uppercase tracking-tighter leading-[0.8] mb-12">
              PRIME<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-white/80 to-orange-600/50">ESTATES.</span>
            </h1>

            {/* FLOATING SEARCH CAPSULE */}
            <div className="w-full max-w-5xl bg-[#0a0a0a]/80 backdrop-blur-3xl p-2 rounded-[40px] border border-white/10 flex flex-col md:flex-row items-center gap-2 shadow-[0_30px_100px_rgba(0,0,0,0.8)]">
              <div className="flex-1 flex items-center gap-4 px-8 py-4 bg-white/5 rounded-[30px] w-full">
                <Compass className="text-orange-500" size={18}/>
                <input 
                  type="text" 
                  onChange={(e) => setLocationFilter(e.target.value)}
                  placeholder="LOCATION SEARCH..." 
                  className="bg-transparent w-full text-[11px] font-black uppercase tracking-widest outline-none placeholder:text-white/20 italic" 
                />
              </div>
              <div className="flex-1 flex items-center gap-4 px-8 py-4 bg-white/5 rounded-[30px] w-full">
                <Calendar className="text-orange-500" size={18}/>
                <input type="date" min={today} className="bg-transparent w-full text-[11px] font-black outline-none [color-scheme:dark]" />
              </div>
              <button 
                onClick={fetchHotels}
                className="w-full md:w-auto bg-orange-600 hover:bg-white text-white hover:text-black px-10 py-5 rounded-[30px] font-black text-[11px] tracking-[0.2em] transition-all active:scale-95 flex items-center justify-center gap-2 italic"
              >
                SECURE ACCESS <ArrowRight size={16}/>
              </button>
            </div>
          </motion.div>
        </div>

        {/* --- STAYS GRID --- */}
        {loading ? (
          <StaysGridSkeleton />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {hotels.map((hotel, index) => (
              <motion.div 
                key={hotel._id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setSelectedHotel(hotel)}
                className="group relative bg-[#0a0a0a] rounded-[50px] overflow-hidden border border-white/5 hover:border-orange-500/30 transition-all duration-500 cursor-pointer shadow-2xl"
              >
                {/* IMAGE CONTAINER */}
                <div className="relative h-[450px] overflow-hidden">
                  <img 
                    src={hotel.images?.[0]} 
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 group-hover:rotate-1 opacity-80 group-hover:opacity-100" 
                    alt={hotel.hotelName} 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
                  
                  {/* FLOATING BADGE */}
                  <div className="absolute top-8 left-8 bg-black/50 backdrop-blur-2xl px-4 py-2 rounded-2xl border border-white/10 flex items-center gap-2">
                    <Star size={12} className="text-orange-500 fill-orange-500" />
                    <span className="text-[10px] font-black italic text-white">{ratingMap?.[hotel._id]?.avgRating || "NEW"}</span>
                  </div>

                  <div className="absolute top-8 right-8 bg-orange-600 text-white px-5 py-2 rounded-2xl font-black text-[12px] italic shadow-xl shadow-orange-950/50">
                    ₹{hotel.pricePerNight}
                  </div>
                </div>

                {/* CONTENT */}
                <div className="p-10 space-y-6">
                  <div className="space-y-2">
                    <p className="text-orange-500 text-[9px] font-black tracking-[0.4em] uppercase italic flex items-center gap-2">
                      <MapPin size={12}/> {hotel.location}
                    </p>
                    <h3 className="text-3xl font-black italic uppercase tracking-tighter text-white group-hover:text-orange-500 transition-colors">
                      {hotel.hotelName}
                    </h3>
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-white/5">
                    <div className="flex gap-4">
                      {JSON.parse(hotel.amenities || "[]").slice(0, 3).map(am => (
                        <div key={am} className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-white/40 group-hover:text-orange-400 transition-colors">
                          {amenityIcons[am] || <ShieldCheck size={16}/>}
                        </div>
                      ))}
                    </div>
                    <div className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-all duration-500">
                      <ArrowRight size={20} />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* --- PREMIER MODAL (RESTYLED) --- */}
      <AnimatePresence>
        {selectedHotel && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedHotel(null)} 
              className="absolute inset-0 bg-black/95 backdrop-blur-2xl" 
            />

            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-[1200px] h-full max-h-[85vh] bg-[#080808] border border-white/10 rounded-[60px] overflow-hidden flex flex-col md:flex-row shadow-[0_50px_200px_rgba(0,0,0,0.5)]"
            >
              {/* LEFT: MEDIA SESSION */}
              <div className="w-full md:w-1/2 relative h-1/2 md:h-auto border-r border-white/5">
                <AnimatePresence mode="wait">
                  <motion.img 
                    key={currentImgIndex}
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    src={selectedHotel.images?.[currentImgIndex]}
                    className="w-full h-full object-cover"
                  />
                </AnimatePresence>
                
                {/* IMAGE NAV */}
                <div className="absolute bottom-10 left-0 right-0 px-10 flex gap-3 overflow-x-auto no-scrollbar">
                  {selectedHotel.images?.map((img, i) => (
                    <img 
                      key={i} src={img} 
                      onClick={() => setCurrentImgIndex(i)}
                      className={`w-20 h-20 rounded-2xl object-cover cursor-pointer border-2 transition-all ${currentImgIndex === i ? 'border-orange-600 scale-105 shadow-lg' : 'border-transparent opacity-40 hover:opacity-100'}`}
                    />
                  ))}
                </div>
              </div>

              {/* RIGHT: INTEL SESSION */}
              <div className="flex-1 p-12 overflow-y-auto no-scrollbar space-y-12">
                <div className="flex justify-between items-start">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-orange-600/10 border border-orange-500/20 w-fit">
                      <ShieldCheck className="text-orange-500" size={14} />
                      <span className="text-[8px] font-black tracking-widest uppercase text-orange-400 italic">Vetted Sanctuary</span>
                    </div>
                    <h2 className="text-5xl font-black italic uppercase tracking-tighter leading-none">{selectedHotel.hotelName}</h2>
                    <p className="text-orange-500 font-black text-[10px] tracking-[0.3em] uppercase italic flex items-center gap-2"><MapPin size={16}/> {selectedHotel.location}</p>
                  </div>
                  <button onClick={() => setSelectedHotel(null)} className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center hover:bg-red-500 transition-colors">
                    <X size={24}/>
                  </button>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] italic">Intel Summary</p>
                  <p className="text-white/60 text-sm leading-relaxed font-medium italic">{selectedHotel.description || "Mountain-grade habitat designed for elite explorers."}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="p-8 bg-white/5 rounded-[40px] border border-white/5">
                      <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-2 italic">Standard Rate</p>
                      <p className="text-4xl font-black italic">₹{selectedHotel.pricePerNight}<span className="text-[10px] text-white/20 ml-2">/UNIT</span></p>
                   </div>
                   <div className="p-8 bg-orange-600 rounded-[40px] flex items-center justify-center cursor-pointer hover:bg-white hover:text-black transition-all group shadow-xl shadow-orange-950/20">
                      <div className="text-center">
                        <p className="text-[10px] font-black tracking-widest uppercase mb-1">Finalize</p>
                        <p className="text-[14px] font-black tracking-[0.2em] italic uppercase group-hover:scale-110 transition-transform">BOOK NOW</p>
                      </div>
                   </div>
                </div>

                <div className="space-y-6">
                  <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] italic border-l border-orange-600 pl-4">Inclusions</p>
                  <div className="flex flex-wrap gap-3">
                    {JSON.parse(selectedHotel.amenities || "[]").map(am => (
                      <div key={am} className="flex items-center gap-3 bg-white/5 px-6 py-4 rounded-2xl border border-white/5 hover:border-orange-500/40 transition-all cursor-default group">
                        <span className="text-orange-500 group-hover:scale-110 transition-transform">{amenityIcons[am] || <Check size={14}/>}</span>
                        <span className="text-[9px] font-black uppercase tracking-widest text-white/50 group-hover:text-white">{am}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ExploreStays;