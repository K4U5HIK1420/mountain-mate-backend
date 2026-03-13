import React, { useEffect, useState } from 'react';
import API from '../utils/api';
import { motion } from 'framer-motion';
import { Car, MapPin, RefreshCw, Loader2, Navigation, Users, Plus, Minus } from 'lucide-react';
import { useNotify } from "../context/NotificationContext";


const ManageRides = () => {
  const { notify } = useNotify();
  const [myRides, setMyRides] = useState([]);
  const [loading, setLoading] = useState(true);

  const locations = ["Guptakashi", "Sonprayag", "Phata", "Rudraprayag", "Dehradun"];

  useEffect(() => {
    const fetchMyFleet = async () => {
      try {
        const res = await API.get("/transport/my-rides");
        setMyRides(res.data.data || res.data);
      } catch (err) {
        console.error("Fleet fetch error", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMyFleet();
  }, []);

  // Universal Update Function for Location & Seats
  const updateRideData = async (id, updatedFields) => {
    try {
      await API.patch(`/transport/update/${id}`, updatedFields);
      setMyRides(myRides.map(ride => ride._id === id ? { ...ride, ...updatedFields } : ride));
      // notify("Cloud Synced! 🚀", "success");
    } catch (err) {
      notify("Sync failed!", "error");
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-black"><Loader2 className="animate-spin text-orange-600" size={40}/></div>;

  return (
    <div className="relative min-h-screen pt-40 pb-20 px-8">
      <img src="https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=2500" className="fixed inset-0 w-full h-full object-cover z-[-1]" alt="BG" />
      <div className="fixed inset-0 bg-black/75 backdrop-blur-[6px] z-[-1]"></div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-6xl mx-auto">
        <h1 className="text-6xl font-black text-white uppercase italic tracking-tighter mb-12">Manage <span className="text-orange-500">Fleet.</span></h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {myRides.length > 0 ? myRides.map((ride) => (
            <div key={ride._id} className="bg-white/[0.03] border border-white/10 p-10 rounded-[60px] backdrop-blur-3xl shadow-2xl group hover:border-orange-500/30 transition-all">
              
              {/* Header: Model & Status */}
              <div className="flex justify-between items-start mb-10">
                <div className="flex items-center gap-5">
                  <div className="bg-orange-600/20 p-5 rounded-[25px] text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-all"><Car size={32} /></div>
                  <div>
                    <h3 className="text-3xl font-black text-white uppercase italic tracking-tight">{ride.vehicleName}</h3>
                    <p className="text-white/30 text-[10px] font-black tracking-widest uppercase">{ride.vehicleNumber}</p>
                  </div>
                </div>
                <div className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border ${ride.capacity > 0 ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                  {ride.capacity > 0 ? 'Accepting Bookings' : 'Full / On Trip'}
                </div>
              </div>

              {/* SEAT INVENTORY MANAGEMENT (BlaBla Feature) */}
              <div className="bg-white/5 p-8 rounded-[40px] mb-8 border border-white/5 flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-1 flex items-center gap-2">
                        <Users size={14} className="text-orange-500"/> Available Seats
                    </p>
                    <p className="text-[8px] text-white/10 uppercase font-bold tracking-widest">Live on Explore Page</p>
                </div>
                <div className="flex items-center gap-8 bg-black/40 p-2 rounded-full border border-white/5">
                    <button 
                        onClick={() => updateRideData(ride._id, { capacity: Math.max(0, ride.capacity - 1) })}
                        className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-red-600 transition-all"
                    >
                        <Minus size={20}/>
                    </button>
                    <span className="text-4xl font-black text-white w-8 text-center">{ride.capacity}</span>
                    <button 
                        onClick={() => updateRideData(ride._id, { capacity: ride.capacity + 1 })}
                        className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-green-600 transition-all"
                    >
                        <Plus size={20}/>
                    </button>
                </div>
              </div>

              {/* LOCATION UPDATE */}
              <div className="space-y-6">
                <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-2 flex items-center gap-2"><Navigation size={14}/> Current Base Hub</label>
                <div className="grid grid-cols-3 gap-4">
                  {locations.map((loc) => (
                    <button 
                      key={loc}
                      onClick={() => updateRideData(ride._id, { location: loc })}
                      className={`py-4 rounded-2xl text-[9px] font-black uppercase tracking-tighter transition-all border ${ride.location === loc ? 'bg-white text-black border-white shadow-xl' : 'bg-white/5 text-white/40 border-white/10 hover:border-white/30'}`}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              </div>

              <button className="w-full mt-10 bg-white text-black hover:bg-orange-600 hover:text-white py-6 rounded-[35px] font-black text-[11px] uppercase tracking-[0.5em] transition-all flex items-center justify-center gap-4 shadow-xl">
                <RefreshCw size={18}/> Sync All Changes
              </button>
            </div>
          )) : (
            <div className="col-span-2 py-32 text-center border-4 border-dashed border-white/5 rounded-[80px] text-white/10 font-black tracking-widest uppercase italic">
              No Rides Offering Seats Yet
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ManageRides;