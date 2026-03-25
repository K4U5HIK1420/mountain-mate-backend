import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Hotel, IndianRupee, Plus, Minus, Loader2, 
  Edit3, X, MapPin, AlignLeft, ShieldCheck, 
  Activity, Layers, ArrowUpRight
} from 'lucide-react';
import { useNotify } from "../context/NotificationContext";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../utils/supabase"; // ✅ Supabase Import
import API from '../utils/api';

const ManageStays = () => {
  const { notify } = useNotify();
  const { user } = useAuth(); // ✅ Get Logged in user
  const [myHotels, setMyHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [updating, setUpdating] = useState(false);

  useEffect(() => { 
    if (user) fetchMyStays(); 
  }, [user]);

  // ✅ FETCH LOGIC USING SUPABASE FOR REAL-TIME SYNC
  const fetchMyStays = async () => {
    try {
      setLoading(true);
      // Backend API call to get hotels owned by this user
      const res = await API.get("/hotel/my-hotels"); 
      const data = res.data.data || res.data || [];
      setMyHotels(data);
    } catch (err) {
      notify("Failed to link property vault", "error");
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (hotel) => {
    setSelectedHotel(hotel);
    setEditFormData({ ...hotel });
    setIsEditModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  // ✅ FULL UPDATE LOGIC
  const handleFullUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await API.patch(`/hotel/update/${selectedHotel._id}`, editFormData);
      notify("Property Synced Successfully!", "success");
      setIsEditModalOpen(false);
      fetchMyStays();
    } catch (err) {
      notify("Update failed!", "error");
    } finally {
      setUpdating(false);
    }
  };

  // ✅ QUICK INVENTORY UPDATE (Optimistic UI)
  const handleQuickRoomUpdate = async (id, currentRooms, change) => {
    const newCount = currentRooms + change;
    if (newCount < 0) return;

    // Optimistically update UI first for "Instant" feel
    setMyHotels(prev => prev.map(h => h._id === id ? { ...h, roomsAvailable: newCount } : h));

    try {
      const { error } = await supabase
        .from('hotels')
        .update({ roomsAvailable: newCount })
        .eq('_id', id); // Ensure your column name matches (_id or id)

      if (error) throw error;
      notify(`Inventory set to ${newCount}`, "success");
    } catch (err) {
      // Revert if failed
      setMyHotels(prev => prev.map(h => h._id === id ? { ...h, roomsAvailable: currentRooms } : h));
      notify("Sync failed. Check connection.", "error");
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] gap-4">
      <div className="relative">
        <Loader2 className="text-orange-600 animate-spin" size={60} />
        <div className="absolute inset-0 bg-orange-600/20 blur-xl animate-pulse"></div>
      </div>
      <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.6em] animate-pulse">Establishing Property Uplink...</p>
    </div>
  );

  return (
    <div className="relative min-h-screen bg-[#050505] pt-40 pb-20 px-6 overflow-hidden">
      {/* BACKGROUND ELEMENTS */}
      <div className="fixed inset-0 z-0">
        <img src="https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=2500" className="w-full h-full object-cover opacity-10 grayscale" alt="BG" />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/95 to-[#050505]"></div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 max-w-6xl mx-auto">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8 border-l-4 border-orange-600 pl-10">
            <div>
                <h1 className="text-6xl md:text-8xl font-black text-white uppercase italic tracking-tighter leading-[0.8]">
                    STAY <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-800">VAULT.</span>
                </h1>
                <p className="text-white/30 font-bold text-[10px] tracking-[0.4em] uppercase mt-6 flex items-center gap-3 italic">
                   <div className="w-2 h-2 rounded-full bg-orange-500 animate-ping"></div>
                   Verified Partner: {user?.email}
                </p>
            </div>
            <div className="bg-white/5 border border-white/10 px-10 py-6 rounded-[35px] backdrop-blur-3xl shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-orange-600/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1 relative z-10">Total Assets</p>
                <p className="text-5xl font-black italic text-white leading-none relative z-10">
                  {myHotels.length < 10 ? `0${myHotels.length}` : myHotels.length}
                </p>
            </div>
        </div>

        {/* PROPERTY GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {myHotels.length > 0 ? myHotels.map((hotel) => (
            <motion.div 
              key={hotel._id} 
              whileHover={{ y: -10, scale: 1.01 }}
              className="bg-white/[0.02] border border-white/5 p-10 rounded-[60px] backdrop-blur-3xl shadow-3xl group relative overflow-hidden transition-all duration-700 hover:border-orange-500/30"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-orange-600/10 blur-[100px] group-hover:bg-orange-600/20 transition-all"></div>

              {/* CARD HEADER */}
              <div className="flex justify-between items-start mb-12">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center text-orange-500 border border-white/10 group-hover:bg-orange-600 group-hover:text-white transition-all shadow-2xl duration-500">
                    <Hotel size={28}/>
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-white uppercase italic leading-none group-hover:text-orange-500 transition-colors">{hotel.hotelName}</h3>
                    <p className="text-white/20 text-[9px] font-black tracking-widest uppercase mt-3 italic flex items-center gap-2">
                        <MapPin size={10} className="text-orange-500"/> {hotel.location}
                    </p>
                  </div>
                </div>
                
                <div className={`px-5 py-2.5 rounded-2xl text-[8px] font-black uppercase tracking-widest border flex items-center gap-3 shadow-lg ${
                    hotel.status === 'approved' 
                    ? 'bg-green-500/5 text-green-500 border-green-500/20' 
                    : 'bg-orange-500/5 text-orange-500 border-orange-500/20'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${hotel.status === 'approved' ? 'bg-green-500 animate-pulse shadow-[0_0_12px_rgba(34,197,94,0.6)]' : 'bg-orange-500'}`}></div>
                  {hotel.status === 'approved' ? 'Active' : 'Pending'}
                </div>
              </div>

              {/* STATS AREA */}
              <div className="grid grid-cols-2 gap-6 mb-10">
                <div className="bg-white/[0.03] border border-white/5 p-8 rounded-[40px] flex flex-col items-center justify-center text-center group/item hover:bg-white/5 transition-colors">
                    <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-5">Current Inventory</p>
                    <div className="flex items-center gap-8">
                        <button onClick={() => handleQuickRoomUpdate(hotel._id, hotel.roomsAvailable, -1)} className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/40 hover:bg-red-600 hover:text-white transition-all active:scale-90 border border-white/10"><Minus size={16}/></button>
                        <span className="text-5xl font-black text-white italic drop-shadow-2xl">{hotel.roomsAvailable}</span>
                        <button onClick={() => handleQuickRoomUpdate(hotel._id, hotel.roomsAvailable, 1)} className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/40 hover:bg-green-600 hover:text-white transition-all active:scale-90 border border-white/10"><Plus size={16}/></button>
                    </div>
                </div>

                <div className="bg-white/[0.03] border border-white/5 p-8 rounded-[40px] flex flex-col items-center justify-center text-center hover:bg-white/5 transition-colors">
                    <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-5">Base Rate</p>
                    <div className="flex items-center gap-2">
                        <IndianRupee size={22} className="text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.4)]"/>
                        <span className="text-5xl font-black text-white italic leading-none tracking-tighter">{hotel.pricePerNight}</span>
                    </div>
                </div>
              </div>

              {/* ACTION BUTTON */}
              <button 
                onClick={() => openEditModal(hotel)}
                className="w-full bg-white/[0.02] border border-white/5 py-7 rounded-[35px] font-black text-[10px] uppercase tracking-[0.5em] transition-all flex items-center justify-center gap-4 hover:bg-orange-600 hover:text-white shadow-2xl group/btn overflow-hidden relative"
              >
                <div className="absolute inset-0 bg-white opacity-0 group-hover/btn:opacity-10 transition-opacity"></div>
                <Edit3 size={18} className="group-hover/btn:rotate-12 transition-transform"/> Modify Asset Specs
              </button>
            </motion.div>
          )) : (
            <div className="col-span-full py-40 text-center border-2 border-dashed border-white/5 rounded-[80px] bg-white/[0.01]">
                <Activity size={48} className="mx-auto text-white/5 mb-6 animate-pulse"/>
                <p className="text-white/10 text-xl font-black uppercase tracking-[1em] italic">No Properties Linked to Identity</p>
                <button className="mt-8 text-orange-500 text-[10px] font-black uppercase tracking-[0.3em] hover:text-white transition-colors">Initialize New Deployment</button>
            </div>
          )}
        </div>
      </motion.div>

      {/* --- EDIT MODAL --- */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsEditModalOpen(false)} className="absolute inset-0 bg-black/90 backdrop-blur-3xl" />
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, rotateX: 20 }}
              animate={{ scale: 1, opacity: 1, rotateX: 0 }}
              exit={{ scale: 0.9, opacity: 0, rotateX: 20 }}
              className="relative w-full max-w-4xl bg-[#080808] border border-white/10 rounded-[70px] shadow-[0_50px_100px_rgba(0,0,0,1)] overflow-hidden flex flex-col max-h-[85vh]"
            >
              {/* Modal Header */}
              <div className="p-12 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-orange-600/10 to-transparent">
                <div>
                  <h2 className="text-5xl font-black text-white italic tracking-tighter uppercase leading-none">RECONFIGURE <span className="text-orange-500">ASSET.</span></h2>
                  <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.5em] mt-4 flex items-center gap-3 italic">
                      <Layers size={14} className="text-orange-600 animate-bounce"/> Pushing Updates to Global Mesh
                  </p>
                </div>
                <button onClick={() => setIsEditModalOpen(false)} className="w-16 h-16 rounded-full bg-white/5 text-white/20 hover:bg-orange-600 hover:text-white transition-all flex items-center justify-center border border-white/10 shadow-xl"><X size={30}/></button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleFullUpdate} className="p-12 space-y-12 overflow-y-auto custom-scrollbar">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-6 italic">Price Metric (INR)</label>
                        <div className="relative group">
                             <div className="absolute left-6 top-1/2 -translate-y-1/2 text-orange-500 font-black text-xl">₹</div>
                             <input name="pricePerNight" value={editFormData.pricePerNight} onChange={handleInputChange} type="number" className="w-full bg-white/5 border border-white/10 p-8 pl-14 rounded-[35px] text-3xl font-black text-white italic outline-none focus:border-orange-500/50 transition-all" />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-6 italic">Inventory Cap</label>
                        <div className="relative">
                             <Layers className="absolute left-6 top-1/2 -translate-y-1/2 text-white/10" size={24}/>
                             <input name="roomsAvailable" value={editFormData.roomsAvailable} onChange={handleInputChange} type="number" className="w-full bg-white/5 border border-white/10 p-8 pl-16 rounded-[35px] text-3xl font-black text-white italic outline-none focus:border-orange-500/50 transition-all" />
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] ml-6 italic flex items-center gap-3"><MapPin size={16} className="text-orange-600"/> Operational Coordinates</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <input name="location" value={editFormData.location} onChange={handleInputChange} placeholder="Location" className="bg-white/5 border border-white/10 p-7 rounded-[30px] text-white font-black text-[11px] uppercase tracking-widest outline-none focus:border-orange-500/30" />
                        <input name="landmark" value={editFormData.landmark} onChange={handleInputChange} placeholder="Landmark" className="bg-white/5 border border-white/10 p-7 rounded-[30px] text-white font-black text-[11px] uppercase tracking-widest outline-none focus:border-orange-500/30" />
                    </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] ml-6 italic">Property Narrative</label>
                  <textarea name="description" value={editFormData.description} onChange={handleInputChange} rows={4} className="w-full bg-white/5 border border-white/10 p-10 rounded-[45px] text-white/60 font-medium text-sm outline-none focus:border-orange-500/20 transition-all resize-none leading-relaxed" />
                </div>

                <button disabled={updating} type="submit" className="w-full bg-orange-600 text-white font-black p-10 rounded-[40px] uppercase tracking-[0.6em] text-[13px] hover:bg-white hover:text-black transition-all flex items-center justify-center gap-6 disabled:opacity-50 shadow-[0_20px_50px_rgba(249,115,22,0.3)] active:scale-95 italic">
                  {updating ? <Loader2 className="animate-spin" size={24}/> : <ArrowUpRight size={24}/>}
                  {updating ? "SYNCHRONIZING..." : "OVERWRITE GLOBAL DATA"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ManageStays;