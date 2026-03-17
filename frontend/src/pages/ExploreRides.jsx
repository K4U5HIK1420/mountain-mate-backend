import React, { useState, useEffect } from "react";
import socket from "../utils/socket";
import API from "../utils/api";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Loader2, Navigation, Plus, Minus, X, ShieldCheck, CreditCard, Phone, User, Car, ArrowRight, Info, CheckCircle2 } from "lucide-react";
import { useNotify } from "../context/NotificationContext";
import RoutePreview from "../components/RoutePreview";

const ExploreRides = () => {
  const { notify } = useNotify();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRide, setSelectedRide] = useState(null);
  
  // ✅ NEW STATE: For Modal Image Gallery
  const [currentModalImgIndex, setCurrentModalImgIndex] = useState(0);

  const [bookingSeats, setBookingSeats] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pickupFilter, setPickupFilter] = useState("");
  const [dropFilter, setDropFilter] = useState("");
  const [expandedRideId, setExpandedRideId] = useState(null);
  const [modalMode, setModalMode] = useState("booking");

  useEffect(() => {
    if (selectedRide) {
        document.body.style.overflow = "hidden";
        setCurrentModalImgIndex(0); // Reset to first image when opening
    }
    else document.body.style.overflow = "auto";
  }, [selectedRide]);

  useEffect(() => {
    socket.on("seatsUpdated", (data) => {
      setRides(prev => prev.map(r => r._id === data.rideId ? { ...r, seatsAvailable: data.seatsAvailable } : r));
    });
    return () => socket.off("seatsUpdated");
  }, []);

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
      const response = await API.get("/transport/search", { params: { from: pickupFilter, to: dropFilter } });
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

      const res = await API.post("/transport/book", { rideId: selectedRide._id, seats: bookingSeats });
      if (res.data.success) {
        notify("Booking Successful! Redirecting...", "success");
        const message = `Namaste! I just booked ${bookingSeats} seat(s) in your ${selectedRide.vehicleType} (${selectedRide.vehicleNumber}) for the route ${selectedRide.routeFrom} to ${selectedRide.routeTo} via Mountain Mate. 🏔️`;
        window.open(`https://wa.me/${selectedRide.contactNumber}?text=${encodeURIComponent(message)}`, "_blank");
        setSelectedRide(null);
        loadApprovedRides();
      } else {
        notify("Booking failed.", "error");
      }
    } catch (err) {
      notify("Booking error.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#050505] pt-40 pb-32 px-8 selection:bg-orange-600">
      {/* Dynamic Background */}
      <img src="https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=2500" className="fixed inset-0 w-full h-full object-cover opacity-30 grayscale-[40%] z-[-1]" alt="" />
      <div className="fixed inset-0 bg-gradient-to-b from-black/80 via-black/40 to-[#050505] z-[-1]" />

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative z-10 max-w-7xl mx-auto">
        
        {/* HERO SECTION (Same as Stays) */}
        <div className="max-w-5xl mx-auto mb-24 text-center">
          <p className="text-orange-600 font-black tracking-[0.5em] text-[10px] uppercase mb-4">Mountain Fleet Logistics</p>
          <h1 className="text-7xl md:text-8xl font-black text-white italic uppercase tracking-tighter mb-12 leading-none">
            HIRE YOUR <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-800">EXPEDITION.</span>
          </h1>

          <div className="max-w-5xl mx-auto bg-white/5 backdrop-blur-3xl p-3 rounded-[40px] border border-white/10 flex flex-col md:flex-row gap-2 shadow-3xl">
            <div className="flex items-center gap-4 px-8 py-5 bg-white/[0.03] rounded-[30px] flex-1 border border-white/5">
              <MapPin className="text-orange-600" size={18} /><input onChange={(e) => setPickupFilter(e.target.value)} placeholder="FROM WHERE?" className="bg-transparent w-full text-white font-bold outline-none uppercase text-[10px] tracking-widest placeholder:text-white/20" />
            </div>
            <div className="flex items-center gap-4 px-8 py-5 bg-white/[0.03] rounded-[30px] flex-1 border border-white/5">
              <Navigation className="text-orange-600" size={18} /><input onChange={(e) => setDropFilter(e.target.value)} placeholder="TO WHERE?" className="bg-transparent w-full text-white font-bold outline-none uppercase text-[10px] tracking-widest placeholder:text-white/20" />
            </div>
            <button onClick={fetchListings} className="bg-orange-600 hover:bg-white hover:text-black text-white px-12 py-5 rounded-[30px] font-black uppercase text-[11px] tracking-widest transition-all active:scale-95 shadow-xl shadow-orange-600/20">Find Rides</button>
          </div>
        </div>

        {/* RIDES GRID - UPDATED FOR FULL IMAGE */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {loading ? (
            <div className="col-span-full flex flex-col items-center justify-center py-40 gap-4">
              <Loader2 className="animate-spin text-orange-600" size={40}/>
              <p className="text-[10px] font-black tracking-[0.3em] text-white/20 uppercase italic">Locating nearby fleets...</p>
            </div>
          ) : rides.length === 0 ? (
            <div className="col-span-full text-center text-white/10 font-black tracking-[0.8em] py-40 uppercase italic text-xl">NO FLEET DETECTED</div>
          ) : (
            rides.map((ride) => (
              <motion.div key={ride._id} whileHover={{ y: -10 }} className="group relative bg-[#0d0d0d] border border-white/5 rounded-[45px] overflow-hidden shadow-2xl transition-all duration-500 hover:border-orange-600/30 flex flex-col">
                
                {/* Visual Accent */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-orange-600 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                {/* ✅ CHANGE 1: Full Image Logic (object-contain + blur) */}
                <div className="h-64 relative bg-black overflow-hidden flex items-center justify-center">
                  
                  {/* Blurred Background */}
                  <img src={ride.images?.[0]} className="absolute inset-0 w-full h-full object-cover blur-xl scale-110 opacity-30" alt="" />
                  
                  {/* Main Contained Image */}
                  <img src={ride.images?.[0]} className="relative h-[90%] w-[90%] object-contain z-10 transition-transform duration-1000 group-hover:scale-105" alt="vehicle" />
                  
                  <div className="absolute top-6 left-6 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-2 z-20">
                    <CheckCircle2 size={12} className="text-orange-500" />
                    <p className="text-white font-black text-[9px] tracking-widest uppercase">{ride.seatsAvailable} SEATS AVAILABLE</p>
                  </div>
                </div>

                <div className="p-10 space-y-8 flex-grow flex flex-col justify-between">
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none truncate">{ride.vehicleType || "Fleet Vehicle"}</h3>
                      <div className="flex items-center gap-2 mt-2">
                         <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">{ride.routeFrom}</span>
                         <ArrowRight size={10} className="text-orange-600"/>
                         <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">{ride.routeTo}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                        <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1 leading-none">Per Seat</p>
                        <p className="text-2xl font-black text-white leading-none">₹{ride.pricePerSeat}</p>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-white/5">
                    <button 
                       onClick={() => { setSelectedRide(ride); setModalMode("booking"); }}
                       className="w-full bg-orange-600 text-white py-5 rounded-[25px] font-black uppercase text-[10px] tracking-[0.3em] transition-all flex items-center justify-center gap-3 shadow-2xl active:scale-95"
                    >
                      SECURE SEAT <ArrowRight size={14}/>
                    </button>
                    
                    <button 
                      onClick={() => setExpandedRideId(expandedRideId === ride._id ? null : ride._id)}
                      className="w-full text-white/20 text-[9px] font-black uppercase tracking-[0.4em] hover:text-orange-600 transition-colors"
                    >
                      {expandedRideId === ride._id ? "Hide Route" : "Live Route Preview"}
                    </button>
                  </div>

                  <AnimatePresence>
                    {expandedRideId === ride._id && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="pt-4">
                        <RoutePreview pickupCoords={ride.fromCoords} destinationCoords={ride.toCoords} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>

      {/* MODAL REDESIGN - UPDATED FOR FULL IMAGE & THUMBNAILS */}
      <AnimatePresence>
        {selectedRide && (
          <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 md:p-8">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedRide(null)} className="absolute inset-0 bg-black/95 backdrop-blur-xl" />

            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-6xl bg-[#0a0a0a] border border-white/10 rounded-[50px] overflow-hidden shadow-3xl z-[5500] flex flex-col md:flex-row h-full max-h-[85vh]">
              
              <button onClick={() => setSelectedRide(null)} className="absolute top-8 right-8 w-12 h-12 flex items-center justify-center rounded-full bg-white/5 text-white/40 hover:bg-white hover:text-black transition-all z-[6000] border border-white/10 active:scale-90"><X size={24}/></button>

              {/* LEFT: IMAGE VIEW (object-contain) */}
              <div className="w-full md:w-[45%] relative bg-black border-r border-white/5 flex items-center justify-center">
                
                {/* Blur BG */}
                <img src={selectedRide.images?.[currentModalImgIndex]} className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 opacity-30" alt="" />

                {/* Main Full Image */}
                <img src={selectedRide.images?.[currentModalImgIndex]} className="relative h-[95%] w-[95%] object-contain z-10" alt="vehicle_detail" />
                
                {/* Image Count/Indicator (Optional) */}
                {selectedRide.images?.length > 1 && (
                    <div className="absolute bottom-6 left-6 bg-black/60 px-3 py-1.5 rounded-full text-white/60 font-black text-[9px] z-20 border border-white/10">{currentModalImgIndex + 1} / {selectedRide.images.length}</div>
                )}

                <div className="absolute top-10 left-10 z-20">
                   <p className="text-orange-500 text-[9px] font-black tracking-[0.5em] uppercase italic px-4 py-2 bg-black/40 rounded-full border border-white/10">Partner Verified Fleet</p>
                </div>
              </div>

              {/* RIGHT: CONFIGURATION & GALLERY THUMBNAILS */}
              <div className="flex-1 p-10 md:p-12 overflow-y-auto no-scrollbar space-y-10 flex flex-col">
                <div className="flex-grow space-y-10">
                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-white/20 uppercase tracking-widest italic leading-none">Expedition Route</p>
                        <p className="text-white font-bold text-sm uppercase flex items-center gap-2 truncate pt-1"><MapPin size={14} className="text-orange-500"/> {selectedRide.routeFrom} ➔ {selectedRide.routeTo}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-white/20 uppercase tracking-widest italic leading-none">Pilot / Manager</p>
                        <p className="text-white font-bold text-sm uppercase flex items-center gap-2 truncate pt-1"><User size={14} className="text-orange-600"/> {selectedRide.driverName || "Fleet Official"}</p>
                      </div>
                    </div>

                    {/* Technical Specs from Screenshot 1 & 2 */}
                    <div className="bg-white/5 p-6 rounded-[35px] border border-white/5 space-y-5">
                        <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] italic">Vehicle Technical Specifications</p>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-xs font-bold text-white/80 uppercase">
                            <p>● Vehicle: <span className="text-white font-black">{selectedRide.vehicleModel || selectedRide.vehicleType}</span></p>
                            <p>● Car Type: <span className="text-white font-black">{selectedRide.carType || "SUV/MUV"}</span></p>
                            <p>● Color: <span className="text-white font-black">{selectedRide.color || "Standard"}</span></p>
                            <p>● Year: <span className="text-white font-black">{selectedRide.yearOfManufacture || "N/A"}</span></p>
                            <p className="col-span-2 border-t border-white/5 pt-2">● Plate: <span className="text-white font-black">{selectedRide.plateNumber || "Verified"}</span></p>
                        </div>
                    </div>

                    {/* ✅ CHANGE 2: Image Gallery Thumbnails Added */}
                    {selectedRide.images?.length > 1 && (
                        <div className="space-y-4">
                            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] italic">Explore All Angles ({selectedRide.images.length})</p>
                            <div className="flex flex-wrap gap-3">
                                {selectedRide.images.map((img, index) => (
                                    <img 
                                        key={index} 
                                        src={img} 
                                        onClick={() => setCurrentModalImgIndex(index)} // ✅ SET ACTIVE IMAGE
                                        className={`w-20 h-20 object-cover rounded-2xl border-4 cursor-pointer transition-all hover:border-orange-600 ${currentModalImgIndex === index ? 'border-orange-600 scale-105' : 'border-white/5'}`} 
                                        alt={`thumbnail_${index}`} 
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="bg-white/[0.02] p-8 rounded-[40px] border border-white/5 space-y-6">
                        <div className="flex justify-between items-end pb-6 border-b border-white/5">
                            <div>
                                <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1 leading-none">Pricing Configuration</p>
                                <p className="text-4xl font-black text-white italic tracking-tighter leadin-none">₹{selectedRide.pricePerSeat}<span className="text-xs text-white/20 ml-2 italic uppercase font-black tracking-widest leading-none">/ SEAT</span></p>
                            </div>
                            <div className="text-right flex-shrink-0">
                                <p className="text-[9px] font-black text-orange-500 uppercase tracking-widest mb-1 leading-none">Availability</p>
                                <p className="text-white font-black text-xl italic leading-none">{selectedRide.seatsAvailable} Left</p>
                            </div>
                        </div>

                        <div className="pt-4 space-y-5 text-center">
                            <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.4em] leading-none">Select Required Capacity</p>
                            <div className="flex items-center justify-center gap-10">
                                <button onClick={() => setBookingSeats(p => Math.max(1, p - 1))} className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/10 text-white transition-all active:scale-90"><Minus/></button>
                                <span className="text-5xl font-black italic text-white w-12 text-center leading-none">{bookingSeats}</span>
                                <button onClick={() => setBookingSeats(p => Math.min(selectedRide.seatsAvailable, p + 1))} className="w-14 h-14 rounded-full bg-orange-600 flex items-center justify-center hover:bg-orange-500 text-white transition-all shadow-xl shadow-orange-600/30 active:scale-90"><Plus/></button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-6 border-t border-white/5 space-y-4">
                  <button 
                    disabled={isProcessing} 
                    onClick={bookRide}
                    className="w-full bg-white text-black py-6 rounded-[30px] font-black uppercase text-[12px] tracking-[0.4em] flex items-center justify-center gap-4 hover:bg-orange-600 hover:text-white transition-all active:scale-95 shadow-2xl shadow-white/5"
                  >
                    {isProcessing ? "TRANSMITTING DATA..." : <><Phone size={18}/> CONFIRM & TRANSMIT</>}
                  </button>
                  <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em] text-center">Encrypted fleet secured booking gateway via Mountain Mate logistics</p>
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