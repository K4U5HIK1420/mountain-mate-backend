import API from "../utils/api";
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Search, Star, Car, ChevronRight, ShieldCheck, Loader2, X, Check, Navigation, Users, Calendar, Plus, Minus } from 'lucide-react';

const ExploreRides = () => {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRide, setSelectedRide] = useState(null);
  const [bookingSeats, setBookingSeats] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Search States
  const [pickupFilter, setPickupFilter] = useState('');
  const [dropFilter, setDropFilter] = useState('');
  const [travelDate, setTravelDate] = useState('');
  
  // Passenger Selector Popover States
  const [showPassSelector, setShowPassSelector] = useState(false);
  const [passengerCount, setPassengerCount] = useState(1);
  const selectorRef = useRef(null);

  const today = new Date().toISOString().split("T")[0];

  // Outside click to close passenger menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectorRef.current && !selectorRef.current.contains(event.target)) {
        setShowPassSelector(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const response = await API.get("/transport/search", {
        params: { 
          pickup: pickupFilter.toLowerCase(),
          drop: dropFilter.toLowerCase(),
          date: travelDate,
          passengers: passengerCount
        }
      });
      setRides(response.data.data || response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      setRides([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchListings(); }, []);

  return (
    <div className="relative min-h-screen pt-40 pb-32 px-8">
      {/* --- BACKGROUND --- */}
      <img src="https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=2500" className="fixed inset-0 w-full h-full object-cover grayscale-[30%]" alt="BG" />
      <div className="fixed inset-0 bg-black/70 backdrop-blur-[4px] z-[-1]"></div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative z-10 max-w-7xl mx-auto">
        
        {/* --- MASTER SEARCH BAR (REFINED FRAME) --- */}
        <div className="max-w-7xl mx-auto mb-24 px-4">
          <h1 className="text-7xl font-black text-white italic uppercase tracking-tighter mb-12 text-center text-glow">BOOK YOUR <span className="text-orange-600">RIDE.</span></h1>
          
          <div className="bg-white/5 backdrop-blur-3xl p-3 rounded-[50px] border border-white/10 flex flex-col lg:flex-row items-stretch gap-2 shadow-[0_25px_60px_rgba(0,0,0,0.6)] relative">
            
            {/* 1. Pickup Section */}
            <div className="flex-[1.5] flex items-center gap-4 px-8 py-6 bg-white/5 rounded-[40px] border border-white/5 focus-within:bg-white/10 transition-all group">
              <MapPin className="text-orange-600 shrink-0" size={22}/>
              <input type="text" onChange={(e) => setPickupFilter(e.target.value)} placeholder="LEAVING FROM..." className="bg-transparent w-full text-white font-black outline-none uppercase placeholder:text-white/10 text-xs tracking-widest" />
            </div>

            {/* 2. Drop Section */}
            <div className="flex-[1.5] flex items-center gap-4 px-8 py-6 bg-white/5 rounded-[40px] border border-white/5 focus-within:bg-white/10 transition-all group">
              <Navigation className="text-orange-600 shrink-0" size={22}/>
              <input type="text" onChange={(e) => setDropFilter(e.target.value)} placeholder="GOING TO..." className="bg-transparent w-full text-white font-black outline-none uppercase placeholder:text-white/10 text-xs tracking-widest" />
            </div>

            {/* 3. Date Selection */}
            <div className="flex-1 flex items-center gap-4 px-7 py-6 bg-white/5 rounded-[40px] border border-white/5 focus-within:bg-white/10 transition-all">
              <Calendar className="text-orange-600 shrink-0" size={20}/>
              <input type="date" min={today} value={travelDate} onChange={(e) => setTravelDate(e.target.value)} className="bg-transparent w-full text-white font-black outline-none uppercase text-[11px] tracking-widest cursor-pointer [color-scheme:dark]" />
            </div>

            {/* 4. Passenger Selector (Popover Mode) */}
            <div className="flex-1 relative" ref={selectorRef}>
              <div 
                onClick={() => setShowPassSelector(!showPassSelector)}
                className={`flex items-center justify-center gap-4 px-6 py-6 rounded-[40px] border transition-all cursor-pointer h-full ${showPassSelector ? 'bg-white/15 border-orange-600/50' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
              >
                <Users className="text-orange-600 shrink-0" size={20}/>
                <span className="text-white font-black uppercase text-[11px] tracking-tighter whitespace-nowrap">
                  {passengerCount} {passengerCount > 1 ? 'Passengers' : 'Passenger'}
                </span>
              </div>

              <AnimatePresence>
                {showPassSelector && (
                  <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 5 }} exit={{ opacity: 0, y: 15 }} className="absolute top-[105%] right-0 min-w-[250px] bg-[#0d0d0d] border border-white/10 p-8 rounded-[35px] shadow-[0_30px_70px_rgba(0,0,0,0.9)] z-[200]">
                    <div className="flex items-center justify-between">
                        <span className="text-white font-black text-[10px] uppercase tracking-[0.2em]">Select Seats</span>
                        <div className="flex items-center gap-5 bg-black/40 p-1.5 rounded-full border border-white/5">
                            <button onClick={(e) => { e.stopPropagation(); setPassengerCount(Math.max(1, passengerCount - 1)); }} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-red-600 transition-all"><Minus size={14}/></button>
                            <span className="text-white font-black text-xl w-6 text-center italic">{passengerCount}</span>
                            <button onClick={(e) => { e.stopPropagation(); setPassengerCount(Math.min(8, passengerCount + 1)); }} className="w-10 h-10 rounded-full bg-orange-600 flex items-center justify-center text-white hover:bg-white hover:text-black transition-all shadow-lg shadow-orange-600/20"><Plus size={14}/></button>
                        </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 5. Search Button */}
            <button onClick={fetchListings} className="bg-orange-600 text-white px-14 py-6 rounded-[40px] font-black uppercase text-xs tracking-[0.3em] hover:bg-white hover:text-black transition-all shadow-xl active:scale-95 whitespace-nowrap ml-1">
              Search
            </button>
          </div>
        </div>

        {/* --- RIDES GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {loading ? (
            <div className="col-span-full flex flex-col items-center justify-center py-40">
                <Loader2 className="animate-spin text-orange-600" size={50} />
                <p className="text-white/10 font-black tracking-[1em] uppercase mt-8">Decrypting Vault...</p>
            </div>
          ) : rides.map((ride) => (
            <motion.div key={ride._id} whileHover={{ y: -15 }} className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[60px] overflow-hidden flex flex-col group hover:border-orange-600/40 transition-all duration-500 shadow-2xl">
              <div className="h-64 relative overflow-hidden">
                <img src={ride.images?.[0] || 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt="ride" />
                <div className="absolute top-8 right-8 bg-orange-600 px-5 py-2 rounded-full text-[10px] text-white font-black tracking-widest uppercase shadow-2xl italic">
                  {ride.capacity} SEATS LEFT
                </div>
              </div>

              <div className="p-10 space-y-8">
                <div className="flex justify-between items-start">
                  <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none group-hover:text-orange-500 transition-colors">{ride.vehicleName}</h3>
                  <div className="text-right">
                    <p className="text-3xl font-black text-white italic leading-none">₹{ride.pricePerSeat}</p>
                    <p className="text-[8px] font-black text-white/20 uppercase mt-1 tracking-widest">Per Passenger</p>
                  </div>
                </div>

                {/* ROUTE DISPLAY */}
                <div className="relative pl-8 space-y-6">
                   <div className="absolute left-[11px] top-2 bottom-2 w-[2px] border-l border-dashed border-white/20"></div>
                   <div className="relative flex items-center gap-4">
                      <div className="absolute -left-[30px] w-3 h-3 rounded-full bg-orange-600 shadow-[0_0_10px_#ea580c]"></div>
                      <span className="text-white font-black text-[11px] uppercase tracking-wider">{ride.pickupLocation || ride.location}</span>
                   </div>
                   <div className="relative flex items-center gap-4">
                      <div className="absolute -left-[30px] w-3 h-3 rounded-full border-2 border-white/40 bg-zinc-900"></div>
                      <span className="text-white/60 font-black text-[11px] uppercase tracking-wider">{ride.dropLocation || 'Kedarnath Base'}</span>
                   </div>
                </div>

                <div className="flex gap-6 border-y border-white/5 py-6">
                  <div className="flex items-center gap-3 text-white/40 text-[10px] font-black uppercase"><Users size={16} className="text-orange-600"/> Shared</div>
                  <div className="flex items-center gap-3 text-white/40 text-[10px] font-black uppercase"><ShieldCheck size={16} className="text-orange-600"/> Verified</div>
                </div>

                <button onClick={() => setSelectedRide(ride)} className="w-full bg-white text-black py-7 rounded-[35px] font-black uppercase text-[12px] tracking-widest shadow-2xl hover:bg-orange-600 hover:text-white transition-all active:scale-95">Select Seats</button>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* --- MODAL --- */}
      <AnimatePresence>
        {selectedRide && (
           <div className="fixed inset-0 z-[5000] flex items-center justify-center px-6">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedRide(null)} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-zinc-950 border border-white/10 w-full max-w-md rounded-[55px] p-12 shadow-2xl">
                 <div className="text-center mb-10">
                    <p className="text-orange-500 font-black text-[10px] tracking-[0.3em] uppercase mb-2 italic">Final Reservation</p>
                    <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter leading-tight">Confirm <span className="text-orange-600">Booking.</span></h2>
                 </div>
                 
                 <div className="flex justify-between items-center bg-white/5 p-8 rounded-[40px] mb-8 border border-white/5">
                    <button onClick={() => setBookingSeats(Math.max(1, bookingSeats - 1))} className="w-12 h-12 rounded-full bg-white/10 text-white hover:bg-orange-600 font-black transition-all">-</button>
                    <div className="text-center">
                        <span className="text-5xl font-black text-white italic">{bookingSeats}</span>
                        <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mt-1">Passengers</p>
                    </div>
                    <button onClick={() => setBookingSeats(Math.min(selectedRide.capacity, bookingSeats + 1))} className="w-12 h-12 rounded-full bg-white/10 text-white hover:bg-orange-600 font-black transition-all">+</button>
                 </div>

                 <button onClick={() => alert("Success!")} className="w-full bg-orange-600 text-white py-8 rounded-[35px] font-black uppercase text-[12px] tracking-widest shadow-xl hover:bg-white hover:text-black transition-all">
                    Pay ₹{selectedRide.pricePerSeat * bookingSeats}
                 </button>
              </motion.div>
           </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ExploreRides;