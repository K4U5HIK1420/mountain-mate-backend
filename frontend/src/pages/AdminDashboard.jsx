import React, { useState, useEffect } from 'react';
import API from "../utils/api";
import {
  MapPin, Phone, Lock, LogOut, Zap, Car, Hotel, X, Info, Users, 
  IndianRupee, Navigation, User, ShieldCheck, Activity, Database, AlertCircle, Trash2, CheckCircle, LayoutDashboard
} from "lucide-react";
import socket from "../utils/socket";
import { useNotify } from "../context/NotificationContext";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
// ✅ Dashboard Import kiya
import Dashboard from "./Dashboard"; 

const AdminDashboard = () => {
  const { notify } = useNotify();
  const { loading: authLoading, user, signOut } = useAuth();
  const [hotels, setHotels] = useState([]);
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [viewMode, setViewMode] = useState("hotels");
  const [activeTab, setActiveTab] = useState("pending");
  const [notification, setNotification] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setAccessDenied(true);
      return;
    }
    fetchAllData();
  }, [authLoading, user]);

  useEffect(() => {
    socket.on("driverBookingNotification", (data) => {
      setNotification({
        vehicle: data.vehicle,
        seatsBooked: data.seatsBooked,
        seatsRemaining: data.seatsRemaining
      });
      setTimeout(() => setNotification(null), 5000);
    });
    return () => socket.off("driverBookingNotification");
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    setAccessDenied(false);
    try {
      const hotelRes = await API.get("/hotel/admin/all");
      setHotels(hotelRes.data.data || hotelRes.data || []);
      try {
        const rideRes = await API.get("/transport/admin/all");
        setRides(rideRes.data.data || rideRes.data || []);
      } catch (err) { setRides([]); }
    } catch (err) {
      if ([401, 403].includes(err?.response?.status)) {
        setAccessDenied(true);
      }
    }
    finally { setLoading(false); }
  };

  const handleLogout = async () => {
    await signOut();
    window.location.href = "/login";
  };

  const handleAction = async (id, action, type) => {
    if (action === "rejected" && confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      notify("🚨 Click REJECT again to permanently delete", "warning");
      return;
    }
    try {
      const endpoint = type === "hotels" ? "/hotel/verify" : "/transport/verify";
      const idKey = type === "hotels" ? "hotelId" : "rideId";
      await API.patch(endpoint, { [idKey]: id, action });
      notify(action === "approved" ? "✅ ENTRY VERIFIED" : "🚨 ENTRY PURGED", action === "approved" ? "success" : "error");
      setConfirmDeleteId(null);
      setSelectedItem(null);
      fetchAllData();
    } catch (err) { notify("Protocol Failed", "error"); }
  };

  const currentSet = viewMode === "hotels" ? hotels : rides;
  const filteredData = currentSet.filter(item => 
    activeTab === "pending" ? item.status !== "approved" : item.status === "approved"
  );

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505] pt-32 px-6">
        <div className="text-orange-500 font-black tracking-[0.5em] uppercase text-[10px] animate-pulse italic">Accessing Central Core...</div>
      </div>
    );
  }

  if (!user || accessDenied) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505] px-6 pt-32 pb-24">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md w-full bg-white/[0.02] border border-white/10 p-12 rounded-[50px] text-center backdrop-blur-3xl shadow-3xl">
          <div className="bg-orange-600 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-10 shadow-2xl">
            <Lock className="text-white" size={32} />
          </div>
          <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">SENTINEL <span className="text-orange-500">VAULT.</span></h2>
          <p className="text-white/20 text-[9px] font-black uppercase tracking-[0.5em] mt-4 mb-10 italic">High-Level Clearance Required</p>
          <a href="/login" className="block w-full bg-white text-black font-black p-6 rounded-2xl hover:bg-orange-600 hover:text-white transition-all uppercase text-xs tracking-widest shadow-xl">Re-establish Uplink</a>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] pt-32 px-4 md:px-12 pb-32 text-white">
      
      {/* --- SECTION 1: GLOBAL DASHBOARD (OVERVIEW) --- */}
      <div className="max-w-7xl mx-auto mb-24">
        <div className="flex items-center gap-4 mb-10 border-l-4 border-orange-600 pl-6">
          <h2 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter text-white">
            System <span className="text-orange-600">Overview.</span>
          </h2>
          <LayoutDashboard className="text-white/10" size={28} />
        </div>
        
        {/* Isme Dashboard render ho raha hai */}
        <div className="bg-white/[0.02] border border-white/5 rounded-[50px] p-2 md:p-8 backdrop-blur-3xl shadow-inner">
           <Dashboard isCompact={true} /> 
        </div>
      </div>

      {/* --- SECTION 2: MANAGEMENT HUB --- */}
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-8">
          <div>
            <h2 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase leading-none text-white">
              Data <span className="text-orange-600/50">Streams.</span>
            </h2>
            <p className="text-white/30 text-[9px] flex items-center gap-3 mt-4 uppercase tracking-[0.4em] font-bold italic">
              <Activity size={14} className="text-orange-500 animate-pulse" /> Managing {filteredData.length} Live Assets
            </p>
          </div>
          
          <button onClick={handleLogout} className="flex items-center gap-3 bg-white/5 border border-white/10 px-8 py-4 rounded-full hover:bg-red-600/20 hover:text-red-500 hover:border-red-600/30 transition-all group">
            <span className="text-[10px] font-black tracking-widest">PURGE SESSION</span>
            <LogOut size={18} className="text-white/20 group-hover:text-red-500" />
          </button>
        </div>

        {/* Command Bar */}
        <div className="mb-12 flex flex-wrap gap-4 justify-between items-center bg-white/[0.02] p-3 rounded-[35px] border border-white/5 backdrop-blur-3xl shadow-2xl">
          <div className="flex gap-2 p-1.5 bg-black/40 rounded-2xl border border-white/5 w-full md:w-auto">
            <button onClick={() => setViewMode("hotels")} className={`flex-1 md:flex-none flex items-center justify-center gap-3 px-8 py-3 rounded-xl font-black text-[10px] tracking-widest transition-all ${viewMode === "hotels" ? "bg-white text-black shadow-lg" : "text-white/30 hover:text-white"}`}><Hotel size={14} /> STAYS</button>
            <button onClick={() => setViewMode("rides")} className={`flex-1 md:flex-none flex items-center justify-center gap-3 px-8 py-3 rounded-xl font-black text-[10px] tracking-widest transition-all ${viewMode === "rides" ? "bg-white text-black shadow-lg" : "text-white/30 hover:text-white"}`}><Car size={14} /> RIDES</button>
          </div>
          
          <div className="flex gap-2 w-full md:w-auto">
            <button onClick={() => setActiveTab("pending")} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-black text-[9px] tracking-widest transition-all ${activeTab === "pending" ? "bg-orange-600 text-white" : "bg-white/5 text-white/20 hover:text-white"}`}>
                PENDING
            </button>
            <button onClick={() => setActiveTab("verified")} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-black text-[9px] tracking-widest transition-all ${activeTab === "verified" ? "bg-green-600 text-white" : "bg-white/5 text-white/20 hover:text-white"}`}>
                ARCHIVE
            </button>
          </div>
        </div>

        {/* Assets List */}
        <div className="grid gap-4">
          {loading ? (
            <div className="text-white/5 text-center py-40 animate-pulse font-black tracking-[1.5em] text-2xl uppercase">Synchronizing Stream...</div>
          ) : filteredData.length > 0 ? (
            filteredData.map((item) => (
              <motion.div layout key={item._id} onClick={() => setSelectedItem(item)} className="group relative bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 p-6 md:p-8 rounded-[40px] flex flex-col md:flex-row justify-between items-center cursor-pointer transition-all duration-500 hover:border-orange-500/20">
                <div className="flex flex-col md:flex-row gap-8 items-center w-full md:w-auto">
                  <div className="relative overflow-hidden w-24 h-24 rounded-2xl bg-zinc-900 border border-white/10 shrink-0">
                    <img src={item.images?.[0]} className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all duration-700" alt="" />
                  </div>
                  <div className="text-center md:text-left space-y-2">
                    <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">{viewMode === "hotels" ? item.hotelName : item.vehicleType}</h3>
                    <div className="text-white/20 text-[8px] font-bold flex flex-wrap justify-center md:justify-start gap-4 uppercase tracking-widest">
                      <span className="flex items-center gap-2"><MapPin size={10} className="text-orange-500" /> {item.location || item.routeFrom}</span>
                      <span className="flex items-center gap-2"><Phone size={10} className="text-orange-500" /> {item.contactNumber}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-8 mt-6 md:mt-0">
                   <div className="text-right">
                      <p className="text-[7px] font-black text-white/20 uppercase tracking-widest italic mb-1">Asset Value</p>
                      <p className="text-white text-2xl font-black italic tracking-tighter leading-none">₹{item.pricePerNight || item.pricePerSeat}</p>
                   </div>
                   <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-white/10 group-hover:bg-orange-600 group-hover:text-white transition-all active:scale-90 shadow-xl"><ArrowRight size={20} /></div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-white/5 text-center py-40 font-black tracking-[1em] text-xl italic uppercase">Vault Idle: No Submissions found</div>
          )}
        </div>
      </div>

      {/* --- SENTINEL MODAL --- */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedItem(null)} className="absolute inset-0 bg-black/98 backdrop-blur-2xl" />
            <motion.div initial={{ scale: 0.95, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }} className="relative w-full max-w-6xl bg-[#0a0a0a] border border-white/10 rounded-[50px] overflow-hidden shadow-3xl flex flex-col md:flex-row h-full max-h-[85vh]">
              
              <button onClick={() => setSelectedItem(null)} className="absolute top-8 right-8 w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-white/40 hover:text-white z-50 transition-all border border-white/10"><X size={24}/></button>

              <div className="w-full md:w-1/2 relative bg-zinc-900 border-r border-white/5 overflow-hidden flex items-center justify-center">
                <img src={selectedItem.images?.[0]} className="absolute inset-0 w-full h-full object-cover opacity-20 blur-3xl" alt=""/>
                <img src={selectedItem.images?.[0]} className="relative w-full h-full object-contain z-10 p-12" alt="" />
              </div>

              <div className="flex-1 p-10 md:p-14 overflow-y-auto no-scrollbar space-y-10 bg-gradient-to-br from-[#0a0a0a] to-[#111]">
                <div className="space-y-4">
                  <span className="text-orange-500 text-[10px] font-black tracking-[0.4em] uppercase">Security Clearance Required</span>
                  <h2 className="text-5xl font-black italic tracking-tighter uppercase leading-none">{viewMode === "hotels" ? selectedItem.hotelName : selectedItem.vehicleType}</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="bg-white/5 p-6 rounded-[30px] border border-white/5 space-y-4 shadow-inner">
                      <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] flex items-center gap-2 italic"><Database size={16} className="text-orange-600"/> Metadata</p>
                      <div className="space-y-3 text-[10px] uppercase font-black text-white/70">
                         <p className="flex justify-between border-b border-white/5 pb-2"><span>Partner:</span> <span className="text-orange-500 italic">{selectedItem.driverName || selectedItem.ownerName || "Authorized Pilot"}</span></p>
                         <p className="flex justify-between border-b border-white/5 pb-2"><span>Line:</span> <span className="text-white italic">{selectedItem.contactNumber}</span></p>
                         <p className="flex justify-between"><span>Region:</span> <span className="text-white italic">{selectedItem.location || selectedItem.routeFrom}</span></p>
                      </div>
                   </div>
                   <div className="bg-white/[0.03] p-8 rounded-[30px] border border-white/5 text-center flex flex-col justify-center">
                      <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Fare Logic</p>
                      <p className="text-4xl font-black italic text-orange-500 tracking-tighter">₹{selectedItem.pricePerNight || selectedItem.pricePerSeat}</p>
                   </div>
                </div>

                <div className="space-y-4">
                   <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] italic border-l-2 border-orange-600 pl-4">Partner Narrative</p>
                   <p className="text-white/50 text-xs font-medium leading-relaxed italic uppercase">{selectedItem.description || "No descriptive narrative provided by asset partner."}</p>
                </div>

                {activeTab === "pending" ? (
                  <div className="flex flex-col sm:flex-row gap-4 pt-6">
                    <button onClick={() => handleAction(selectedItem._id, "approved", viewMode)} className="flex-1 bg-white text-black font-black py-6 rounded-[25px] uppercase text-[10px] tracking-[0.4em] hover:bg-green-600 hover:text-white transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3 italic">
                        <ShieldCheck size={18}/> AUTHORIZE
                    </button>
                    <button onClick={() => handleAction(selectedItem._id, "rejected", viewMode)} className="flex-1 bg-red-600/10 text-red-600 border border-red-600/20 font-black py-6 rounded-[25px] uppercase text-[10px] tracking-[0.4em] hover:bg-red-600 hover:text-white transition-all active:scale-95 flex items-center justify-center gap-3 italic">
                        <Trash2 size={18}/> {confirmDeleteId === selectedItem._id ? "CONFIRM" : "REJECT"}
                    </button>
                  </div>
                ) : (
                  <div className="bg-green-600/10 p-6 rounded-[25px] border border-green-600/20 flex items-center justify-center gap-4 text-green-500">
                      <CheckCircle size={20}/>
                      <p className="text-[9px] font-black uppercase tracking-[0.5em]">Live Asset Active</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="fixed bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-orange-600/20 to-transparent"></div>
    </div>
  );
};

const ArrowRight = ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
);

export default AdminDashboard;
