import API from "../utils/api";
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Calendar, Star, X, Check, Loader2, Users, Plus, Minus, 
  Wifi, Car, Coffee, Thermometer, ShieldCheck, Phone, User, Info, 
  ChevronLeft, ChevronRight, FileText, Layout, ArrowRight, Wallet, Compass
} from 'lucide-react';
import { StaysGridSkeleton } from "../components/Skeletons";

const ExploreStays = () => {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [currentImgIndex, setCurrentImgIndex] = useState(0); 
  
  const [locationFilter, setLocationFilter] = useState('');
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
        params: { location: locationFilter.toLowerCase() }
      });
      setHotels(response.data.data || response.data || []);
    } catch (error) {
      setHotels([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHotels(); }, []);

  const handleBooking = (hotel) => {
    const message = `Namaste! I'm interested in booking ${hotel.hotelName}.\n📅 Check-In: ${checkInDate || 'TBD'}\n📅 Check-Out: ${checkOutDate || 'TBD'}\n👥 Guests: ${adultCount + childCount}\n🏨 Rooms: ${roomCount}`;
    window.open(`https://wa.me/${hotel.contactNumber}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const amenityIcons = {
    wifi: <Wifi size={14} />,
    parking: <Car size={14} />,
    breakfast: <Coffee size={14} />,
    hotWater: <Thermometer size={14} />,
    roomService: <Users size={14} />,
    mountainView: <MapPin size={14} />,
    restaurant: <Coffee size={14} />,
    powerBackup: <ShieldCheck size={14} />
  };

  return (
    <div className="relative min-h-screen text-white selection:bg-orange-600">

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative z-10 max-w-7xl mx-auto pt-32 pb-20 px-6">
        
        {/* --- PROFESSIONAL HERO SECTION --- */}
        <div className="text-center mb-24">
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-orange-500 font-black tracking-[0.6em] text-[10px] uppercase mb-4 italic">Experience the Himalayas</motion.p>
          <h1 className="text-7xl md:text-9xl font-black italic uppercase tracking-tighter leading-none mb-12 drop-shadow-2xl">
            ELITE <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-700">STAYS.</span>
          </h1>

          {/* Optimized Search Bar */}
          <div className="max-w-6xl mx-auto bg-white/5 backdrop-blur-3xl p-3 rounded-[50px] border border-white/10 flex flex-col lg:flex-row items-center gap-3 shadow-3xl">
            <div className="w-full lg:flex-[1.5] flex items-center gap-4 px-8 py-5 bg-white/[0.03] rounded-[35px] border border-white/5 focus-within:border-orange-500/50 transition-all">
              <Compass className="text-orange-500" size={20}/><input type="text" onChange={(e) => setLocationFilter(e.target.value)} placeholder="WHERE TO?" className="bg-transparent w-full text-white font-bold outline-none uppercase text-[11px] tracking-widest placeholder:text-white/20" />
            </div>
            <div className="w-full flex-1 flex items-center gap-4 px-6 py-5 bg-white/[0.03] rounded-[35px] border border-white/5">
              <Calendar className="text-orange-500" size={18}/><input type="date" min={today} onChange={(e) => setCheckInDate(e.target.value)} className="bg-transparent w-full text-white font-bold outline-none text-[11px] [color-scheme:dark] cursor-pointer" />
            </div>
            <div className="w-full flex-1 relative" ref={menuRef}>
              <div onClick={() => setShowGuestMenu(!showGuestMenu)} className="flex items-center justify-between gap-4 px-8 py-5 rounded-[35px] border border-white/5 bg-white/[0.03] h-full cursor-pointer hover:bg-white/[0.08] transition-all">
                <Users className="text-orange-500" size={18}/><span className="text-white font-bold text-[11px] tracking-tight">{adultCount + childCount} G / {roomCount} R</span>
              </div>
              <AnimatePresence>{showGuestMenu && (
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 5 }} exit={{ opacity: 0, y: 15 }} className="absolute top-[115%] left-0 right-0 bg-[#0d0d0d] border border-white/10 p-10 rounded-[40px] z-[100] shadow-3xl space-y-6">
                  {[{ label: "Rooms", val: roomCount, setter: setRoomCount, min: 1 }, { label: "Adults", val: adultCount, setter: setAdultCount, min: 1 }, { label: "Children", val: childCount, setter: setChildCount, min: 0 }].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <p className="text-white/40 font-black text-[10px] uppercase tracking-widest">{item.label}</p>
                      <div className="flex items-center gap-6">
                        <button onClick={(e) => { e.stopPropagation(); item.setter(Math.max(item.min, item.val - 1)); }} className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all"><Minus size={14}/></button>
                        <span className="text-white font-black text-sm w-4 text-center italic">{item.val}</span>
                        <button onClick={(e) => { e.stopPropagation(); item.setter(item.val + 1); }} className="w-9 h-9 rounded-full bg-orange-600 flex items-center justify-center shadow-lg"><Plus size={14}/></button>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}</AnimatePresence>
            </div>
            <button onClick={fetchHotels} className="w-full lg:w-auto bg-orange-600 text-white px-12 py-5 rounded-[35px] font-black uppercase text-[11px] tracking-[0.3em] hover:bg-white hover:text-black transition-all shadow-xl active:scale-95">Explore</button>
          </div>
        </div>

        {/* --- STAYS GRID --- */}
        {loading ? (
          <div className="pt-6">
            <StaysGridSkeleton />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {hotels.map((hotel) => (
              <motion.div
                key={hotel._id}
                whileHover={{ y: -15 }}
                whileTap={{ scale: 0.985 }}
                transition={{ type: "spring", stiffness: 360, damping: 28 }}
                onClick={() => setSelectedHotel(hotel)}
                className="group cursor-pointer"
              >
                <div className="relative h-[480px] rounded-[50px] overflow-hidden border border-white/5 shadow-2xl transition-all duration-700 group-hover:border-orange-500/40">
                  <img
                    src={hotel.images?.[0] || "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1600"}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                    alt={hotel.hotelName || "Stay"}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90"></div>
                  
                  <div className="absolute top-8 left-8 bg-black/50 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10 flex items-center gap-2">
                    <Star size={12} className="text-orange-500 fill-orange-500" />
                    <p className="text-white font-black text-[10px]">4.9</p>
                  </div>

                  <div className="absolute bottom-10 left-10 right-10">
                    <p className="text-orange-500 text-[9px] font-black tracking-[0.4em] uppercase mb-2 italic">{hotel.location}</p>
                    <h3 className="text-3xl font-black text-white italic tracking-tighter leading-none uppercase mb-4">{hotel.hotelName}</h3>
                    <div className="flex items-center justify-between pt-5 border-t border-white/10">
                      <p className="text-2xl font-black text-white italic">₹{hotel.pricePerNight}<span className="text-[10px] text-white/40 ml-1">/NIGHT</span></p>
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-orange-600 transition-colors">
                        <ArrowRight size={18}/>
                      </div>
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
          <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 md:p-10">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedHotel(null)} className="absolute inset-0 bg-black/98 backdrop-blur-2xl cursor-pointer" />

            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9 }} className="relative w-full max-w-7xl bg-[#0a0a0a] border border-white/10 rounded-[60px] overflow-hidden shadow-3xl flex flex-col md:flex-row h-full max-h-[85vh]">
              
              <button onClick={() => setSelectedHotel(null)} className="absolute top-8 right-8 w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-white/40 hover:text-white z-50 transition-all active:scale-90 border border-white/10"><X size={24}/></button>
              
              {/* Left Gallery */}
              <div className="w-full md:w-1/2 relative bg-black flex items-center justify-center border-r border-white/5 overflow-hidden">
                <img
                  src={selectedHotel.images?.[currentImgIndex]}
                  className="absolute inset-0 w-full h-full object-cover blur-3xl opacity-20 scale-125"
                  alt=""
                />
                <AnimatePresence mode="wait">
                  <motion.img 
                    key={currentImgIndex} src={selectedHotel.images?.[currentImgIndex]} 
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}
                    className="relative w-full h-full object-contain z-10" alt="" 
                  />
                </AnimatePresence>
                
                {selectedHotel.images?.length > 1 && (
                  <div className="absolute bottom-12 flex gap-3 z-30">
                    <button onClick={(e) => { e.stopPropagation(); setCurrentImgIndex(prev => prev === 0 ? selectedHotel.images.length-1 : prev-1); }} className="w-12 h-12 rounded-full bg-white/5 hover:bg-orange-600 transition-all flex items-center justify-center border border-white/10 shadow-2xl"><ChevronLeft size={20}/></button>
                    <button onClick={(e) => { e.stopPropagation(); setCurrentImgIndex(prev => prev === selectedHotel.images.length-1 ? 0 : prev+1); }} className="w-12 h-12 rounded-full bg-white/5 hover:bg-orange-600 transition-all flex items-center justify-center border border-white/10 shadow-2xl"><ChevronRight size={20}/></button>
                  </div>
                )}
              </div>

              {/* Right Details */}
              <div className="flex-1 p-10 md:p-16 overflow-y-auto no-scrollbar space-y-12">
                <div className="space-y-4">
                  <span className="bg-orange-600 text-white text-[8px] font-black uppercase tracking-[0.4em] px-4 py-2 rounded-full italic shadow-xl shadow-orange-600/20">Verified Sanctuary</span>
                  <h2 className="text-6xl font-black italic tracking-tighter uppercase leading-none">{selectedHotel.hotelName}</h2>
                  <p className="flex items-center gap-2 text-orange-500 text-xs font-bold uppercase tracking-widest pt-2"><MapPin size={16}/> {selectedHotel.location}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className="bg-white/5 p-8 rounded-[40px] border border-white/5 space-y-4 shadow-inner">
                      <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] flex items-center gap-2 italic"><FileText size={16}/> Narratives</p>
                      <p className="text-white/70 text-sm font-medium leading-relaxed">{selectedHotel.description || "A tranquil mountain getaway."}</p>
                   </div>
                   <div className="bg-white/[0.03] p-8 rounded-[40px] border border-white/5 space-y-6">
                      <div className="flex justify-between items-center pb-4 border-b border-white/5">
                        <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Base Rate</span>
                        <span className="text-4xl font-black italic text-orange-500">₹{selectedHotel.pricePerNight}</span>
                      </div>
                      <div className="flex gap-4">
                        <div className="flex-1 bg-black/40 p-4 rounded-3xl text-center border border-white/5">
                            <p className="text-[8px] font-black text-white/20 uppercase mb-1">Guests</p>
                            <p className="text-xs font-black italic">{adultCount+childCount}</p>
                        </div>
                        <div className="flex-1 bg-black/40 p-4 rounded-3xl text-center border border-white/5">
                            <p className="text-[8px] font-black text-white/20 uppercase mb-1">Check-In</p>
                            <p className="text-xs font-black italic">{checkInDate || 'TBD'}</p>
                        </div>
                      </div>
                      <button onClick={() => handleBooking(selectedHotel)} className="w-full bg-white text-black py-6 rounded-[30px] font-black text-[11px] uppercase tracking-[0.4em] hover:bg-orange-600 hover:text-white transition-all shadow-2xl active:scale-95">
                        <Phone size={18}/> Transmit Booking
                      </button>
                   </div>
                </div>

                <div className="space-y-8">
                  <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] italic border-l-2 border-orange-600 pl-4">Premium Infrastructure</p>
                  <div className="flex flex-wrap gap-4">
                    {JSON.parse(selectedHotel.amenities || "[]").map(am => (
                      <div key={am} className="flex items-center gap-4 bg-white/5 border border-white/10 px-6 py-4 rounded-[25px] shadow-xl hover:bg-white hover:text-black transition-all cursor-default">
                        <span className="text-orange-600">{amenityIcons[am] || <Check size={16}/>}</span>
                        <span className="font-bold text-[10px] uppercase tracking-widest">{am}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-10 border-y border-white/5">
                  {[
                    { label: 'Vacancy', val: `${selectedHotel.totalRooms || 0} Units` },
                    { label: 'Landmark', val: selectedHotel.landmark || 'N/A' },
                    { label: 'Pets', val: selectedHotel.petPolicy || 'No' },
                    { label: 'Pilot', val: selectedHotel.ownerName || 'Partner' }
                  ].map((stat, i) => (
                    <div key={i} className="space-y-1">
                      <p className="text-[8px] font-black text-white/20 uppercase">{stat.label}</p>
                      <p className="text-white font-black italic text-sm uppercase truncate">{stat.val}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-orange-600/5 p-10 rounded-[50px] border border-orange-600/10 flex items-center justify-between">
                    <div className="flex items-center gap-6 text-white/40">
                        <Info size={24} className="text-orange-600"/>
                        <p className="text-[11px] font-medium italic">Standard policy: Transmissions are secured and direct to host.</p>
                    </div>
                    <div className="text-[10px] font-black text-white/20 uppercase tracking-widest italic animate-pulse">Live Link Active</div>
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