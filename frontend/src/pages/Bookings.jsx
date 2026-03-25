import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, MapPin, User, Clock, CheckCircle, XCircle, Briefcase, PlaneTakeoff, Loader2, Phone, Mail, Car, IndianRupee, Users } from 'lucide-react';
import API from '../utils/api';
import { useNotify } from "../context/NotificationContext";

const Bookings = () => {
  const [activeTab, setActiveTab] = useState('user'); 
  const [userBookings, setUserBookings] = useState([]);
  const [partnerBookings, setPartnerBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const { notify } = useNotify();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [userRes, partnerRes] = await Promise.all([
        API.get("/user/bookings"),
        API.get("/user/partner/incoming").catch(() => ({ data: { data: [] } }))
      ]);
      setUserBookings(userRes.data?.data || []);
      setPartnerBookings(partnerRes.data?.data || []);
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (bookingId, newStatus) => {
    try {
      const res = await API.post("/user/bookings/update-status", { bookingId, status: newStatus });
      if (res.data.success) {
        notify({ type: 'success', message: `Expedition ${newStatus} Successfully!` });
        fetchData(); 
      }
    } catch (err) {
      notify({ type: 'error', message: 'Uplink Failed' });
    }
  };

  if (loading) return (
    <div className="h-[70vh] flex flex-col items-center justify-center gap-6">
      <div className="relative">
        <Loader2 className="animate-spin text-orange-500" size={54} />
        <div className="absolute inset-0 bg-orange-500 blur-3xl opacity-20 animate-pulse" />
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.8em] text-white/30 italic">Synchronizing Logs...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-20 gap-10">
        <div className="relative">
          <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} className="h-px bg-gradient-to-r from-orange-500 to-transparent mb-4 w-32" />
          <h1 className="text-6xl md:text-8xl font-black uppercase italic tracking-tighter text-white leading-[0.8]">
            Reservations<span className="text-orange-500">.</span>
          </h1>
          <p className="text-[9px] font-black uppercase tracking-[0.5em] text-white/20 mt-4 ml-2">Logistics & Expedition Control</p>
        </div>

        {/* TOGGLE TABS */}
        <div className="flex bg-white/5 p-2 rounded-[30px] border border-white/10 backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <button 
            onClick={() => setActiveTab('user')}
            className={`px-10 py-4 rounded-[24px] flex items-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all duration-500 ${activeTab === 'user' ? 'bg-orange-600 text-white shadow-xl shadow-orange-600/20' : 'text-white/30 hover:text-white hover:bg-white/5'}`}
          >
            <PlaneTakeoff size={14}/> My Trips
          </button>
          <button 
            onClick={() => setActiveTab('partner')}
            className={`relative px-10 py-4 rounded-[24px] flex items-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all duration-500 ${activeTab === 'partner' ? 'bg-orange-600 text-white shadow-xl shadow-orange-600/20' : 'text-white/30 hover:text-white hover:bg-white/5'}`}
          >
            <Briefcase size={14}/> Partner Requests
            {partnerBookings.filter(b => b.status === 'Pending').length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 rounded-full text-[9px] flex items-center justify-center font-black animate-bounce border-2 border-[#050505]">
                {partnerBookings.filter(b => b.status === 'Pending').length}
              </span>
            )}
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          className="grid gap-8"
        >
          {activeTab === 'user' ? (
            <BookingGrid data={userBookings} mode="user" />
          ) : (
            <BookingGrid data={partnerBookings} mode="partner" onUpdate={handleStatusUpdate} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

const BookingGrid = ({ data, mode, onUpdate }) => {
  if (data.length === 0) return (
    <div className="py-44 text-center border border-dashed border-white/10 rounded-[60px] bg-white/[0.01] backdrop-blur-md relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-orange-500/[0.02] to-transparent pointer-events-none" />
      <motion.div animate={{ opacity: [0.2, 0.5, 0.2] }} transition={{ duration: 3, repeat: Infinity }}>
        <Briefcase size={54} className="mx-auto mb-6 text-white/10" />
      </motion.div>
      <p className="text-[11px] font-black uppercase tracking-[0.8em] text-white/20 italic">No Data Found In Archives</p>
    </div>
  );

  return data.map((b, i) => (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.1 }}
      key={b._id} 
      className={`group relative bg-[#090909] border border-white/5 p-8 md:p-12 rounded-[50px] transition-all duration-500 hover:bg-[#0c0c0c] ${mode === 'partner' && b.status === 'Pending' ? 'hover:border-orange-500/50 shadow-[0_0_40px_rgba(249,115,22,0.05)]' : 'hover:border-white/20'}`}
    >
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-12 relative z-10">
        
        {/* INFO BLOCK */}
        <div className="flex flex-col md:flex-row gap-10 items-start md:items-center w-full">
          <div className="relative shrink-0">
            <div className="w-28 h-28 rounded-[40px] bg-gradient-to-br from-white/[0.08] to-transparent border border-white/10 flex items-center justify-center text-orange-500 shadow-3xl group-hover:rotate-6 transition-all duration-700">
              {b.hotelId ? <MapPin size={36}/> : <Car size={36}/>}
            </div>
            {b.status === 'Pending' && (
              <div className="absolute -top-3 -right-3 w-7 h-7 bg-orange-600 rounded-full flex items-center justify-center border-4 border-[#090909] shadow-lg">
                <Clock size={12} className="text-white animate-spin-slow" />
              </div>
            )}
          </div>

          <div className="flex flex-col flex-1">
            <div className="flex items-center gap-3 mb-3">
               <span className="text-[9px] font-black text-orange-500 uppercase tracking-[0.4em] italic">
                 {b.hotelId ? 'Stay Expedition' : 'Fleet Deployment'}
               </span>
               <div className="h-px w-8 bg-white/10" />
               <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">REF: {b._id.slice(-6).toUpperCase()}</span>
            </div>

            <h3 className="text-3xl md:text-5xl font-black italic uppercase text-white tracking-tighter mb-6 leading-tight">
              {b.hotelId?.name || b.transportId?.vehicleModel || "Archived Record"}
            </h3>
            
            <div className="flex flex-wrap gap-8 text-[11px] font-black text-white/40 uppercase italic tracking-[0.15em]">
              <div className="flex items-center gap-2.5 bg-white/5 px-4 py-2 rounded-xl border border-white/5"><Calendar size={14} className="text-orange-500/50"/> {new Date(b.createdAt).toLocaleDateString()}</div>
              
              {/* PRICE & CAPACITY */}
              <div className="flex items-center gap-2.5 bg-orange-500/5 px-4 py-2 rounded-xl border border-orange-500/10 text-orange-500/80">
                <IndianRupee size={14}/> {b.totalPrice || '---'}
              </div>

              {mode === 'partner' && (
                <div className="flex items-center gap-6 border-l border-white/10 pl-8 ml-2">
                  <span className="flex items-center gap-2.5 text-blue-400"><User size={14}/> {b.user?.fullName}</span>
                  <a href={`tel:${b.user?.phone}`} className="flex items-center gap-2.5 hover:text-white transition-all"><Phone size={14} className="text-green-500"/> {b.user?.phone}</a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ACTIONS & STATUS */}
        <div className="flex flex-col sm:flex-row items-center gap-6 w-full xl:w-auto">
          <div className={`w-full sm:w-auto px-10 py-5 rounded-[25px] text-[10px] font-black uppercase tracking-[0.4em] border text-center transition-all duration-700 ${
            b.status === 'Confirmed' ? 'bg-green-500/10 border-green-500/20 text-green-400 shadow-[0_10px_40px_rgba(34,197,94,0.1)]' : 
            b.status === 'Cancelled' ? 'bg-red-500/10 border-red-500/20 text-red-400 shadow-[0_10px_40px_rgba(239,68,68,0.1)]' : 
            'bg-orange-500/10 border-orange-500/30 text-orange-500 shadow-[0_10px_40px_rgba(249,115,22,0.1)]'
          }`}>
            {b.status || 'Verifying...'}
          </div>

          {mode === 'partner' && b.status === 'Pending' && (
            <div className="flex gap-4 w-full sm:w-auto">
              <button 
                onClick={() => onUpdate(b._id, 'Confirmed')} 
                className="flex-1 sm:flex-none p-5 bg-green-600 rounded-[22px] hover:bg-green-500 hover:scale-110 active:scale-95 transition-all shadow-2xl shadow-green-600/30 group/btn"
              >
                <CheckCircle size={26} className="text-white"/>
              </button>
              <button 
                onClick={() => onUpdate(b._id, 'Cancelled')} 
                className="flex-1 sm:flex-none p-5 bg-red-600/10 border border-red-600/30 text-red-500 rounded-[22px] hover:bg-red-600 hover:text-white hover:scale-110 active:scale-95 transition-all"
              >
                <XCircle size={26}/>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Cinematic Overlays */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-orange-500/[0.01] to-transparent pointer-events-none" />
      <div className="absolute -left-10 bottom-0 w-40 h-1 bg-gradient-to-r from-orange-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.div>
  ));
};

export default Bookings;