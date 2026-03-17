import React, { useEffect, useState } from 'react';
import API from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Hotel, IndianRupee, Plus, Minus, Loader2, 
  Clock, CheckCircle2, Edit3, X, Phone, MapPin, 
  AlignLeft, ShieldCheck, Activity, Layers, ArrowUpRight
} from 'lucide-react';
import { useNotify } from "../context/NotificationContext";

const ManageStays = () => {
  const { notify } = useNotify();
  const [myHotels, setMyHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [updating, setUpdating] = useState(false);

  useEffect(() => { fetchMyStays(); }, []);

  const fetchMyStays = async () => {
    try {
      const res = await API.get("/hotel/my-hotels"); 
      setMyHotels(res.data.data || res.data);
    } catch (err) {
      notify("Failed to load your stays", "error");
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (hotel) => {
    setSelectedHotel(hotel);
    setEditFormData({
      pricePerNight: hotel.pricePerNight || 0,
      roomsAvailable: hotel.roomsAvailable || 0,
      contactNumber: hotel.contactNumber || "",
      description: hotel.description || "",
      location: hotel.location || "",
      landmark: hotel.landmark || "",
      cancellationPolicy: hotel.cancellationPolicy || "",
      petPolicy: hotel.petPolicy || "",
      smokingPolicy: hotel.smokingPolicy || ""
    });
    setIsEditModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

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

  const handleQuickRoomUpdate = async (id, currentRooms, change) => {
    const newCount = currentRooms + change;
    if (newCount < 0) return;
    try {
      await API.patch(`/hotel/update/${id}`, { roomsAvailable: newCount });
      setMyHotels(myHotels.map(h => h._id === id ? { ...h, roomsAvailable: newCount } : h));
      notify("Inventory Updated", "success");
    } catch (err) {
      notify("Update failed!", "error");
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] gap-4">
      <Loader2 className="text-orange-600 animate-spin" size={50} />
      <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em]">Linking Property Vault...</p>
    </div>
  );

  return (
    <div className="relative min-h-screen bg-[#050505] pt-40 pb-20 px-6">
      <img src="https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=2500" className="fixed inset-0 w-full h-full object-cover opacity-20 grayscale z-0" alt="BG" />
      <div className="fixed inset-0 bg-gradient-to-b from-black via-black/90 to-[#050505] z-0"></div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 max-w-6xl mx-auto">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8 border-l-4 border-orange-600 pl-8">
            <div>
                <h1 className="text-6xl md:text-8xl font-black text-white uppercase italic tracking-tighter leading-[0.8]">
                    STAY <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-800">VAULT.</span>
                </h1>
                <p className="text-white/30 font-bold text-[10px] tracking-[0.4em] uppercase mt-6 flex items-center gap-2 italic">
                   <Activity size={14} className="text-orange-500 animate-pulse"/> Verified Partner Inventory Management
                </p>
            </div>
            <div className="bg-white/5 border border-white/10 px-8 py-5 rounded-[30px] backdrop-blur-xl">
                <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Total Assets</p>
                <p className="text-3xl font-black italic text-white leading-none">{myHotels.length < 10 ? `0${myHotels.length}` : myHotels.length}</p>
            </div>
        </div>

        {/* PROPERTY GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {myHotels.length > 0 ? myHotels.map((hotel) => (
            <motion.div 
              key={hotel._id} 
              whileHover={{ y: -8 }}
              className="bg-white/[0.03] border border-white/5 p-10 rounded-[55px] backdrop-blur-3xl shadow-3xl group relative overflow-hidden transition-all duration-500 hover:border-orange-500/20"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/5 blur-[80px] group-hover:bg-orange-600/10 transition-all"></div>

              {/* CARD HEADER */}
              <div className="flex justify-between items-start mb-12">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center text-orange-500 border border-white/10 group-hover:bg-orange-600 group-hover:text-white transition-all shadow-xl">
                    <Hotel size={28}/>
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-white uppercase italic leading-none">{hotel.hotelName}</h3>
                    <p className="text-white/20 text-[9px] font-black tracking-widest uppercase mt-2 italic flex items-center gap-2">
                        <MapPin size={10}/> {hotel.location}
                    </p>
                  </div>
                </div>
                
                <div className={`px-4 py-2 rounded-2xl text-[8px] font-black uppercase tracking-widest border flex items-center gap-3 ${
                    hotel.status === 'approved' 
                    ? 'bg-green-500/5 text-green-500 border-green-500/20' 
                    : 'bg-orange-500/5 text-orange-500 border-orange-500/20'
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${hotel.status === 'approved' ? 'bg-green-500 animate-pulse shadow-[0_0_8px_green]' : 'bg-orange-500'}`}></div>
                  {hotel.status === 'approved' ? 'Live on App' : 'Verification Pending'}
                </div>
              </div>

              {/* STATS AREA */}
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="bg-black/40 border border-white/5 p-6 rounded-[35px] flex flex-col items-center justify-center text-center">
                    <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-4">Inventory</p>
                    <div className="flex items-center gap-6">
                        <button onClick={() => handleQuickRoomUpdate(hotel._id, hotel.roomsAvailable, -1)} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white hover:bg-red-600 transition-all active:scale-90"><Minus size={14}/></button>
                        <span className="text-4xl font-black text-white italic">{hotel.roomsAvailable}</span>
                        <button onClick={() => handleQuickRoomUpdate(hotel._id, hotel.roomsAvailable, 1)} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white hover:bg-green-600 transition-all active:scale-90"><Plus size={14}/></button>
                    </div>
                </div>

                <div className="bg-black/40 border border-white/5 p-6 rounded-[35px] flex flex-col items-center justify-center text-center">
                    <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-4">Rate / Night</p>
                    <div className="flex items-center gap-2">
                        <IndianRupee size={18} className="text-orange-500"/>
                        <span className="text-4xl font-black text-white italic leading-none">{hotel.pricePerNight}</span>
                    </div>
                </div>
              </div>

              {/* ACTION BUTTON */}
              <button 
                onClick={() => openEditModal(hotel)}
                className="w-full bg-white/[0.03] border border-white/10 group-hover:bg-white group-hover:text-black py-6 rounded-[30px] font-black text-[10px] uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-4 active:scale-95 shadow-xl"
              >
                <Edit3 size={16}/> Modify Assets
              </button>
            </motion.div>
          )) : (
            <div className="col-span-full py-40 text-center border-2 border-dashed border-white/5 rounded-[80px]">
                <p className="text-white/10 text-xl font-black uppercase tracking-[1em] italic">No Active Assets Registered</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* --- EDIT MODAL (RE-DESIGNED) --- */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsEditModalOpen(false)} className="absolute inset-0 bg-black/95 backdrop-blur-2xl cursor-pointer" />
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              className="relative w-full max-w-4xl bg-[#0A0A0A] border border-white/10 rounded-[60px] shadow-3xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-10 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                <div>
                  <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase">EDIT <span className="text-orange-500">ASSET.</span></h2>
                  <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] mt-3 flex items-center gap-2 italic">
                      <Layers size={10} className="text-orange-600"/> Synchronizing with Cloud: {selectedHotel?.hotelName}
                  </p>
                </div>
                <button onClick={() => setIsEditModalOpen(false)} className="w-12 h-12 rounded-full bg-white/5 text-white/40 hover:bg-white hover:text-black transition-all flex items-center justify-center border border-white/10"><X size={24}/></button>
              </div>

              {/* Scrollable Form Area */}
              <form onSubmit={handleFullUpdate} className="p-10 space-y-10 overflow-y-auto no-scrollbar">
                
                {/* Tech Specs Group */}
                <div className="space-y-6">
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] italic ml-4 flex items-center gap-2"><Layers size={14} className="text-orange-600"/> Core Inventory Specs</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-white/5 border border-white/10 p-6 rounded-[35px] space-y-2">
                            <label className="text-[8px] font-black text-white/30 uppercase tracking-widest ml-4">Price / Night (INR)</label>
                            <input name="pricePerNight" value={editFormData.pricePerNight} onChange={handleInputChange} type="number" className="bg-transparent w-full text-2xl font-black text-white italic outline-none px-4" />
                        </div>
                        <div className="bg-white/5 border border-white/10 p-6 rounded-[35px] space-y-2">
                            <label className="text-[8px] font-black text-white/30 uppercase tracking-widest ml-4">Total Room Inventory</label>
                            <input name="roomsAvailable" value={editFormData.roomsAvailable} onChange={handleInputChange} type="number" className="bg-transparent w-full text-2xl font-black text-white italic outline-none px-4" />
                        </div>
                    </div>
                </div>

                {/* Location & Contact Group */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-4">Operational Hub (Location)</label>
                    <input name="location" value={editFormData.location} onChange={handleInputChange} type="text" className="w-full bg-white/5 border border-white/10 p-6 rounded-[30px] text-white font-bold text-xs outline-none focus:border-orange-500/50 transition-all uppercase tracking-widest" />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-4">Near Landmark</label>
                    <input name="landmark" value={editFormData.landmark} onChange={handleInputChange} type="text" className="w-full bg-white/5 border border-white/10 p-6 rounded-[30px] text-white font-bold text-xs outline-none focus:border-orange-500/50 transition-all uppercase tracking-widest" />
                  </div>
                </div>

                {/* Policies Chip System */}
                <div className="space-y-6">
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] italic ml-4 flex items-center gap-2"><ShieldCheck size={14} className="text-orange-600"/> Governance Policies</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {['cancellationPolicy', 'petPolicy', 'smokingPolicy'].map((field) => (
                            <div key={field} className="bg-white/5 border border-white/10 p-5 rounded-[25px]">
                                <label className="text-[8px] font-black text-white/30 uppercase tracking-widest block mb-2">{field.replace('Policy', ' Rule')}</label>
                                <input name={field} value={editFormData[field]} onChange={handleInputChange} type="text" className="bg-transparent w-full text-white font-bold text-[10px] outline-none" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Description Textarea */}
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-4 flex items-center gap-2"><AlignLeft size={14} className="text-orange-600"/> Public Narrative / Description</label>
                  <textarea name="description" value={editFormData.description} onChange={handleInputChange} rows={3} className="w-full bg-white/5 border border-white/10 p-8 rounded-[40px] text-white/70 font-medium text-xs outline-none focus:border-orange-500/30 transition-all resize-none leading-relaxed" />
                </div>

                {/* Submit Action */}
                <button disabled={updating} type="submit" className="w-full bg-orange-600 text-white font-black p-8 rounded-[35px] uppercase tracking-[0.5em] text-[12px] hover:bg-white hover:text-black transition-all flex items-center justify-center gap-4 disabled:opacity-50 shadow-2xl shadow-orange-600/20 active:scale-95">
                  {updating ? <Loader2 className="animate-spin" size={20}/> : <ArrowUpRight size={20}/>}
                  {updating ? "PUSHING TO SERVER..." : "COMMIT CHANGES LIVE"}
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