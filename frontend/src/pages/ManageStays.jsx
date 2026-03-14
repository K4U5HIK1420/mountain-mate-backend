import React, { useEffect, useState } from 'react';
import API from '../utils/api'; // Ensure this file exists in your utils folder
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Hotel, IndianRupee, Power, Plus, Minus, Loader2, 
  Clock, CheckCircle2, Edit3, X, Phone, MapPin, 
  AlignLeft, ShieldCheck, Zap, AlertCircle, Info
} from 'lucide-react';
import { useNotify } from "../context/NotificationContext";

const ManageStays = () => {
  const { notify } = useNotify();
  const [myHotels, setMyHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchMyStays();
  }, []);

  const fetchMyStays = async () => {
    try {
      const res = await API.get("/hotel/my-hotels"); 
      setMyHotels(res.data.data || res.data);
    } catch (err) {
      console.error("Fetch error", err);
      notify("Failed to load your stays", "error");
    } finally {
      setLoading(false);
    }
  };

  // Open Edit Modal with all details
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

  // Handle Input Change in Modal
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  // Submit Full Update
  const handleFullUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      // Backend controller needs to handle these keys
      await API.patch(`/hotel/update/${selectedHotel._id}`, editFormData);
      notify("Property Synced Successfully! 🏔️", "success");
      setIsEditModalOpen(false);
      fetchMyStays(); // Refresh list
    } catch (err) {
      notify("Update failed! Check backend connectivity.", "error");
    } finally {
      setUpdating(false);
    }
  };

  // Quick Inline Update (For Rooms only)
  const handleQuickRoomUpdate = async (id, currentRooms, change) => {
    const newCount = currentRooms + change;
    if (newCount < 0) return;

    try {
      await API.patch(`/hotel/update/${id}`, { roomsAvailable: newCount });
      setMyHotels(myHotels.map(h => h._id === id ? { ...h, roomsAvailable: newCount } : h));
      notify("Inventory Updated!", "success");
    } catch (err) {
      notify("Quick update failed!", "error");
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
      <img src="https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=2500" className="fixed inset-0 w-full h-full object-cover z-[-1]" alt="Background" />
      <div className="fixed inset-0 bg-black/75 backdrop-blur-[6px] z-[-1]"></div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-6xl mx-auto">
        <div className="mb-16">
          <h1 className="text-6xl md:text-8xl font-black text-white uppercase italic tracking-tighter leading-none">
            Manage <span className="text-orange-500">Your Stays.</span>
          </h1>
          <p className="text-white/30 text-[10px] font-black tracking-[0.4em] uppercase mt-6 ml-2 italic flex items-center gap-3">
            <CheckCircle2 size={12} className="text-orange-500" /> Exclusive access: Partner Vault 2026
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {myHotels.length > 0 ? myHotels.map((hotel) => (
            <div key={hotel._id} className="bg-white/[0.03] border border-white/10 p-10 rounded-[60px] backdrop-blur-3xl shadow-2xl group transition-all hover:border-white/20">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
                <div className="flex items-center gap-5">
                  <div className="bg-orange-600/20 p-5 rounded-[25px] group-hover:bg-orange-600 group-hover:text-white transition-all text-orange-600">
                    <Hotel size={28}/>
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-white uppercase italic tracking-tight">{hotel.hotelName}</h3>
                    <p className="text-white/20 text-[10px] uppercase font-bold tracking-widest mt-1">{hotel.location}</p>
                  </div>
                </div>

                <div className={`px-6 py-3 rounded-full text-[9px] font-black uppercase tracking-widest border flex items-center gap-2 ${hotel.status === 'approved' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-orange-500/10 text-orange-500 border-orange-500/20'}`}>
                  {hotel.status === 'approved' ? <CheckCircle2 size={12}/> : <Clock size={12} className="animate-pulse"/>}
                  {hotel.status === 'approved' ? 'Live' : 'Pending Approval'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-10">
                <div className="bg-white/5 p-8 rounded-[40px] text-center border border-white/5 group-hover:bg-white/[0.07] transition-all">
                  <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-6">Available Rooms</p>
                  <div className="flex items-center justify-between text-white px-4">
                    <button onClick={() => handleQuickRoomUpdate(hotel._id, hotel.roomsAvailable, -1)} className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-red-500 hover:border-red-500 transition-all active:scale-90"><Minus size={16}/></button>
                    <span className="text-5xl font-black italic">{hotel.roomsAvailable}</span>
                    <button onClick={() => handleQuickRoomUpdate(hotel._id, hotel.roomsAvailable, 1)} className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-green-500 hover:border-green-500 transition-all active:scale-90"><Plus size={16}/></button>
                  </div>
                </div>

                <div className="bg-white/5 p-8 rounded-[40px] border border-white/5 flex flex-col justify-center group-hover:bg-white/[0.07] transition-all">
                  <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-4">Base Rate (Tonight)</p>
                  <div className="flex items-center gap-3">
                    <IndianRupee size={24} className="text-orange-600"/>
                    <span className="text-5xl font-black text-white italic">{hotel.pricePerNight}</span>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => openEditModal(hotel)}
                className="w-full bg-white text-black hover:bg-orange-600 hover:text-white border border-white/10 py-7 rounded-[35px] font-black text-[11px] uppercase tracking-[0.5em] transition-all active:scale-95 flex items-center justify-center gap-4"
              >
                <Edit3 size={18}/> Edit Property Details
              </button>
            </div>
          )) : (
            <div className="col-span-1 md:col-span-2 py-40 text-center border-4 border-dashed border-white/5 rounded-[80px]">
                <p className="text-white/10 text-4xl font-black uppercase tracking-[0.8em] italic">No Assets Registered</p>
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
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-4xl bg-[#0A0A0A] border border-white/10 rounded-[60px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-10 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                <div>
                  <h2 className="text-4xl font-black text-white tracking-tight uppercase italic">EDIT <span className="text-orange-500">VAULT.</span></h2>
                  <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] mt-2">Updating: {selectedHotel?.hotelName}</p>
                </div>
                <button onClick={() => setIsEditModalOpen(false)} className="bg-white/5 p-4 rounded-full text-white/40 hover:text-white hover:bg-red-500 transition-all"><X size={24}/></button>
              </div>

              {/* Modal Body (Scrollable Form) */}
              <form onSubmit={handleFullUpdate} className="p-10 space-y-10 overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  {/* Price Section */}
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest flex items-center gap-3 ml-2"><IndianRupee size={14}/> Base Price / Night</label>
                    <input name="pricePerNight" value={editFormData.pricePerNight} onChange={handleInputChange} type="number" className="w-full bg-white/5 border border-white/10 p-6 rounded-[30px] text-white font-bold outline-none focus:border-orange-500 transition-all" />
                  </div>

                  {/* Rooms Section */}
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest flex items-center gap-3 ml-2"><Hotel size={14}/> Total Rooms Available</label>
                    <input name="roomsAvailable" value={editFormData.roomsAvailable} onChange={handleInputChange} type="number" className="w-full bg-white/5 border border-white/10 p-6 rounded-[30px] text-white font-bold outline-none focus:border-orange-500 transition-all" />
                  </div>

                  {/* Contact Section */}
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest flex items-center gap-3 ml-2"><Phone size={14}/> Public Contact</label>
                    <input name="contactNumber" value={editFormData.contactNumber} onChange={handleInputChange} type="text" className="w-full bg-white/5 border border-white/10 p-6 rounded-[30px] text-white font-bold outline-none focus:border-orange-500 transition-all" />
                  </div>

                  {/* Landmark Section */}
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest flex items-center gap-3 ml-2"><MapPin size={14}/> Landmark / Precise Location</label>
                    <input name="landmark" value={editFormData.landmark} onChange={handleInputChange} type="text" className="w-full bg-white/5 border border-white/10 p-6 rounded-[30px] text-white font-bold outline-none focus:border-orange-500 transition-all" />
                  </div>
                </div>

                {/* Policies Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div className="space-y-4">
                    <label className="text-[9px] font-black text-white/20 uppercase tracking-widest ml-2">Cancellation Policy</label>
                    <input name="cancellationPolicy" value={editFormData.cancellationPolicy} onChange={handleInputChange} type="text" placeholder="e.g. Free 24hrs" className="w-full bg-white/5 border border-white/10 p-5 rounded-[25px] text-white text-xs font-bold outline-none" />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[9px] font-black text-white/20 uppercase tracking-widest ml-2">Pet Policy</label>
                    <input name="petPolicy" value={editFormData.petPolicy} onChange={handleInputChange} type="text" placeholder="e.g. Not allowed" className="w-full bg-white/5 border border-white/10 p-5 rounded-[25px] text-white text-xs font-bold outline-none" />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[9px] font-black text-white/20 uppercase tracking-widest ml-2">Smoking Policy</label>
                    <input name="smokingPolicy" value={editFormData.smokingPolicy} onChange={handleInputChange} type="text" placeholder="e.g. Outside only" className="w-full bg-white/5 border border-white/10 p-5 rounded-[25px] text-white text-xs font-bold outline-none" />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-widest flex items-center gap-3 ml-2"><AlignLeft size={14}/> Property Description</label>
                  <textarea name="description" value={editFormData.description} onChange={handleInputChange} rows={4} className="w-full bg-white/5 border border-white/10 p-8 rounded-[40px] text-white font-medium outline-none focus:border-orange-500 transition-all resize-none" />
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
    </div>
  );
};

export default ManageStays;