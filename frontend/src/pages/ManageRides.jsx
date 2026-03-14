import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Car, IndianRupee, Users, Plus, Minus, Loader2, 
  Clock, CheckCircle2, Edit3, X, Phone, MapPin, 
  ShieldCheck, Zap, Navigation, RefreshCw, UserCheck
} from 'lucide-react';

// --- MOCK LOGIC FOR PREVIEW ---
// Local project mein aap apne real imports wapas daal sakte hain:
// import API from '../utils/api';
// import { useNotify } from "../context/NotificationContext";

const useNotify = () => ({
  notify: (msg, type) => console.log(`[Notification - ${type}]: ${msg}`)
});

const API = {
  get: async (url) => {
    console.log(`GET request to ${url}`);
    return {
      data: {
        data: [
          {
            _id: "ride_101",
            vehicleType: "Toyota Innova",
            vehicleNumber: "UK 07 AR 1234",
            routeFrom: "Guptakashi",
            pricePerSeat: 800,
            seatsAvailable: 4,
            contactNumber: "9876543210",
            driverName: "Sanjay Negi",
            status: "approved"
          }
        ]
      }
    };
  },
  patch: async (url, data) => {
    console.log(`PATCH request to ${url}`, data);
    return { success: true };
  }
};

const ManageRides = () => {
  const { notify } = useNotify();
  const [myRides, setMyRides] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Edit Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRide, setSelectedRide] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [updating, setUpdating] = useState(false);

  const locations = ["Guptakashi", "Sonprayag", "Phata", "Rudraprayag", "Dehradun"];

  useEffect(() => {
    fetchMyFleet();
  }, []);

  const fetchMyFleet = async () => {
    try {
      const res = await API.get("/transport/my-rides"); 
      setMyRides(res.data.data || res.data);
    } catch (err) {
      console.error("Fleet fetch error", err);
      notify("Failed to load your fleet", "error");
    } finally {
      setLoading(false);
    }
  };

  // Open Modal logic
  const openEditModal = (ride) => {
    setSelectedRide(ride);
    setEditFormData({
      vehicleName: ride.vehicleType || ride.vehicleName,
      location: ride.routeFrom || ride.location,
      pricePerDay: ride.pricePerSeat || ride.pricePerDay,
      capacity: ride.seatsAvailable || ride.capacity,
      contactNumber: ride.contactNumber,
      driverName: ride.driverName || ""
    });
    setIsEditModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  // Full Sync Update
  const handleFullUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await API.patch(`/transport/update/${selectedRide._id}`, editFormData);
      notify("Fleet Specifications Synced! 🚕", "success");
      setIsEditModalOpen(false);
      fetchMyFleet(); 
    } catch (err) {
      notify("Database Sync Failed!", "error");
    } finally {
      setUpdating(false);
    }
  };

  // Quick Update for Seats/Location
  const quickSync = async (id, fields) => {
    try {
      await API.patch(`/transport/update/${id}`, fields);
      setMyRides(myRides.map(r => r._id === id ? { ...r, ...fields } : r));
      notify("Quick Sync Success", "success");
    } catch (err) {
      notify("Quick Sync Failed", "error");
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <Loader2 className="text-orange-600 animate-spin" size={40} />
    </div>
  );

  return (
    <div className="relative min-h-screen pt-40 pb-20 px-4 md:px-8">
      {/* Background Layer */}
      <img src="https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=2500" className="fixed inset-0 w-full h-full object-cover z-[-1]" alt="Background" />
      <div className="fixed inset-0 bg-black/75 backdrop-blur-[6px] z-[-1]"></div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-6xl mx-auto">
        <div className="mb-16">
          <h1 className="text-6xl md:text-8xl font-black text-white uppercase italic tracking-tighter leading-none">
            Manage <span className="text-orange-500">Fleet.</span>
          </h1>
          <p className="text-white/30 text-[10px] font-black tracking-[0.4em] uppercase mt-6 ml-2 italic flex items-center gap-3">
            <Zap size={12} className="text-orange-500" /> Authorized Fleet Operator / Vault 2026
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {myRides.length > 0 ? myRides.map((ride) => (
            <div key={ride._id} className="bg-white/[0.03] border border-white/10 p-10 rounded-[60px] backdrop-blur-3xl shadow-2xl group transition-all hover:border-white/20">
              
              {/* Header: Model & Plate */}
              <div className="flex justify-between items-start mb-10">
                <div className="flex items-center gap-5">
                  <div className="bg-orange-600/20 p-5 rounded-[25px] text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-all">
                    <Car size={32}/>
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-white uppercase italic tracking-tight">{ride.vehicleType || ride.vehicleName}</h3>
                    <p className="text-white/30 text-[10px] font-black tracking-widest uppercase">{ride.vehicleNumber}</p>
                  </div>
                </div>
                <div className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border flex items-center gap-2 ${ride.status === 'approved' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-orange-500/10 text-orange-500 border-orange-500/20'}`}>
                  {ride.status === 'approved' ? <CheckCircle2 size={12}/> : <Clock size={12} className="animate-pulse"/>}
                  {ride.status === 'approved' ? 'Active' : 'Pending'}
                </div>
              </div>

              {/* Inventory Management */}
              <div className="bg-white/5 p-8 rounded-[40px] mb-8 border border-white/5 flex items-center justify-between group-hover:bg-white/[0.07] transition-all">
                <div>
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-1 flex items-center gap-2">
                        <Users size={14} className="text-orange-500"/> Available Seats
                    </p>
                    <p className="text-[8px] text-white/10 uppercase font-bold tracking-widest italic">Live Inventory</p>
                </div>
                <div className="flex items-center gap-6 bg-black/40 p-2 rounded-full border border-white/5">
                    <button onClick={() => quickSync(ride._id, { capacity: Math.max(0, (ride.seatsAvailable || ride.capacity) - 1) })} className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-red-600 transition-all"><Minus size={20}/></button>
                    <span className="text-4xl font-black text-white min-w-[40px] text-center italic">{ride.seatsAvailable || ride.capacity}</span>
                    <button onClick={() => quickSync(ride._id, { capacity: (ride.seatsAvailable || ride.capacity) + 1 })} className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-green-600 transition-all"><Plus size={20}/></button>
                </div>
              </div>

              {/* Location Selector */}
              <div className="space-y-6 mb-10">
                <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-2 flex items-center gap-2"><Navigation size={14}/> Current Base Hub</label>
                <div className="grid grid-cols-3 gap-4">
                  {locations.map((loc) => (
                    <button 
                      key={loc}
                      onClick={() => quickSync(ride._id, { location: loc })}
                      className={`py-4 rounded-2xl text-[9px] font-black uppercase tracking-tighter transition-all border ${ (ride.routeFrom || ride.location) === loc ? 'bg-white text-black border-white shadow-xl' : 'bg-white/5 text-white/40 border-white/10 hover:border-white/30'}`}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={() => openEditModal(ride)}
                className="w-full bg-white/5 hover:bg-white hover:text-black border border-white/10 py-7 rounded-[35px] font-black text-[11px] uppercase tracking-[0.5em] transition-all active:scale-95 flex items-center justify-center gap-4 shadow-xl"
              >
                <Edit3 size={18}/> Update Fleet Specs
              </button>
            </div>
          )) : (
            <div className="col-span-1 md:col-span-2 py-40 text-center border-4 border-dashed border-white/5 rounded-[80px]">
                <p className="text-white/10 text-4xl font-black uppercase tracking-[0.8em] italic">No Rides Registered</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* --- EDIT MODAL (POPUP) --- */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsEditModalOpen(false)} className="absolute inset-0 bg-black/90 backdrop-blur-xl" />
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="relative w-full max-w-4xl bg-[#0A0A0A] border border-white/10 rounded-[60px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-10 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                <div>
                  <h2 className="text-4xl font-black text-white tracking-tight uppercase italic">FLEET <span className="text-orange-500">MANAGER.</span></h2>
                  <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] mt-2">PLATE: {selectedRide?.vehicleNumber}</p>
                </div>
                <button onClick={() => setIsEditModalOpen(false)} className="bg-white/5 p-4 rounded-full text-white/40 hover:text-white hover:bg-red-500 transition-all"><X size={24}/></button>
              </div>

              <form onSubmit={handleFullUpdate} className="p-10 space-y-10 overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest flex items-center gap-3 ml-2"><IndianRupee size={14}/> Price Per Day / Seat</label>
                    <input name="pricePerDay" value={editFormData.pricePerDay} onChange={handleInputChange} type="number" className="w-full bg-white/5 border border-white/10 p-6 rounded-[30px] text-white font-bold outline-none focus:border-orange-500 transition-all" />
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest flex items-center gap-3 ml-2"><Users size={14}/> Total Seating Capacity</label>
                    <input name="capacity" value={editFormData.capacity} onChange={handleInputChange} type="number" className="w-full bg-white/5 border border-white/10 p-6 rounded-[30px] text-white font-bold outline-none focus:border-orange-500 transition-all" />
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest flex items-center gap-3 ml-2"><Phone size={14}/> Public Contact</label>
                    <input name="contactNumber" value={editFormData.contactNumber} onChange={handleInputChange} type="text" className="w-full bg-white/5 border border-white/10 p-6 rounded-[30px] text-white font-bold outline-none focus:border-orange-500 transition-all" />
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest flex items-center gap-3 ml-2"><MapPin size={14}/> Current Location</label>
                    <input name="location" value={editFormData.location} onChange={handleInputChange} type="text" className="w-full bg-white/5 border border-white/10 p-6 rounded-[30px] text-white font-bold outline-none focus:border-orange-500 transition-all" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest flex items-center gap-3 ml-2"><UserCheck size={14}/> Driver Name</label>
                    <input name="driverName" value={editFormData.driverName} onChange={handleInputChange} type="text" className="w-full bg-white/5 border border-white/10 p-6 rounded-[30px] text-white font-bold outline-none focus:border-orange-500 transition-all" />
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest flex items-center gap-3 ml-2"><Navigation size={14}/> Vehicle Model</label>
                    <input name="vehicleName" value={editFormData.vehicleName} onChange={handleInputChange} type="text" className="w-full bg-white/5 border border-white/10 p-6 rounded-[30px] text-white font-bold outline-none focus:border-orange-500 transition-all" />
                  </div>
                </div>

                <button disabled={updating} type="submit" className="w-full bg-white text-black font-black p-8 rounded-[35px] uppercase tracking-[0.5em] text-[12px] hover:bg-orange-600 hover:text-white transition-all flex items-center justify-center gap-4 disabled:opacity-50">
                  {updating ? <Loader2 className="animate-spin" size={20}/> : <ShieldCheck size={20}/>}
                  {updating ? "SYNCING DATABASE..." : "PUSH UPDATES LIVE"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}} />
    </div>
  );
};

export default ManageRides;