import { io } from "socket.io-client";
const socket = io("http://localhost:5000");
import API from "../utils/api";
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Calendar, Search, Star, Hotel, X, Check, Loader2, Bed, Users, Plus, Minus } from 'lucide-react';

const ExploreStays = () => {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedHotel, setSelectedHotel] = useState(null);
  
  // Search States
  const [locationFilter, setLocationFilter] = useState('');
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  
  // Guest/Room Popover States
  const [showGuestMenu, setShowGuestMenu] = useState(false);
  const [roomCount, setRoomCount] = useState(1);
  const [adultCount, setAdultCount] = useState(2);
  const [childCount, setChildCount] = useState(0);
  const menuRef = useRef(null);

  const today = new Date().toISOString().split("T")[0];

  // Outside click handle
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowGuestMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchHotels = async () => {
    setLoading(true);
    try {
      const response = await API.get("/hotel/search", {
        params: { location: locationFilter.toLowerCase() }
      });
      setHotels(response.data.data || response.data);
    } catch (error) {
      setHotels([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHotels(); }, []);

  return (
    <div className="relative min-h-screen pt-40 pb-32 px-8">
      {/* --- GLOBAL BACKGROUND --- */}
      <img src="https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=2500" className="fixed inset-0 w-full h-full object-cover grayscale-[30%]" alt="BG" />
      <div className="fixed inset-0 bg-black/70 backdrop-blur-[4px] z-[-1]"></div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative z-10 max-w-7xl mx-auto">
        
        {/* --- MASTER SEARCH BAR (Check-In & Check-Out Added) --- */}
        <div className="max-w-7xl mx-auto mb-32 px-4 relative z-[100]">
          <h1 className="text-7xl font-black text-white italic uppercase tracking-tighter mb-12 text-center text-glow">
            MOUNTAIN <span className="text-orange-600">STAYS.</span>
          </h1>
          
          <div className="bg-white/5 backdrop-blur-3xl p-3 rounded-[50px] border border-white/10 flex flex-col lg:flex-row items-stretch gap-2 shadow-[0_25px_60px_rgba(0,0,0,0.8)] relative">
            
            {/* 1. Destination */}
            <div className="flex-[1.2] flex items-center gap-4 px-8 py-6 bg-white/5 rounded-[40px] border border-white/5 focus-within:bg-white/10 transition-all group">
              <MapPin className="text-orange-600 shrink-0" size={22}/>
              <input type="text" onChange={(e) => setLocationFilter(e.target.value)} placeholder="WHERE TO?" className="bg-transparent w-full text-white font-black outline-none uppercase placeholder:text-white/10 text-xs tracking-widest" />
            </div>

            {/* 2. Check-In Box */}
            <div className="flex-1 flex items-center gap-4 px-6 py-6 bg-white/5 rounded-[40px] border border-white/5 focus-within:bg-white/10 transition-all">
              <Calendar className="text-orange-600 shrink-0" size={20}/>
              <div className="w-full text-left">
                <p className="text-[8px] font-black text-white/30 uppercase tracking-tighter">Check-In</p>
                <input type="date" min={today} onChange={(e) => setCheckInDate(e.target.value)} className="bg-transparent w-full text-white font-black outline-none uppercase text-[11px] [color-scheme:dark]" />
              </div>
            </div>

            {/* 3. Check-Out Box */}
            <div className="flex-1 flex items-center gap-4 px-6 py-6 bg-white/5 rounded-[40px] border border-white/5 focus-within:bg-white/10 transition-all">
              <Calendar className="text-orange-600 shrink-0" size={20}/>
              <div className="w-full text-left">
                <p className="text-[8px] font-black text-white/30 uppercase tracking-tighter">Check-Out</p>
                <input type="date" min={checkInDate || today} onChange={(e) => setCheckOutDate(e.target.value)} className="bg-transparent w-full text-white font-black outline-none uppercase text-[11px] [color-scheme:dark]" />
              </div>
            </div>

            {/* 4. Triple Selector Popover */}
            <div className="flex-1 relative" ref={menuRef}>
              <div 
                onClick={() => setShowGuestMenu(!showGuestMenu)}
                className={`flex items-center justify-center gap-4 px-6 py-6 rounded-[40px] border transition-all cursor-pointer h-full ${showGuestMenu ? 'bg-white/15 border-orange-600/50' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
              >
                <Users className="text-orange-600 shrink-0" size={20}/>
                <div className="text-left">
                    <p className="text-[8px] font-black text-white/30 uppercase tracking-tighter">Guests & Rooms</p>
                    <span className="text-white font-black uppercase text-[10px] tracking-tighter whitespace-nowrap">
                        {adultCount + childCount} G / {roomCount} R
                    </span>
                </div>
              </div>

              <AnimatePresence>
                {showGuestMenu && (
                  <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 5 }} exit={{ opacity: 0, y: 15 }} className="absolute top-[105%] right-0 min-w-[340px] bg-[#0d0d0d] border border-white/10 p-10 rounded-[40px] shadow-[0_40px_80px_rgba(0,0,0,0.9)] z-[200] space-y-10">
                    {[
                      { label: "Rooms", sub: "(Max 20)", val: roomCount, setter: setRoomCount, min: 1 },
                      { label: "Adults", sub: "(17+ yr)", val: adultCount, setter: setAdultCount, min: 1 },
                      { label: "Children", sub: "(0-17 yr)", val: childCount, setter: setChildCount, min: 0 }
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-black text-[11px] uppercase tracking-widest">{item.label}</p>
                          <p className="text-white/20 font-black text-[8px] uppercase tracking-widest">{item.sub}</p>
                        </div>
                        <div className="flex items-center bg-black/50 p-1.5 rounded-full border border-white/5 shadow-inner">
                          <button onClick={(e) => { e.stopPropagation(); item.setter(Math.max(item.min, item.val - 1)); }} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-red-600 transition-all"><Minus size={14}/></button>
                          <span className="text-white font-black text-xl w-10 text-center italic">{item.val}</span>
                          <button onClick={(e) => { e.stopPropagation(); item.setter(item.val + 1); }} className="w-10 h-10 rounded-full bg-orange-600 flex items-center justify-center text-white hover:bg-white hover:text-black shadow-lg shadow-orange-600/20 transition-all"><Plus size={14}/></button>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 5. Search Button */}
            <button onClick={fetchHotels} className="bg-orange-600 text-white px-14 py-6 rounded-[40px] font-black uppercase text-xs tracking-[0.3em] hover:bg-white hover:text-black transition-all shadow-xl active:scale-95 whitespace-nowrap ml-1">
              Search
            </button>
          </div>
        </div>

        {/* --- HOTELS GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 relative z-10 mt-20">
          {loading ? (
            <div className="col-span-full flex flex-col items-center justify-center py-40">
                <Loader2 className="animate-spin text-orange-600" size={50} />
            </div>
          ) : hotels.map((hotel) => (
            <motion.div key={hotel._id} whileHover={{ y: -15 }} className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[60px] overflow-hidden flex flex-col group hover:border-orange-600/40 transition-all shadow-2xl relative">
              <div className="h-64 relative overflow-hidden">
                <img src={hotel.images?.[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt="hotel" />
                <div className="absolute top-6 left-6 bg-black/50 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 border border-white/10 font-black text-[10px] text-white"><Star size={12} className="text-orange-600 fill-orange-600" /> 4.8</div>
              </div>
              <div className="p-10 space-y-6">
                <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter group-hover:text-orange-500 transition-colors leading-none">{hotel.hotelName}</h3>
                <div className="flex justify-between items-center text-white/40 font-black text-[10px] tracking-widest uppercase py-4 border-y border-white/5">
                  <span className="flex items-center gap-2"><MapPin size={14} className="text-orange-600"/> {hotel.location}</span>
                  <span className="text-2xl text-white italic font-black">₹{hotel.pricePerNight}</span>
                </div>
                <button onClick={() => setSelectedHotel(hotel)} className="w-full bg-white text-black py-7 rounded-[35px] font-black uppercase text-[12px] tracking-widest shadow-2xl hover:bg-orange-600 hover:text-white transition-all active:scale-95">Check Availability</button>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default ExploreStays;