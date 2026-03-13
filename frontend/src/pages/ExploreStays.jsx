import { io } from "socket.io-client";
const socket = io("http://localhost:5000");
import API from "../utils/api";
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Calendar, Search, Star, Hotel, X, Check, Loader2, Bed, Users, Plus, Minus, Wifi, Car, Coffee, Thermometer, ShieldCheck, Map, Phone, User, Info } from 'lucide-react';

const ExploreStays = () => {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedHotel, setSelectedHotel] = useState(null);
  
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

  // WhatsApp Redirect Logic
  const handleBooking = (hotel) => {
    const message = `Namaste! I'm interested in booking ${hotel.hotelName} in ${hotel.location}.\nDates: ${checkInDate || 'Not selected'} to ${checkOutDate || 'Not selected'}\nGuests: ${adultCount + childCount}\nRooms: ${roomCount}`;
    const whatsappUrl = `https://wa.me/${hotel.contactNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const amenityIcons = {
    wifi: <Wifi size={16} />,
    parking: <Car size={16} />,
    breakfast: <Coffee size={16} />,
    hotWater: <Thermometer size={16} />,
    roomService: <Users size={16} />,
    mountainView: <MapPin size={16} />,
    restaurant: <Coffee size={16} />,
    powerBackup: <ShieldCheck size={16} />
  };

  return (
    <div className="relative min-h-screen pt-40 pb-32 px-8">
      <img src="https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=2500" className="fixed inset-0 w-full h-full object-cover grayscale-[30%] z-[-1]" alt="BG" />
      <div className="fixed inset-0 bg-black/75 backdrop-blur-[6px] z-[-1]"></div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative z-10 max-w-7xl mx-auto">
        
        {/* --- SEARCH BAR --- */}
        <div className="max-w-7xl mx-auto mb-24 px-4 relative">
          <h1 className="text-7xl font-black text-white italic uppercase tracking-tighter mb-12 text-center text-glow">MOUNTAIN <span className="text-orange-600">STAYS.</span></h1>
          <div className="bg-white/5 backdrop-blur-3xl p-3 rounded-[50px] border border-white/10 flex flex-col lg:flex-row items-stretch gap-2 shadow-2xl relative">
            <div className="flex-[1.2] flex items-center gap-4 px-8 py-6 bg-white/5 rounded-[40px] border border-white/5"><MapPin className="text-orange-600" size={22}/><input type="text" onChange={(e) => setLocationFilter(e.target.value)} placeholder="WHERE TO?" className="bg-transparent w-full text-white font-black outline-none uppercase text-xs tracking-widest" /></div>
            <div className="flex-1 flex items-center gap-4 px-6 py-6 bg-white/5 rounded-[40px] border border-white/5"><Calendar className="text-orange-600" size={20}/><div className="w-full"><p className="text-[8px] font-black text-white/30 uppercase">Check-In</p><input type="date" min={today} onChange={(e) => setCheckInDate(e.target.value)} className="bg-transparent w-full text-white font-black outline-none text-[11px] [color-scheme:dark]" /></div></div>
            <div className="flex-1 flex items-center gap-4 px-6 py-6 bg-white/5 rounded-[40px] border border-white/5"><Calendar className="text-orange-600" size={20}/><div className="w-full"><p className="text-[8px] font-black text-white/30 uppercase">Check-Out</p><input type="date" min={checkInDate || today} onChange={(e) => setCheckOutDate(e.target.value)} className="bg-transparent w-full text-white font-black outline-none text-[11px] [color-scheme:dark]" /></div></div>
            <div className="flex-1 relative" ref={menuRef}>
              <div onClick={() => setShowGuestMenu(!showGuestMenu)} className="flex items-center justify-center gap-4 px-6 py-6 rounded-[40px] border border-white/5 bg-white/5 h-full cursor-pointer"><Users className="text-orange-600" size={20}/><div className="text-left"><p className="text-[8px] font-black text-white/30 uppercase">Guests & Rooms</p><span className="text-white font-black text-[10px] whitespace-nowrap">{adultCount + childCount} G / {roomCount} R</span></div></div>
              <AnimatePresence>{showGuestMenu && (
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 5 }} exit={{ opacity: 0, y: 15 }} className="absolute top-[105%] right-0 min-w-[300px] bg-[#0d0d0d] border border-white/10 p-10 rounded-[40px] z-[200] space-y-8">
                  {[{ label: "Rooms", val: roomCount, setter: setRoomCount, min: 1 }, { label: "Adults", val: adultCount, setter: setAdultCount, min: 1 }, { label: "Children", val: childCount, setter: setChildCount, min: 0 }].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div><p className="text-white font-black text-[11px] uppercase tracking-widest">{item.label}</p></div>
                      <div className="flex items-center bg-black/50 p-1 rounded-full border border-white/5">
                        <button onClick={(e) => { e.stopPropagation(); item.setter(Math.max(item.min, item.val - 1)); }} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white"><Minus size={12}/></button>
                        <span className="text-white font-black text-lg w-10 text-center">{item.val}</span>
                        <button onClick={(e) => { e.stopPropagation(); item.setter(item.val + 1); }} className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center text-white"><Plus size={12}/></button>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}</AnimatePresence>
            </div>
            <button onClick={fetchHotels} className="bg-orange-600 text-white px-10 py-6 rounded-[40px] font-black uppercase text-xs tracking-widest hover:bg-white hover:text-black transition-all">Search</button>
          </div>
        </div>

        {/* --- GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {loading ? (
            <div className="col-span-full flex justify-center py-40"><Loader2 className="animate-spin text-orange-600" size={50} /></div>
          ) : hotels.map((hotel) => (
            <motion.div key={hotel._id} whileHover={{ y: -10 }} onClick={() => setSelectedHotel(hotel)} className="bg-white/[0.02] backdrop-blur-3xl border border-white/5 rounded-[50px] overflow-hidden flex flex-col group cursor-pointer hover:border-orange-600/30 transition-all duration-500">
              <div className="h-64 relative overflow-hidden">
                <img src={hotel.images?.[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="hotel" />
                <div className="absolute top-6 left-6 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-2"><Star size={12} className="text-orange-600 fill-orange-600" /><p className="text-white font-black text-[10px]">4.8</p></div>
              </div>
              <div className="p-10 space-y-6">
                <div className="flex justify-between items-start">
                  <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none">{hotel.hotelName}</h3>
                  <p className="text-2xl font-black text-white italic leading-none">₹{hotel.pricePerNight}</p>
                </div>
                <div className="flex items-center gap-2 text-white/30 text-[10px] font-black uppercase tracking-widest"><MapPin size={12} className="text-orange-500" /> {hotel.location}</div>
                <button className="w-full bg-white/5 border border-white/10 group-hover:bg-orange-600 text-white py-5 rounded-[25px] font-black uppercase text-[10px] tracking-widest transition-all">Check Details</button>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* --- DETAILED MODAL --- */}
      <AnimatePresence>
        {selectedHotel && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedHotel(null)} className="absolute inset-0 bg-black/90 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="relative w-full max-w-5xl bg-[#0a0a0a] border border-white/10 rounded-[50px] overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]">
              <div className="w-full md:w-1/2 overflow-hidden h-80 md:h-auto">
                <img src={selectedHotel.images?.[0]} className="w-full h-full object-cover" alt="" />
              </div>
              <div className="w-full md:w-1/2 p-10 md:p-14 overflow-y-auto">
                <button onClick={() => setSelectedHotel(null)} className="absolute top-8 right-8 text-white/20 hover:text-white"><X/></button>
                <span className="text-orange-500 text-[10px] font-black tracking-[0.4em] uppercase">Partner Verified Stay</span>
                <h2 className="text-5xl font-black text-white italic tracking-tighter mt-2 uppercase leading-none">{selectedHotel.hotelName}</h2>
                
                <div className="grid grid-cols-2 gap-8 my-10">
                  <div className="space-y-1"><p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Property Type</p><p className="text-white font-bold uppercase italic">{selectedHotel.propertyType || 'Resort'}</p></div>
                  <div className="space-y-1"><p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Near Landmark</p><p className="text-white font-bold uppercase italic"><MapPin size={12} className="inline mr-1 text-orange-500"/>{selectedHotel.landmark || 'N/A'}</p></div>
                  <div className="space-y-1"><p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Host / Manager</p><p className="text-white font-bold uppercase italic"><User size={12} className="inline mr-1 text-orange-500"/>{selectedHotel.ownerName || 'Staff'}</p></div>
                  <div className="space-y-1"><p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Base Pricing</p><p className="text-white font-black text-2xl italic tracking-tighter">₹{selectedHotel.pricePerNight}<span className="text-[10px] text-white/20 font-bold tracking-normal ml-1">/Night</span></p></div>
                </div>

                <div className="space-y-6 mb-10">
                  <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Available Amenities</p>
                  <div className="flex flex-wrap gap-3">
                    {JSON.parse(selectedHotel.amenities || "[]").map(am => (
                      <div key={am} className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full">
                        <span className="text-orange-500">{amenityIcons[am] || <Check size={14}/>}</span>
                        <span className="text-white text-[9px] font-black uppercase tracking-widest">{am}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white/5 p-8 rounded-[35px] border border-white/10 mb-10">
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-4 flex items-center gap-2"><Info size={14}/> Cancellation Policy</p>
                    <p className="text-white/60 text-[11px] font-bold leading-relaxed">{selectedHotel.cancellationPolicy || "Standard policy applies. Contact host for details."}</p>
                </div>

                <button onClick={() => handleBooking(selectedHotel)} className="w-full bg-white text-black hover:bg-orange-600 hover:text-white p-7 rounded-[25px] font-black uppercase text-[12px] tracking-[0.3em] transition-all flex items-center justify-center gap-4">
                  <Phone size={18}/> BOOK VIA WHATSAPP
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ExploreStays;