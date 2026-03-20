import API from "../utils/api";
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Calendar, Star, X, Check, Loader2, Users, Plus, Minus, 
  Wifi, Car, Coffee, Thermometer, ShieldCheck, Phone, Info, 
  ChevronLeft, ChevronRight, FileText, ArrowRight, Compass, Heart, Search, TrendingUp,
  Sparkles // ✅ FIXED: Added Sparkles Import
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
  const [checkOutDate, setCheckOutDate] = useState('');
  
  const [showGuestMenu, setShowGuestMenu] = useState(false);
  const [roomCount, setRoomCount] = useState(1);
  const [adultCount, setAdultCount] = useState(2);
  const [childCount, setChildCount] = useState(0);
  const menuRef = useRef(null);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    document.body.style.overflow = selectedHotel ? "hidden" : "auto";
    if (selectedHotel) setCurrentImgIndex(0);
  }, [selectedHotel]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setShowGuestMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchHotels = async () => {
    setLoading(true);
    try {
      const response = await API.get("/hotel/search", {
        params: { 
          location: locationFilter.toLowerCase(),
          minPrice: minPrice || undefined,
          maxPrice: maxPrice || undefined,
          sort
        }
      });
      const list = response.data.data || response.data || [];
      setHotels(list);

      const ids = list.map((h) => h._id).filter(Boolean).join(",");
      if (ids) {
        const summary = await API.get("/review/summary", { params: { ids } });
        setRatingMap(summary.data?.data || {});
      }
    } catch (error) {
      setHotels([]);
      notify("Uplink Interrupted: Check Server Connection", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHotels(); }, []);

  const createBooking = async (hotel) => {
    try {
      const payload = {
        listingId: hotel._id,
        date: checkInDate || new Date().toISOString(),
        guests: adultCount + childCount,
        rooms: roomCount,
        amount: Number(hotel.pricePerNight) || 0,
      };
      const res = await API.post("/booking/create", payload);
      notify("Tactical Link Secured. Proceeding...", "success");
      window.location.href = `/booking/${res.data?._id || res.data?.data?._id}/confirm`;
    } catch (e) {
      notify("Fallback to WhatsApp Communication.", "info");
      const msg = `Namaste! I want to book ${hotel.hotelName}.\nCheck-In: ${checkInDate || 'TBD'}`;
      window.open(`https://wa.me/${hotel.contactNumber}?text=${encodeURIComponent(msg)}`, '_blank');
    }
  };

  const amenityIcons = {
    wifi: <Wifi size={14} />, parking: <Car size={14} />,
    breakfast: <Coffee size={14} />, hotWater: <Thermometer size={14} />,
    roomService: <Users size={14} />, mountainView: <MapPin size={14} />,
    restaurant: <Coffee size={14} />, powerBackup: <ShieldCheck size={14} />
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-orange-600 relative overflow-hidden font-sans">
      
      {/* --- SACRED AURA BACKGROUND --- */}
      <div className="fixed top-[-10%] left-[-10%] w-[800px] h-[800px] bg-orange-600/5 blur-[180px] rounded-full pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-yellow-600/5 blur-[150px] rounded-full pointer-events-none z-0" />

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative z-10 max-w-7xl mx-auto pt-40 pb-20 px-8">
        
        {/* --- HEADER --- */}
        <div className="text-center mb-32">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="inline-flex items-center gap-3 px-6 py-2 rounded-full border border-orange-600/20 bg-orange-600/5 backdrop-blur-xl mb-10">
            <Sparkles size={14} className="text-orange-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.5em] italic text-orange-400">Sanctuary Transmission Active</span>
          </motion.div>
          
          <h1 className="text-7xl md:text-[10rem] font-black italic uppercase tracking-tighter leading-[0.75] mb-16">
            ELITE <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-600 to-white animate-text-shimmer">STAYS.</span>
          </h1>

          {/* CAPSULE SEARCH BAR */}
          <div className="max-w-6xl mx-auto bg-white/5 backdrop-blur-3xl p-3 rounded-[55px] border border-white/10 flex flex-col lg:flex-row items-center gap-3 shadow-3xl">
            <div className="w-full lg:flex-[1.5] flex items-center gap-5 px-10 py-5 bg-white/[0.03] rounded-[40px] border border-white/5 focus-within:border-orange-500/40 transition-all">
              <Compass className="text-orange-600" size={22}/><input type="text" onChange={(e) => setLocationFilter(e.target.value)} placeholder="WHERE TO?" className="bg-transparent w-full text-white font-black uppercase text-[12px] tracking-widest outline-none placeholder:text-white/20 italic" />
            </div>
            <div className="w-full lg:flex-1 flex items-center gap-4 px-8 py-5 bg-white/[0.03] rounded-[40px] border border-white/5">
              <Calendar className="text-orange-600" size={20}/><input type="date" min={today} onChange={(e) => setCheckInDate(e.target.value)} className="bg-transparent w-full text-white font-black outline-none text-[12px] [color-scheme:dark] cursor-pointer" />
            </div>
            <div className="w-full lg:w-auto relative" ref={menuRef}>
              <div onClick={() => setShowGuestMenu(!showGuestMenu)} className="flex items-center gap-5 px-10 py-5 rounded-[40px] border border-white/5 bg-white/[0.03] hover:bg-white/[0.08] transition-all cursor-pointer min-w-[200px]">
                <Users className="text-orange-600" size={20}/><span className="text-white font-black text-[12px] uppercase italic tracking-widest">{adultCount + childCount} G / {roomCount} R</span>
              </div>
              <AnimatePresence>{showGuestMenu && (
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 10 }} exit={{ opacity: 0, y: 15 }} className="absolute top-full left-0 right-0 lg:w-[320px] bg-[#0d0d0d] border border-orange-900/20 p-10 rounded-[50px] z-[100] shadow-3xl space-y-8 mt-4 backdrop-blur-3xl">
                  {[{ label: "Rooms", val: roomCount, setter: setRoomCount, min: 1 }, { label: "Adults", val: adultCount, setter: setAdultCount, min: 1 }].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <p className="text-white/40 font-black text-[10px] uppercase tracking-widest">{item.label}</p>
                      <div className="flex items-center gap-6">
                        <button onClick={() => item.setter(Math.max(item.min, item.val - 1))} className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/10 text-white transition-colors"><Minus size={14}/></button>
                        <span className="text-white font-black text-sm italic w-4 text-center">{item.val}</span>
                        <button onClick={() => item.setter(item.val + 1)} className="w-10 h-10 rounded-full bg-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-600/20 transition-all active:scale-90"><Plus size={14}/></button>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}</AnimatePresence>
            </div>
            <button onClick={fetchHotels} className="w-full lg:w-auto bg-orange-600 text-white px-16 py-6 rounded-[40px] font-black uppercase text-[13px] tracking-[0.3em] hover:bg-white hover:text-black transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-3">
              <Search size={20} /> SCAN
            </button>
          </div>
        </div>

        {/* --- GRID --- */}
        {loading ? (
          <StaysGridSkeleton />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {hotels.map((hotel) => (
              <motion.div key={hotel._id} whileHover={{ y: -20 }} onClick={() => setSelectedHotel(hotel)} className="group cursor-pointer relative">
                <div className="relative h-[650px] rounded-[70px] overflow-hidden border border-white/5 shadow-3xl group-hover:border-orange-500/30 transition-all duration-700">
                  <img src={hotel.images?.[0]} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-all duration-1000 group-hover:scale-110" alt={hotel.hotelName} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                  
                  <div className="absolute top-10 left-10 bg-black/60 backdrop-blur-xl px-5 py-2 rounded-full border border-white/10 flex items-center gap-2 shadow-2xl">
                    <Star size={12} className="text-orange-500 fill-orange-500" />
                    <span className="text-white font-black text-[10px] tracking-widest">{ratingMap?.[hotel._id]?.avgRating ?? "NEW"}</span>
                  </div>
                  <div className="absolute top-10 right-10 bg-orange-600 px-6 py-2 rounded-full shadow-3xl shadow-orange-600/20">
                    <p className="text-white font-black text-[11px] italic">₹{hotel.pricePerNight}<span className="text-[8px] opacity-60 ml-1">/UNIT</span></p>
                  </div>

                  <div className="absolute bottom-12 left-12 right-12">
                    <p className="text-orange-500 text-[9px] font-black tracking-[0.4em] uppercase mb-4 italic flex items-center gap-2"><MapPin size={12}/> {hotel.location}</p>
                    <h3 className="text-4xl font-black text-white italic tracking-tighter leading-none uppercase mb-8 group-hover:text-orange-400 transition-colors">{hotel.hotelName}</h3>
                    <div className="flex items-center justify-between border-t border-white/10 pt-8">
                       <div className="flex gap-5">
                          {JSON.parse(hotel.amenities || "[]").slice(0, 3).map(am => (
                            <div key={am} className="text-white/30 group-hover:text-orange-500/60 transition-colors">{amenityIcons[am] || <Check size={14}/>}</div>
                          ))}
                       </div>
                       <button className="w-14 h-14 rounded-[25px] bg-white text-black flex items-center justify-center scale-0 group-hover:scale-100 transition-all duration-500 shadow-2xl hover:bg-orange-600 hover:text-white active:scale-90">
                         <ArrowRight size={24}/>
                       </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* --- PREMIER MODAL --- */}
      <AnimatePresence>
        {selectedHotel && (
          <div className="fixed inset-0 z-[5000] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedHotel(null)} className="absolute inset-0 bg-black/98 backdrop-blur-3xl" />

            <motion.div initial={{ scale: 0.9, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-7xl bg-[#0a0a0a] border border-orange-950/20 rounded-[80px] overflow-hidden shadow-3xl flex flex-col md:flex-row h-full max-h-[90vh]">
              
              <button onClick={() => setSelectedHotel(null)} className="absolute top-12 right-12 w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-white/40 hover:bg-orange-600 hover:text-white z-50 transition-all border border-white/10 active:scale-90 shadow-2xl"><X size={32}/></button>
              
              <div className="w-full md:w-1/2 relative bg-black flex flex-col border-r border-white/5 overflow-hidden">
                <div className="flex-1 relative flex items-center justify-center">
                    <img src={selectedHotel.images?.[currentImgIndex]} className="absolute inset-0 w-full h-full object-cover blur-3xl opacity-20 scale-150" alt="" />
                    <motion.img 
                        key={currentImgIndex} initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}
                        src={selectedHotel.images?.[currentImgIndex]} 
                        className="relative h-full w-full object-contain z-10 p-12 drop-shadow-[0_35px_35px_rgba(249,115,22,0.15)]" 
                    />
                </div>
                <div className="p-12 flex gap-5 overflow-x-auto no-scrollbar justify-center bg-gradient-to-t from-black to-transparent relative z-20">
                    {selectedHotel.images?.map((img, idx) => (
                        <img key={idx} src={img} onClick={() => setCurrentImgIndex(idx)} className={`w-24 h-24 rounded-[35px] object-cover cursor-pointer transition-all duration-500 border-4 ${currentImgIndex === idx ? 'border-orange-600 scale-110 shadow-orange-600/20' : 'border-white/5 opacity-40 hover:opacity-80'}`} />
                    ))}
                </div>
              </div>

              <div className="flex-1 p-16 overflow-y-auto no-scrollbar space-y-16 bg-[#0a0a0a]">
                <div className="space-y-6 text-left">
                  <div className="flex items-center gap-3 px-6 py-2 rounded-full border border-orange-600/30 w-fit bg-orange-600/5 backdrop-blur-xl">
                    <ShieldCheck className="text-orange-500" size={18} />
                    <span className="text-orange-400 font-black text-[10px] tracking-widest uppercase italic">Himalayan Protocol Verified</span>
                  </div>
                  <h2 className="text-6xl md:text-[5.5rem] font-black italic tracking-tighter uppercase leading-[0.85] text-white">{selectedHotel.hotelName} <br/> <span className="text-white/20">SANCTUARY.</span></h2>
                  <p className="flex items-center gap-3 text-orange-500 text-[12px] font-black uppercase tracking-[0.3em] italic pt-2"><MapPin size={20}/> {selectedHotel.location} Sector</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className="bg-white/[0.03] p-12 rounded-[55px] border border-white/5 space-y-5 shadow-inner">
                      <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] flex items-center gap-3 italic"><FileText size={20} className="text-orange-600"/> Intel Report</p>
                      <p className="text-white/60 text-sm font-medium leading-relaxed italic">{selectedHotel.description || "Mission-ready mountain habitat with tactical amenities."}</p>
                   </div>
                   
                   <div className="bg-gradient-to-br from-orange-600/10 to-orange-900/5 p-12 rounded-[55px] border border-orange-500/20 space-y-10 flex flex-col justify-between shadow-3xl shadow-orange-600/5">
                      <div className="flex justify-between items-center border-b border-white/5 pb-6">
                        <span className="text-[10px] font-black text-white/30 uppercase tracking-widest italic">Uplink Rate</span>
                        <span className="text-6xl font-black italic text-white tracking-tighter">₹{selectedHotel.pricePerNight}</span>
                      </div>
                      <button onClick={() => createBooking(selectedHotel)} className="w-full bg-white text-black py-8 rounded-[40px] font-black text-[13px] uppercase tracking-[0.5em] hover:bg-orange-600 hover:text-white transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-5 italic group">
                        <TrendingUp size={24} className="group-hover:translate-y-[-2px] transition-transform" /> INITIALIZE BOOKING
                      </button>
                   </div>
                </div>

                <div className="space-y-10">
                  <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] italic border-l-2 border-orange-600 pl-8">Facility Infrastructure</p>
                  <div className="flex flex-wrap gap-5">
                    {JSON.parse(selectedHotel.amenities || "[]").map(am => (
                      <div key={am} className="flex items-center gap-5 bg-white/[0.03] border border-white/5 px-10 py-6 rounded-[35px] group hover:border-orange-500/30 transition-all shadow-inner cursor-default">
                        <span className="text-orange-500 group-hover:scale-125 transition-transform">{amenityIcons[am] || <Check size={20}/>}</span>
                        <span className="font-black text-[11px] uppercase tracking-widest text-white/60 group-hover:text-white transition-colors">{am}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-orange-600/5 p-14 rounded-[65px] border border-orange-600/10 flex items-center justify-between group overflow-hidden relative shadow-2xl">
                    <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-orange-600/10 blur-[80px] rounded-full pointer-events-none" />
                    <div className="flex items-center gap-10 relative z-10 text-left">
                        <div className="w-20 h-20 rounded-3xl bg-orange-600 flex items-center justify-center text-white shadow-3xl shadow-orange-600/40"><Info size={36}/></div>
                        <p className="text-[13px] font-medium italic text-white/50 max-w-sm leading-relaxed">Standard Protocol: Transmissions are secured and routed directly to the Himalayan Sanctuary Manager.</p>
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