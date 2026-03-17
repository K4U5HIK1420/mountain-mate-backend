import React, { useEffect, useState } from 'react';
import API from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Car, MapPin, RefreshCw, Loader2, Navigation, Users, Plus, Minus, CheckCircle2, Clock, ShieldCheck, Activity, Zap } from 'lucide-react';
import { useNotify } from "../context/NotificationContext";

const ManageRides = () => {
  const { notify } = useNotify();
  const [myRides, setMyRides] = useState([]);
  const [loading, setLoading] = useState(true);

  const hubs = ["Guptakashi", "Sonprayag", "Phata", "Rudraprayag", "Rishikesh", "Dehradun"];

  useEffect(() => {
    const fetchMyFleet = async () => {
      try {
        const res = await API.get("/transport/my-rides");
        setMyRides(res.data.data || res.data);
      } catch (err) {
        notify("Fleet link failed", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchMyFleet();
  }, []);

  const updateRideData = async (id, updatedFields) => {
    try {
      await API.patch(`/transport/update/${id}`, updatedFields);
      setMyRides(myRides.map(ride => ride._id === id ? { ...ride, ...updatedFields } : ride));
      notify("Cloud Synced Successfully", "success");
    } catch (err) {
      notify("Transmission Error", "error");
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505]">
      <div className="relative">
        <Loader2 className="animate-spin text-orange-600" size={60}/>
        <div className="absolute inset-0 blur-2xl bg-orange-600/20 animate-pulse"></div>
      </div>
      <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.6em] mt-8 italic">Establishing Secure Fleet Link...</p>
    </div>
  );

  return (
    <div className="relative min-h-screen bg-[#050505] pt-40 pb-32 px-6">
      {/* Background Visuals */}
      <div className="fixed inset-0 z-0">
        <img src="https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=2500" className="w-full h-full object-cover opacity-10 grayscale" alt="BG" />
        <div className="absolute inset-0 bg-gradient-to-tr from-black via-[#050505] to-orange-900/10"></div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative z-10 max-w-6xl mx-auto">
        
        {/* DASHBOARD HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-24 gap-8">
            <div className="relative">
                <div className="absolute -left-6 top-0 bottom-0 w-1 bg-orange-600 rounded-full shadow-[0_0_15px_rgba(234,88,12,0.5)]"></div>
                <h1 className="text-7xl md:text-8xl font-black text-white uppercase italic tracking-tighter leading-[0.8]">
                    FLEET <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-800">OPS.</span>
                </h1>
                <p className="text-white/40 font-bold text-[10px] tracking-[0.4em] uppercase mt-6 flex items-center gap-2">
                   <Zap size={14} className="text-orange-500 fill-orange-500 animate-bounce"/> Real-time Command Center
                </p>
            </div>
            <div className="bg-white/5 backdrop-blur-2xl border border-white/10 px-8 py-5 rounded-[30px] shadow-2xl">
                <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1 text-center md:text-left">Operational Units</p>
                <p className="text-3xl font-black italic text-white leading-none text-center md:text-left">{myRides.length < 10 ? `0${myRides.length}` : myRides.length}</p>
            </div>
        </div>

        {/* FLEET CARDS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {myRides.length > 0 ? myRides.map((ride) => (
            <motion.div 
              key={ride._id} 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ y: -8 }}
              className="bg-white/[0.02] border border-white/5 p-10 rounded-[55px] backdrop-blur-3xl shadow-3xl relative overflow-hidden group transition-all duration-500 hover:border-orange-500/30"
            >
              {/* Animated Corner Accent */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-600/5 blur-[80px] group-hover:bg-orange-600/20 transition-all duration-700"></div>

              <div className="flex justify-between items-start mb-12">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-white/10 to-transparent rounded-[24px] flex items-center justify-center text-orange-500 border border-white/10 group-hover:bg-orange-600 group-hover:text-white transition-all shadow-2xl">
                    <Car size={30} />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-white uppercase italic leading-none tracking-tight">{ride.vehicleModel || "Expedition"}</h3>
                    <p className="text-white/20 text-[9px] font-black tracking-[0.3em] uppercase mt-2 italic">{ride.plateNumber}</p>
                  </div>
                </div>
                
                <div className={`px-5 py-2.5 rounded-2xl text-[8px] font-black uppercase tracking-widest border flex items-center gap-3 shadow-xl ${
                    ride.status === 'approved' 
                    ? 'bg-green-500/10 text-green-500 border-green-500/20 shadow-green-500/5' 
                    : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${ride.status === 'approved' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></div>
                  {ride.status}
                </div>
              </div>

              {/* SEAT CONTROLLER: Visual Touchup */}
              <div className="bg-gradient-to-r from-black/60 to-black/40 border border-white/5 p-8 rounded-[40px] mb-8 flex items-center justify-between shadow-inner">
                <div className="space-y-1">
                    <p className="text-[10px] font-black text-orange-500 uppercase tracking-[0.4em] italic leading-none">Live Capacity</p>
                    <p className="text-white/30 font-bold text-[9px] uppercase tracking-widest leading-none">Passenger Inventory</p>
                </div>
                <div className="flex items-center gap-8">
                    <button 
                        onClick={() => updateRideData(ride._id, { seatsAvailable: Math.max(0, ride.seatsAvailable - 1) })}
                        className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-red-600/20 hover:text-red-500 hover:border-red-500/40 transition-all active:scale-90"
                    >
                        <Minus size={22}/>
                    </button>
                    <div className="relative px-4">
                        <span className="text-6xl font-black text-white italic tracking-tighter drop-shadow-2xl">{ride.seatsAvailable}</span>
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-orange-600 rounded-full shadow-[0_0_10px_orange]"></div>
                    </div>
                    <button 
                        onClick={() => updateRideData(ride._id, { seatsAvailable: ride.seatsAvailable + 1 })}
                        className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-green-600/20 hover:text-green-500 hover:border-green-500/40 transition-all active:scale-90"
                    >
                        <Plus size={22}/>
                    </button>
                </div>
              </div>

              {/* HUB SWITCHER: Premium Chips */}
              <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                    <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.5em] flex items-center gap-3 italic">
                        <Navigation size={14} className="text-orange-500"/> Station Link
                    </label>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {hubs.map((loc) => (
                    <button 
                      key={loc}
                      onClick={() => updateRideData(ride._id, { routeFrom: loc })}
                      className={`py-4 rounded-[22px] text-[10px] font-black uppercase transition-all border relative overflow-hidden ${
                        ride.routeFrom === loc 
                        ? 'bg-white text-black border-white shadow-[0_0_30px_rgba(255,255,255,0.15)] scale-105' 
                        : 'bg-white/5 text-white/30 border-white/5 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      {ride.routeFrom === loc && <motion.div layoutId="activeHub" className="absolute inset-0 bg-white" />}
                      <span className="relative z-10">{loc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* FOOTER: Live Telemetry Feel */}
              <div className="mt-10 pt-8 border-t border-white/5 flex justify-between items-center px-2">
                <div className="flex gap-4">
                    <div className="flex items-center gap-2 text-[9px] font-black text-white/40 uppercase bg-white/5 px-4 py-2 rounded-xl">
                        Rate: <span className="text-orange-500 italic">₹{ride.pricePerSeat}</span>
                    </div>
                </div>
                <div className="text-[9px] font-black text-orange-600 uppercase tracking-widest italic flex items-center gap-2">
                    <RefreshCw size={12} className="animate-spin-slow"/> 
                    <span className="animate-pulse">Live Link Active</span>
                </div>
              </div>

            </motion.div>
          )) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-full py-40 text-center border-2 border-dashed border-white/10 rounded-[80px]">
              <p className="text-white/10 font-black tracking-[1em] uppercase italic text-2xl">Waiting for Fleet Connection...</p>
            </motion.div>
          )}
        </div>
      </motion.div>
      
      {/* Decorative Bottom Glow */}
      <div className="fixed bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-orange-600/20 to-transparent"></div>
    </div>
  );
};

export default ManageRides;