import React, { useEffect, useState } from 'react';
import API from '../utils/api';
import { motion } from 'framer-motion';
import { Car, MapPin, RefreshCw, Loader2, Navigation, Users, Plus, Minus, CheckCircle2, Clock } from 'lucide-react';
import { useNotify } from "../context/NotificationContext";

const ManageRides = () => {
  const { notify } = useNotify();
  const [myRides, setMyRides] = useState([]);
  const [loading, setLoading] = useState(true);

  // Uttarakhand Hubs for quick update
  const hubs = ["Guptakashi", "Sonprayag", "Phata", "Rudraprayag", "Rishikesh", "Dehradun"];

  useEffect(() => {
    const fetchMyFleet = async () => {
      try {
        const res = await API.get("/transport/my-rides");
        // backend returns { success: true, data: [...] }
        setMyRides(res.data.data || res.data);
      } catch (err) {
        console.error("Fleet fetch error", err);
        notify("Failed to fetch your fleet details", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchMyFleet();
  }, []);

  // Universal Update Function for Hubs & Seats
  const updateRideData = async (id, updatedFields) => {
    try {
      // ✅ Syncing with backend PATCH /transport/update/:id
      await API.patch(`/transport/update/${id}`, updatedFields);
      setMyRides(myRides.map(ride => ride._id === id ? { ...ride, ...updatedFields } : ride));
      notify("Fleet Synced with Cloud! 🏔️", "success");
    } catch (err) {
      notify("Transmission failed! Try again.", "error");
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-black"><Loader2 className="animate-spin text-orange-600" size={40}/></div>;

  return (
    <div className="relative min-h-screen pt-40 pb-20 px-8">
      <img src="https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=2500" className="fixed inset-0 w-full h-full object-cover z-[-1] grayscale-[40%]" alt="BG" />
      <div className="fixed inset-0 bg-black/85 backdrop-blur-[8px] z-[-1]"></div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-6xl mx-auto">
        <div className="mb-16">
            <h1 className="text-7xl font-black text-white uppercase italic tracking-tighter leading-none">Manage <span className="text-orange-500 text-glow">Fleet.</span></h1>
            <p className="text-white/20 font-bold text-[10px] tracking-[0.5em] uppercase mt-6 italic ml-2">Authorized Fleet Management Console</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {myRides.length > 0 ? myRides.map((ride) => (
            <div key={ride._id} className="bg-white/[0.02] border border-white/10 p-12 rounded-[60px] backdrop-blur-3xl shadow-2xl group hover:border-orange-500/30 transition-all relative overflow-hidden">
              
              {/* --- HEADER: MODEL & STATUS --- */}
              <div className="flex justify-between items-start mb-12 relative z-10">
                <div className="flex items-center gap-6">
                  <div className="bg-orange-600/10 p-6 rounded-[30px] text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-all shadow-xl border border-orange-600/20">
                    <Car size={32} />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-white uppercase italic tracking-tight">{ride.vehicleModel}</h3>
                    <p className="text-white/30 text-[10px] font-black tracking-[0.3em] uppercase mt-1">{ride.plateNumber}</p>
                  </div>
                </div>
                
                {/* Status Badge */}
                <div className={`flex items-center gap-2 px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-lg ${
                    ride.status === 'approved' 
                    ? 'bg-green-500/10 text-green-500 border-green-500/20' 
                    : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                }`}>
                  {ride.status === 'approved' ? <CheckCircle2 size={12}/> : <Clock size={12}/>}
                  {ride.status}
                </div>
              </div>

              {/* --- INVENTORY: LIVE SEATS --- */}
              <div className="bg-white/5 p-8 rounded-[45px] mb-10 border border-white/5 flex items-center justify-between shadow-inner">
                <div>
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-2 flex items-center gap-2">
                        <Users size={16} className="text-orange-500"/> Seats Remaining
                    </p>
                    <p className="text-[8px] text-white/10 uppercase font-black tracking-widest italic">Live availability on M-Mate</p>
                </div>
                <div className="flex items-center gap-8 bg-black/40 p-2 rounded-full border border-white/5 shadow-2xl">
                    <button 
                        onClick={() => updateRideData(ride._id, { seatsAvailable: Math.max(0, ride.seatsAvailable - 1) })}
                        className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-red-600 transition-all border border-white/5 shadow-xl"
                    >
                        <Minus size={20}/>
                    </button>
                    <span className="text-5xl font-black text-white w-10 text-center italic">{ride.seatsAvailable}</span>
                    <button 
                        onClick={() => updateRideData(ride._id, { seatsAvailable: ride.seatsAvailable + 1 })}
                        className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-green-600 transition-all border border-white/5 shadow-xl"
                    >
                        <Plus size={20}/>
                    </button>
                </div>
              </div>

              {/* --- DYNAMIC HUB UPDATE --- */}
              <div className="space-y-6">
                <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] ml-4 flex items-center gap-2 italic">
                    <Navigation size={14} className="text-orange-500"/> Update Current Hub
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {hubs.map((loc) => (
                    <button 
                      key={loc}
                      onClick={() => updateRideData(ride._id, { routeFrom: loc })}
                      className={`py-5 rounded-[25px] text-[9px] font-black uppercase tracking-tighter transition-all border ${
                        ride.routeFrom === loc 
                        ? 'bg-white text-black border-white shadow-[0_10px_30px_rgba(255,255,255,0.1)] scale-105' 
                        : 'bg-white/5 text-white/40 border-white/5 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              </div>

              {/* --- ROUTE VIEW --- */}
              <div className="mt-12 pt-8 border-t border-white/5 flex justify-between items-center text-white/20">
                <div className="text-[9px] font-black uppercase tracking-widest italic">
                    Route: <span className="text-white/60">{ride.routeFrom}</span> <RefreshCw size={10} className="inline mx-2"/> <span className="text-white/60">{ride.routeTo}</span>
                </div>
                <div className="text-[9px] font-black uppercase tracking-widest italic">
                    Rate: <span className="text-orange-500">₹{ride.pricePerSeat}</span>
                </div>
              </div>

            </div>
          )) : (
            <div className="col-span-full py-40 text-center border-4 border-dashed border-white/5 rounded-[80px] text-white/10 font-black tracking-[1em] uppercase italic">
              Fleet Disconnected / No Active Units
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ManageRides;