import { io } from "socket.io-client";
const socket = io("http://localhost:5000");
import API from "../utils/api";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Loader2, Navigation, Users, Plus, Minus, X, Phone, ShieldCheck, CreditCard } from 'lucide-react';
import { useNotify } from "../context/NotificationContext";

const ExploreRides = () => {

  const { notify } = useNotify();

  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRide, setSelectedRide] = useState(null);
  const [bookingSeats, setBookingSeats] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pickupFilter, setPickupFilter] = useState('');
  const [dropFilter, setDropFilter] = useState('');

  // Load approved rides
  const loadApprovedRides = async () => {
    setLoading(true);
    try {
      const res = await API.get("/transport/all");
      // Backend checks for { isVerified: true, status: "approved" }
      setRides(res.data.data || res.data || []);
    } catch (err) {
      console.error("Initial ride fetch error:", err);
      setRides([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApprovedRides();
  }, []);

  // Search rides logic
  const fetchListings = async () => {
    setLoading(true);
    try {
      const response = await API.get("/transport/search", {
        params: {
          from: pickupFilter.toLowerCase(),
          to: dropFilter.toLowerCase()
        }
      });
      setRides(response.data.data || response.data || []);
    } catch (error) {
      console.error("Search error:", error);
      setRides([]);
    } finally {
      setLoading(false);
    }
  };

  // BOOK RIDE + WhatsApp Redirect
  const bookRide = async () => {
    try {
      setIsProcessing(true);
      const res = await API.post("/transport/book", {
        rideId: selectedRide._id,
        seats: bookingSeats
      });

      if (res.data.success) {
              notify("Booking Successful! Redirecting to Driver's WhatsApp...", "success");

        // WhatsApp Message Logic for Driver
        const message = `Namaste! I just booked ${bookingSeats} seat(s) in your ${selectedRide.vehicleType} (${selectedRide.vehicleNumber}) for the route ${selectedRide.routeFrom} to ${selectedRide.routeTo} via Mountain Mate. 🏔️`;
        const whatsappUrl = `https://wa.me/${selectedRide.contactNumber}?text=${encodeURIComponent(message)}`;
        
        window.open(whatsappUrl, '_blank');

        setSelectedRide(null);
        loadApprovedRides();
      }
    } catch (err) {

      notify("Booking failed. Please try again.", "error");

    } finally {
      setIsProcessing(false);
    }
  };

  // Real-time Socket Update
  useEffect(() => {
    socket.on("seatsUpdated", (data) => {
      setRides(prev => prev.map(r => 
        r._id === data.rideId ? { ...r, seatsAvailable: data.seatsAvailable } : r
      ));
    });
    return () => socket.off("seatsUpdated");
  }, []);

  return (
    <div className="relative min-h-screen pt-40 pb-32 px-8 selection:bg-orange-600 selection:text-white">
      {/* Background Layer */}
      <img src="https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=2500" className="fixed inset-0 w-full h-full object-cover grayscale-[30%] z-[-1]" alt="bg" />
      <div className="fixed inset-0 bg-black/75 backdrop-blur-[6px] z-[-1]"></div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative z-10 max-w-7xl mx-auto">
        
        {/* HEADER & SEARCH SECTION */}
        <div className="max-w-4xl mx-auto mb-20 text-center">
          <h1 className="text-7xl font-black text-white italic uppercase tracking-tighter mb-8 text-glow">
            FIND YOUR <span className="text-orange-600">FLEET.</span>
          </h1>
          <div className="bg-white/5 backdrop-blur-3xl p-4 rounded-[40px] border border-white/10 flex flex-col md:flex-row gap-3 shadow-2xl">
            <div className="flex items-center gap-4 px-6 py-4 bg-white/5 rounded-[30px] flex-1 border border-white/5 group focus-within:border-orange-500/50 transition-all">
              <MapPin className="text-orange-600" size={20}/>
              <input onChange={(e) => setPickupFilter(e.target.value)} placeholder="PICKUP LOCATION..." className="bg-transparent w-full text-white font-black outline-none uppercase text-xs tracking-widest placeholder:text-white/20" />
            </div>
            <div className="flex items-center gap-4 px-6 py-4 bg-white/5 rounded-[30px] flex-1 border border-white/5 group focus-within:border-orange-500/50 transition-all">
              <Navigation className="text-orange-600" size={20}/>
              <input onChange={(e) => setDropFilter(e.target.value)} placeholder="DESTINATION..." className="bg-transparent w-full text-white font-black outline-none uppercase text-xs tracking-widest placeholder:text-white/20" />
            </div>
            <button onClick={fetchListings} className="bg-orange-600 hover:bg-white hover:text-black text-white px-10 py-4 rounded-[30px] font-black uppercase transition-all duration-300 active:scale-95">SEARCH</button>
          </div>
        </div>

        {/* LISTING GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {loading ? (
            <div className="col-span-full flex justify-center py-40"><Loader2 className="animate-spin text-orange-600" size={60}/></div>
          ) : rides.length === 0 ? (
            <div className="col-span-full text-center text-white/20 font-black tracking-[1em] py-40 uppercase italic">Vault Empty: No Rides Found</div>
          ) : (
            rides.map((ride) => (
              <motion.div key={ride._id} whileHover={{ y: -12 }} onClick={() => { setSelectedRide(ride); setBookingSeats(1); }} className="bg-white/[0.02] backdrop-blur-3xl border border-white/5 rounded-[50px] overflow-hidden flex flex-col group cursor-pointer hover:border-orange-600/30 transition-all duration-500 shadow-2xl">
                <div className="h-60 relative overflow-hidden">
                  <img src={ride.images?.[0] || "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf"} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="ride" />
                  <div className="absolute top-6 left-6 bg-black/60 backdrop-blur-md px-5 py-2 rounded-full border border-white/10">
                    <p className="text-orange-500 text-[10px] font-black tracking-widest uppercase">{ride.seatsAvailable} SEATS LEFT</p>
                  </div>
                </div>
                <div className="p-10 space-y-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">{ride.vehicleType || "Innova Crysta"}</h3>
                      <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-1 italic">{ride.routeFrom} ➔ {ride.routeTo}</p>
                    </div>
                    <p className="text-2xl font-black text-white italic">₹{ride.pricePerSeat}</p>
                  </div>
                  <button className="w-full bg-white/5 border border-white/10 group-hover:bg-orange-600 text-white py-5 rounded-[25px] font-black uppercase text-[10px] tracking-[0.3em] transition-all">SECURE SEAT & VIEW DETAILS</button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>

      {/* BOOKING MODAL */}
      <AnimatePresence>
        {selectedRide && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedRide(null)} className="absolute inset-0 bg-black/95 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }} className="relative w-full max-w-4xl bg-[#0a0a0a] border border-white/10 rounded-[50px] overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]">
              <div className="w-full md:w-1/2 h-64 md:h-auto relative">
                <img src={selectedRide.images?.[0]} className="w-full h-full object-cover" alt="" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent md:bg-gradient-to-r" />
              </div>
              <div className="w-full md:w-1/2 p-10 lg:p-14 flex flex-col justify-center relative overflow-y-auto">
                <button onClick={() => setSelectedRide(null)} className="absolute top-8 right-8 text-white/20 hover:text-white transition-colors"><X/></button>
                <span className="text-orange-500 text-[10px] font-black tracking-[0.4em] uppercase">Fleet Confirmation</span>
                <h2 className="text-5xl font-black text-white italic tracking-tighter mt-2 uppercase leading-none">{selectedRide.vehicleType}</h2>
                
                <div className="grid grid-cols-2 gap-8 my-10 border-y border-white/5 py-8">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Driver</p>
                    <p className="text-white font-bold flex items-center gap-2 uppercase italic text-xs"><ShieldCheck size={14} className="text-orange-500"/> {selectedRide.driverName || "Shardul Aswal"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Plate No.</p>
                    <p className="text-white font-bold uppercase italic text-xs">{selectedRide.vehicleNumber}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Route From</p>
                    <p className="text-white font-bold uppercase italic text-xs">{selectedRide.routeFrom}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Route To</p>
                    <p className="text-white font-bold uppercase italic text-xs">{selectedRide.routeTo}</p>
                  </div>
                </div>

                <div className="bg-white/5 p-8 rounded-[35px] border border-white/10 mb-8 shadow-inner">
                  <div className="flex justify-between items-center mb-6">
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Select Seats</p>
                    <div className="flex items-center gap-6">
                      <button onClick={() => setBookingSeats(p => Math.max(1, p-1))} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-red-600 transition-all"><Minus size={16}/></button>
                      <span className="text-2xl font-black text-white italic">{bookingSeats}</span>
                      <button onClick={() => setBookingSeats(p => Math.min(selectedRide.seatsAvailable, p+1))} className="w-10 h-10 rounded-full bg-orange-600 flex items-center justify-center text-white hover:bg-white hover:text-black shadow-lg shadow-orange-600/20 transition-all"><Plus size={16}/></button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-6 border-t border-white/5">
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Total Payable</p>
                    <p className="text-3xl font-black text-white italic tracking-tighter">₹{selectedRide.pricePerSeat * bookingSeats}</p>
                  </div>
                </div>

                <button onClick={bookRide} disabled={isProcessing} className="w-full bg-white text-black hover:bg-orange-600 hover:text-white p-6 rounded-[25px] font-black uppercase text-[12px] tracking-[0.3em] transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-30">
                  {isProcessing ? <Loader2 className="animate-spin"/> : <CreditCard size={20}/>}
                  {isProcessing ? "PROCESSING..." : "CONFIRM & TRANSMIT"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ExploreRides;