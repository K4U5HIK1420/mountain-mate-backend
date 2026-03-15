import { io } from "socket.io-client";
const socket = io("http://localhost:5000");

import API from "../utils/api";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Loader2, Navigation, Plus, Minus, X, ShieldCheck, CreditCard, Phone, User } from "lucide-react";
import { useNotify } from "../context/NotificationContext";
import RoutePreview from "../components/RoutePreview";

const ExploreRides = () => {
  const { notify } = useNotify();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRide, setSelectedRide] = useState(null);
  const [bookingSeats, setBookingSeats] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pickupFilter, setPickupFilter] = useState("");
  const [dropFilter, setDropFilter] = useState("");
  const [fromCoords, setFromCoords] = useState(null);
  const [toCoords, setToCoords] = useState(null);

  useEffect(() => {
    if (selectedRide) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "auto";
  }, [selectedRide]);

  const loadApprovedRides = async () => {
    setLoading(true);
    try {
      const res = await API.get("/transport/all");
      setRides(res.data.data || res.data || []);
    } catch (err) {
      setRides([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadApprovedRides(); }, []);

  const fetchListings = async () => {
    if (!pickupFilter && !dropFilter) return loadApprovedRides();
    setLoading(true);
    try {
      const response = await API.get("/transport/search", {
        params: { from: pickupFilter, to: dropFilter }
      });
      setRides(response.data.data || response.data || []);
    } catch (error) {
      setRides([]);
    } finally {
      setLoading(false);
    }
  };

  const bookRide = async () => {
    try {
      setIsProcessing(true);
      const token = localStorage.getItem("token");
      if (!token) return notify("Bhai, pehle login toh kar lo!", "error");

      const res = await API.post("/transport/book", {
        rideId: selectedRide._id,
        seats: bookingSeats
      });

      if (res.data.success) {
        notify("Transmission Successful! Redirecting...", "success");
        const message = `Namaste! I just booked ${bookingSeats} seat(s) in your ${selectedRide.vehicleModel} (${selectedRide.plateNumber}) via Mountain Mate. 🏔️`;
        const whatsappUrl = `https://wa.me/${selectedRide.contactNumber}?text=${encodeURIComponent(message)}`;
        setTimeout(() => {
          window.open(whatsappUrl, "_blank");
          setSelectedRide(null);
          loadApprovedRides();
        }, 1500);
      }
    } catch (err) {
      notify(err.response?.data?.message || "Booking failed.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const openRide = async (ride) => {
    const getCoords = async (place) => {
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${place}`);
            const data = await res.json();
            return data.length > 0 ? [parseFloat(data[0].lat), parseFloat(data[0].lon)] : null;
        } catch { return null; }
    };
    const from = await getCoords(ride.routeFrom);
    const to = await getCoords(ride.routeTo);
    setFromCoords(from);
    setToCoords(to);
    setSelectedRide(ride);
    setBookingSeats(1);
  };

  return (
    <div className="relative min-h-screen pt-40 pb-32 px-8">
      <img src="https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=2500" className="fixed inset-0 w-full h-full object-cover grayscale-[30%] z-[-1]" alt="" />
      <div className="fixed inset-0 bg-black/75 backdrop-blur-[6px] z-[-1]" />

      {/* Grid rendering rides... (Keeping your previous logic same) */}
      <motion.div className="relative z-10 max-w-7xl mx-auto">
         {/* ... (Search header logic same) ... */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {rides.map((ride) => (
              <motion.div key={ride._id} whileHover={{ y: -12 }} className="bg-white/[0.02] backdrop-blur-3xl border border-white/5 rounded-[50px] overflow-hidden flex flex-col group shadow-2xl relative">
                 {/* Card Content... */}
                 <div className="h-60 relative overflow-hidden">
                    <img src={ride.images?.[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                 </div>
                 <div className="p-10">
                    <h3 className="text-2xl font-black text-white uppercase italic">{ride.vehicleModel}</h3>
                    <button onClick={() => openRide(ride)} className="w-full mt-6 bg-white/5 border border-white/10 text-white py-5 rounded-[25px] font-black uppercase text-[10px] tracking-[0.3em] hover:bg-orange-600 transition-all">SECURE SEAT</button>
                 </div>
              </motion.div>
          ))}
         </div>
      </motion.div>
{/* DETAIL MODAL (Admin Style Close Button) */}
      <AnimatePresence>
        {selectedRide && (
          <div className="fixed inset-0 z-[5000] flex items-center justify-center p-6">
            {/* Background Overlay */}
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setSelectedRide(null)} 
              className="absolute inset-0 bg-black/90 backdrop-blur-md cursor-pointer" 
            />

            {/* Main Modal Card */}
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.9, y: 20 }} 
              className="relative w-full max-w-5xl bg-[#0a0a0a] border border-white/10 rounded-[50px] overflow-hidden shadow-2xl z-[5500] max-h-[90vh] overflow-y-auto no-scrollbar"
            >
              <div className="grid grid-cols-1 md:grid-cols-2">
                
                {/* Left Side: Vehicle Image */}
                <div className="relative h-full min-h-[300px] bg-zinc-900 border-r border-white/5">
                  <img src={selectedRide.images?.[0]} className="w-full h-full object-cover grayscale-[20%] hover:grayscale-0 transition-all duration-700" alt="" />
                  <div className="absolute bottom-8 left-8 bg-black/60 backdrop-blur-xl p-6 rounded-[35px] border border-white/10">
                    <p className="text-orange-500 text-[10px] font-black tracking-[0.4em] uppercase mb-1">Fleet Unit</p>
                    <p className="text-white font-black italic text-2xl uppercase tracking-tight">{selectedRide.plateNumber}</p>
                  </div>
                </div>

                {/* Right Side: Details & Actions */}
                <div className="p-12 space-y-8 flex flex-col justify-between">
                  <div className="space-y-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-orange-500 text-[10px] font-black tracking-[0.5em] uppercase italic">Vehicle Submission</span>
                        <h2 className="text-5xl font-black text-white italic tracking-tighter mt-2 leading-none uppercase">{selectedRide.vehicleModel}</h2>
                      </div>
                      
                      {/* ✅ ADMIN STYLE COMPACT CLOSE BUTTON */}
                      <button 
                        onClick={() => setSelectedRide(null)} 
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-white/40 z-[9999] hover:bg-white hover:text-black transition-all border border-white/10 active:scale-90"
                      >
                        <X size={20} />
                      </button>
                    </div>

                    {/* Route Preview Map */}
                    <div className="bg-white/5 rounded-[40px] p-4 border border-white/5">
                        <div className="h-[200px] w-full rounded-[30px] overflow-hidden border border-white/5">
                            {fromCoords && toCoords && <RoutePreview fromCoords={fromCoords} toCoords={toCoords} />}
                        </div>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Driver Name</p>
                        <p className="text-white font-bold flex items-center gap-2 uppercase"><User size={14} className="text-orange-500"/> {selectedRide.driverName}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Live Route</p>
                        <p className="text-white font-bold flex items-center gap-2 uppercase truncate"><MapPin size={14} className="text-orange-500"/> {selectedRide.routeFrom} ➔ {selectedRide.routeTo}</p>
                      </div>
                    </div>

                    {/* Seat Selection Logic */}
                    <div className="flex items-center justify-between bg-white/5 p-4 rounded-[30px] border border-white/5">
                        <p className="text-white/40 text-[10px] font-black uppercase tracking-widest ml-4 italic">Select Seats</p>
                        <div className="flex items-center gap-6 bg-black/40 p-2 rounded-full border border-white/5">
                            <button onClick={()=>setBookingSeats(p=>Math.max(1,p-1))} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-orange-600 transition-all"><Minus size={16}/></button>
                            <span className="text-white font-black text-xl w-6 text-center italic">{bookingSeats}</span>
                            <button onClick={()=>setBookingSeats(p=>Math.min(selectedRide.seatsAvailable,p+1))} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-orange-600 transition-all"><Plus size={16}/></button>
                        </div>
                    </div>
                  </div>

                  {/* Pricing & Booking Action */}
                  <div className="pt-6 border-t border-white/5 flex flex-col gap-6">
                    <div className="flex justify-between items-end">
                        <div>
                            <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Total Valuation</p>
                            <p className="text-5xl font-black text-white italic tracking-tighter leading-none">₹{selectedRide.pricePerSeat}</p>
                        </div>
                        <p className="text-[9px] font-black text-orange-500 uppercase tracking-widest mb-1 italic">Per Passenger</p>
                    </div>
                    
                    <button 
                      onClick={bookRide} 
                      disabled={isProcessing}
                      className="w-full bg-orange-600 hover:bg-white hover:text-black text-white py-6 rounded-[30px] font-black uppercase tracking-[0.4em] text-xs transition-all flex items-center justify-center gap-4 disabled:opacity-50 shadow-2xl shadow-orange-600/20"
                    >
                      {isProcessing ? <Loader2 className="animate-spin" /> : <ShieldCheck size={20}/>}
                      {isProcessing ? "PROCESSING TRANSMISSION..." : "CONFIRM & TRANSMIT"}
                    </button>
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

export default ExploreRides;