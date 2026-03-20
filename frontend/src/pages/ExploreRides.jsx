import React, { useState, useEffect } from "react";
import socket from "../utils/socket";
import API from "../utils/api";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MapPin, Navigation, Plus, Minus, X, ShieldCheck, 
  Phone, User, Car, ArrowRight, CheckCircle2, 
  Sparkles, Gauge, Fuel, Briefcase, Info, TrendingUp
} from "lucide-react";
import { useNotify } from "../context/NotificationContext";
import RoutePreview from "../components/RoutePreview";
import { RidesGridSkeleton } from "../components/Skeletons";

const ExploreRides = () => {
  const { notify } = useNotify();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRide, setSelectedRide] = useState(null);
  const [currentModalImgIndex, setCurrentModalImgIndex] = useState(0);
  const [bookingSeats, setBookingSeats] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pickupFilter, setPickupFilter] = useState("");
  const [dropFilter, setDropFilter] = useState("");
  const [expandedRideId, setExpandedRideId] = useState(null);

  useEffect(() => {
    document.body.style.overflow = selectedRide ? "hidden" : "auto";
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
    } catch (err) { setRides([]); } finally { setLoading(false); }
  };

  useEffect(() => { loadApprovedRides(); }, []);

  const fetchListings = async () => {
    if (!pickupFilter && !dropFilter) return loadApprovedRides();
    setLoading(true);
    try {
      const response = await API.get("/transport/search", { params: { from: pickupFilter, to: dropFilter } });
      setRides(response.data.data || response.data || []);
    } catch (error) { setRides([]); } finally { setLoading(false); }
  };

  const bookRide = async () => {
    try {
      setIsProcessing(true);
      const token = localStorage.getItem("token");
      if (!token) return notify("Bhai, pehle login toh kar lo!", "error");

      const res = await API.post("/transport/book", { rideId: selectedRide._id, seats: bookingSeats });
      if (res.data.success) {
        notify("Expedition Secured!", "success");
        const message = `Namaste! I just booked ${bookingSeats} seat(s) in your ${selectedRide.vehicleType} via Mountain Mate. 🏔️`;
        window.open(`https://wa.me/${selectedRide.contactNumber}?text=${encodeURIComponent(message)}`, "_blank");
        setSelectedRide(null);
        loadApprovedRides();
      }
    } catch (err) { notify("Logistics Error.", "error"); } finally { setIsProcessing(false); }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-orange-600 relative overflow-x-hidden font-sans">
      
      {/* Cinematic Ambiance */}
      <div className="fixed top-[-10%] right-[-10%] w-[300px] md:w-[800px] h-[300px] md:h-[800px] bg-orange-600/5 blur-[120px] md:blur-[180px] rounded-full pointer-events-none" />

      <Container className="pt-28 md:pt-40 pb-20 md:pb-32 relative z-10 px-4">
        
        {/* --- HEADER --- */}
        <div className="max-w-5xl mx-auto mb-16 md:mb-32 text-center relative">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-4 md:px-6 py-2 rounded-full border border-orange-600/20 bg-orange-600/5 backdrop-blur-xl mb-6 md:mb-10">
            <Sparkles size={12} className="text-orange-500 animate-pulse" />
            <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] md:tracking-[0.5em] italic text-orange-400">Fleet Deployment Active</span>
          </motion.div>
          
          <h1 className="text-4xl md:text-8xl lg:text-[10rem] font-black italic uppercase tracking-tighter leading-[0.85] md:leading-[0.75] mb-10 md:mb-16">
            HIRE YOUR <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-600 to-white">EXPEDITION.</span>
          </h1>

          {/* Search Box */}
          <div className="max-w-4xl mx-auto bg-white/5 backdrop-blur-3xl p-2 md:p-3 rounded-[30px] md:rounded-[45px] border border-white/10 flex flex-col md:flex-row gap-2 md:gap-3 shadow-3xl">
            <div className="flex-1 flex items-center px-6 md:px-10 py-4 md:py-5 gap-3 md:gap-5 bg-white/[0.03] rounded-[22px] md:rounded-[35px] border border-white/5 focus-within:border-orange-600">
              <MapPin className="text-orange-600" size={18} />
              <input onChange={(e) => setPickupFilter(e.target.value)} placeholder="SOURCE" className="bg-transparent w-full text-white font-black uppercase text-[10px] md:text-[12px] tracking-widest outline-none placeholder:text-white/20 italic" />
            </div>
            <div className="flex-1 flex items-center px-6 md:px-10 py-4 md:py-5 gap-3 md:gap-5 bg-white/[0.03] rounded-[22px] md:rounded-[35px] border border-white/5 focus-within:border-orange-600">
              <Navigation className="text-orange-600" size={18} />
              <input onChange={(e) => setDropFilter(e.target.value)} placeholder="DESTINATION" className="bg-transparent w-full text-white font-black uppercase text-[10px] md:text-[12px] tracking-widest outline-none placeholder:text-white/20 italic" />
            </div>
            <button onClick={fetchListings} className="bg-orange-600 hover:bg-white hover:text-black text-white px-8 md:px-14 py-4 md:py-6 rounded-[22px] md:rounded-[35px] font-black uppercase text-[10px] md:text-[12px] tracking-[0.3em] transition-all shadow-xl">
              SCAN FLEET
            </button>
          </div>
        </div>

        {/* --- GRID --- */}
        {loading ? (
          <RidesGridSkeleton />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
            {rides.map((ride) => (
              <RideCard 
                key={ride._id} 
                ride={ride} 
                onSelect={() => setSelectedRide(ride)}
                isExpanded={expandedRideId === ride._id}
                onToggleExpand={() => setExpandedRideId(expandedRideId === ride._id ? null : ride._id)}
              />
            ))}
          </div>
        )}
      </Container>

      {/* --- MODAL (Responsive) --- */}
      <AnimatePresence>
        {selectedRide && (
          <Modal 
            ride={selectedRide} 
            onClose={() => setSelectedRide(null)} 
            bookingSeats={bookingSeats}
            setBookingSeats={setBookingSeats}
            isProcessing={isProcessing}
            onConfirm={bookRide}
            currentImgIndex={currentModalImgIndex}
            setCurrentImgIndex={setCurrentModalImgIndex}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// --- SUB-COMPONENTS ---

const RideCard = ({ ride, onSelect, isExpanded, onToggleExpand }) => (
  <motion.div whileHover={{ y: -10 }} className="group bg-white/[0.02] border border-white/5 rounded-[40px] md:rounded-[60px] overflow-hidden backdrop-blur-3xl shadow-2xl hover:border-orange-600/30 transition-all duration-500">
    <div className="h-48 md:h-72 relative bg-black/40 p-4 md:p-8 flex items-center justify-center overflow-hidden">
      <img src={ride.images?.[0]} className="absolute inset-0 w-full h-full object-cover blur-3xl opacity-20" alt="" />
      <motion.img 
        layoutId={`ride-img-${ride._id}`}
        src={ride.images?.[0]} 
        className="relative h-full w-[90%] object-contain z-10 transition-transform duration-700 group-hover:scale-105" 
      />
      <div className="absolute top-4 right-4 md:top-8 md:right-8 bg-orange-600 px-4 py-1.5 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest shadow-xl">
        ₹{ride.pricePerSeat}
      </div>
    </div>

    <div className="p-6 md:p-10 space-y-6 md:space-y-8">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h3 className="text-2xl md:text-4xl font-black text-white italic uppercase tracking-tighter leading-none">{ride.vehicleType}</h3>
          <div className="flex items-center gap-2 text-[8px] md:text-[10px] font-black text-white/30 tracking-widest uppercase italic">
            <span>{ride.routeFrom}</span>
            <div className="w-4 md:w-8 h-[1px] bg-orange-600/50" />
            <span>{ride.routeTo}</span>
          </div>
        </div>
        <div className="flex flex-col items-end bg-white/5 p-2 md:p-3 rounded-xl border border-white/10">
           <p className="text-orange-500 text-[10px] font-black italic">{ride.seatsAvailable} OPEN</p>
        </div>
      </div>

      <div className="bg-orange-600/5 p-4 rounded-2xl border border-orange-500/10 flex items-start gap-3">
        <Sparkles size={14} className="text-orange-500 mt-0.5" />
        <p className="text-[9px] font-bold text-white/40 leading-relaxed uppercase italic line-clamp-2 md:line-clamp-none">Terrain nominal. Fast route via Sector-7 detected.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={onSelect} className="bg-orange-600 hover:bg-white hover:text-black text-white py-4 rounded-2xl font-black uppercase text-[9px] md:text-[10px] tracking-widest transition-all shadow-xl flex items-center justify-center gap-2 italic">
          BOOK <ArrowRight size={14} />
        </button>
        <button onClick={onToggleExpand} className="bg-white/5 text-white/40 py-4 rounded-2xl font-black uppercase text-[9px] md:text-[10px] tracking-widest transition-all italic border border-white/5">
          {isExpanded ? "HIDE" : "MAP"}
        </button>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="pt-4">
            <div className="rounded-3xl border border-white/10 overflow-hidden bg-black/40 p-1">
                <RoutePreview pickupCoords={ride.fromCoords} destinationCoords={ride.toCoords} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  </motion.div>
);

const Modal = ({ ride, onClose, bookingSeats, setBookingSeats, isProcessing, onConfirm, currentImgIndex, setCurrentImgIndex }) => (
  <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 md:p-6 overflow-hidden">
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/98 backdrop-blur-3xl" />

    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-6xl bg-[#0a0a0a] border border-orange-950/20 rounded-[40px] md:rounded-[70px] overflow-hidden shadow-3xl z-[5500] flex flex-col lg:flex-row h-full max-h-[90vh]">
      
      <button onClick={onClose} className="absolute top-6 right-6 md:top-10 md:right-10 w-10 h-10 md:w-16 md:h-16 flex items-center justify-center rounded-full bg-white/5 text-white/40 hover:bg-orange-600 hover:text-white transition-all z-[6000] border border-white/10"><X size={20}/></button>

      {/* Visualizer */}
      <div className="w-full lg:w-[55%] relative bg-black/60 border-r border-white/5 flex flex-col h-[40%] md:h-auto overflow-hidden">
        <div className="flex-1 relative flex items-center justify-center p-8 md:p-20">
            <img src={ride.images?.[currentImgIndex]} className="absolute inset-0 w-full h-full object-cover blur-3xl opacity-20" alt="" />
            <motion.img 
              key={currentImgIndex}
              initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
              src={ride.images?.[currentImgIndex]} 
              className="relative h-full w-full object-contain z-10" 
            />
        </div>

        <div className="p-4 md:p-12 flex gap-3 overflow-x-auto no-scrollbar justify-center bg-gradient-to-t from-black to-transparent">
          {ride.images?.map((img, idx) => (
            <img key={idx} src={img} onClick={() => setCurrentImgIndex(idx)} className={`w-12 h-12 md:w-20 md:h-20 rounded-2xl md:rounded-[30px] object-cover cursor-pointer transition-all ${currentImgIndex === idx ? 'border-2 border-orange-600 scale-105' : 'opacity-30'}`} />
          ))}
        </div>
      </div>

      {/* Logistics Panel */}
      <div className="flex-1 p-6 md:p-16 overflow-y-auto no-scrollbar space-y-10 md:space-y-16">
        <div className="space-y-4 md:space-y-8">
          <div className="flex items-center gap-3 px-4 py-1.5 rounded-full border border-orange-600/30 w-fit bg-orange-600/5">
            <ShieldCheck className="text-orange-500" size={14} />
            <span className="text-orange-400 font-black text-[8px] md:text-[10px] tracking-widest uppercase italic">Vetted Fleet</span>
          </div>
          <h2 className="text-4xl md:text-7xl font-black italic uppercase tracking-tighter leading-[0.85] text-white">{ride.vehicleType} <br/> <span className="text-white/20">LOGISTICS.</span></h2>
        </div>

        <div className="grid grid-cols-2 gap-3 md:gap-6">
          <SpecBox icon={<Gauge size={16}/>} label="Category" val={ride.carType || "SUV"} />
          <SpecBox icon={<Fuel size={16}/>} label="Uplink" val={`${ride.seatsAvailable} Free`} />
        </div>

        <div className="bg-white/[0.03] border border-white/5 p-6 md:p-12 rounded-[30px] md:rounded-[50px] space-y-8 md:space-y-12">
          <div className="flex justify-between items-end border-b border-white/5 pb-6 md:pb-10">
            <div className="space-y-1">
              <p className="text-[8px] font-black text-white/20 uppercase tracking-widest italic">Mission Fare</p>
              <p className="text-3xl md:text-6xl font-black text-white italic tracking-tighter leading-none">₹{ride.pricePerSeat}</p>
            </div>
            <TrendingUp size={30} className="text-orange-600/20" />
          </div>

          <div className="space-y-4 md:space-y-6 text-center">
            <p className="text-[8px] md:text-[10px] font-black text-orange-500 uppercase tracking-widest italic">Capacity Assign</p>
            <div className="flex items-center justify-center gap-8 md:gap-16">
              <button onClick={() => setBookingSeats(p => Math.max(1, p - 1))} className="w-12 h-12 md:w-20 md:h-20 rounded-2xl md:rounded-[30px] border border-white/10 flex items-center justify-center bg-white/5"><Minus size={18}/></button>
              <span className="text-4xl md:text-7xl font-black italic text-white leading-none">{bookingSeats}</span>
              <button onClick={() => setBookingSeats(p => Math.max(1, Math.min(ride.seatsAvailable, p + 1)))} className="w-12 h-12 md:w-20 md:h-20 rounded-2xl md:rounded-[30px] bg-orange-600 flex items-center justify-center text-white"><Plus size={18}/></button>
            </div>
          </div>
        </div>

        <button disabled={isProcessing} onClick={onConfirm} className="w-full bg-white text-black py-6 md:py-10 rounded-3xl md:rounded-[40px] font-black uppercase text-[10px] md:text-[14px] tracking-widest md:tracking-[0.6em] flex items-center justify-center gap-3 md:gap-6 hover:bg-orange-600 hover:text-white transition-all active:scale-95 italic">
          {isProcessing ? "PROCESSING..." : <><Phone size={18}/> CONFIRM DEPLOYMENT</>}
        </button>
      </div>
    </motion.div>
  </div>
);

const SpecBox = ({ icon, label, val }) => (
  <div className="bg-white/[0.03] border border-white/5 p-4 md:p-8 rounded-3xl md:rounded-[40px] flex items-center gap-3 md:gap-6">
    <div className="text-orange-500">{icon}</div>
    <div>
      <p className="text-[7px] md:text-[9px] font-black text-white/20 uppercase tracking-widest">{label}</p>
      <p className="text-[10px] md:text-sm font-black italic uppercase text-white tracking-widest truncate max-w-[80px] md:max-w-none">{val}</p>
    </div>
  </div>
);

const Container = ({ children, className }) => (
  <div className={`max-w-7xl mx-auto ${className}`}>{children}</div>
);

export default ExploreRides;