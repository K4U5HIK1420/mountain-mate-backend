import React, { useEffect, useState } from 'react';
import API from '../utils/api';
import { CheckCircle, XCircle, Clock, MapPin, Phone, ShieldAlert, Lock, LogOut, LayoutGrid, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminDashboard = () => {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending"); // "pending" ya "verified"
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");

  const ADMIN_PASSWORD = "Pani@Kedarnath2026"; 

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      fetchAllHotels();
    } else {
      alert("❌ ACCESS DENIED: Galat password hai bhai!");
      setPassword("");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPassword(""); 
    setHotels([]);
    window.location.href = "/admin-mate"; 
  };

  const fetchAllHotels = async () => {
    setLoading(true);
    try {
      const res = await API.get("/hotel/admin/all");
      const data = res.data.data || res.data;
      setHotels(data);
    } catch (err) {
      console.error("Admin fetch error", err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (hotelId, action) => {
    const confirmMessage = action === "rejected" 
      ? "🚨 WARNING: Ye property database aur Cloudinary dono se PERMANENTLY delete ho jayegi. Sure ho?" 
      : "Verify this property and make it live?";

    if (!window.confirm(confirmMessage)) return;

    try {
      await API.patch("/hotel/verify", { hotelId, action });
      alert(action === "approved" ? "Hotel Live Ho Gaya! 🏔️" : "Request Deleted Permanently.");
      fetchAllHotels(); 
    } catch (err) {
      alert("Action failed!");
    }
  };

  // Filter lists based on status
  const pendingHotels = hotels.filter(h => h.status === "pending");
  const verifiedHotels = hotels.filter(h => h.isVerified === true);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505] px-6 fixed inset-0 z-[2000]">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md w-full bg-white/5 border border-white/10 p-12 rounded-[60px] text-center shadow-[0_0_80px_rgba(0,0,0,1)] backdrop-blur-3xl">
          <div className="bg-orange-600 w-20 h-20 rounded-[30px] flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(234,88,12,0.4)]"><Lock className="text-white" size={32} /></div>
          <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-2 italic">ADMIN <span className="text-orange-500">GATE.</span></h2>
          <p className="text-white/30 text-[9px] font-black tracking-[0.5em] uppercase mb-12">Restricted Access / M-Mate 2026</p>
          <form onSubmit={handleLogin} className="space-y-6" autoComplete="off">
            <input type="password" name="m-mate-admin-pass" autoComplete="new-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus className="w-full bg-white/5 border border-white/10 p-7 rounded-[30px] text-center font-black text-white outline-none focus:border-orange-500 transition-all tracking-[0.8em] text-xl" />
            <button type="submit" className="w-full bg-white text-black font-black p-7 rounded-[30px] hover:bg-orange-600 hover:text-white transition-all uppercase tracking-[0.3em] text-[11px]">UNLOCK VAULT</button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070707] pt-44 px-12 pb-32 relative">
      <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8 max-w-7xl mx-auto">
        <div>
          <h1 className="text-8xl font-black text-white tracking-tighter uppercase leading-none italic">Vault <span className="text-orange-600">2.0</span></h1>
          <p className="text-white/30 font-bold text-[10px] tracking-[0.5em] uppercase mt-6 ml-1 flex items-center gap-3">
            <Zap size={14} className="text-orange-600"/> Synchronized Database Management
          </p>
        </div>
        <button onClick={handleLogout} className="group flex items-center gap-4 bg-white/5 border border-white/10 hover:border-red-500/50 px-8 py-5 rounded-full transition-all backdrop-blur-lg">
          <span className="text-white/40 group-hover:text-red-500 font-black text-[10px] tracking-[0.3em] uppercase">Terminate Session</span>
          <LogOut size={18} className="text-white/20 group-hover:text-red-500" />
        </button>
      </div>

      {/* --- TABS NAVIGATION --- */}
      <div className="max-w-7xl mx-auto mb-12 flex gap-4 bg-white/[0.02] p-2 rounded-[35px] w-fit border border-white/5 backdrop-blur-md">
        <button onClick={() => setActiveTab("pending")} className={`px-12 py-5 rounded-[28px] font-black text-[11px] tracking-widest transition-all ${activeTab === "pending" ? 'bg-orange-600 text-white shadow-[0_10px_30px_rgba(234,88,12,0.3)]' : 'text-white/30 hover:text-white'}`}>
          PENDING REQUESTS ({pendingHotels.length})
        </button>
        <button onClick={() => setActiveTab("verified")} className={`px-12 py-5 rounded-[28px] font-black text-[11px] tracking-widest transition-all ${activeTab === "verified" ? 'bg-green-600 text-white shadow-[0_10px_30px_rgba(22,163,74,0.3)]' : 'text-white/30 hover:text-white'}`}>
          VERIFIED LISTINGS ({verifiedHotels.length})
        </button>
      </div>

      <div className="grid gap-8 max-w-7xl mx-auto">
        {loading ? (
            <div className="text-white/10 font-black tracking-[1.5em] text-center py-40 animate-pulse uppercase">Fetching Encrypted Data...</div>
        ) : (activeTab === "pending" ? pendingHotels : verifiedHotels).length > 0 ? (
          (activeTab === "pending" ? pendingHotels : verifiedHotels).map((hotel) => (
            <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} key={hotel._id} className="bg-white/[0.03] border border-white/5 p-10 rounded-[60px] flex flex-col xl:flex-row justify-between items-center backdrop-blur-3xl group">
              <div className="flex flex-col md:flex-row gap-10 items-center">
                <img src={hotel.images[0] || 'https://via.placeholder.com/300'} className="w-48 h-48 object-cover rounded-[40px] border-2 border-white/5" alt="hotel" />
                <div className="space-y-4 text-center md:text-left">
                  <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter">{hotel.hotelName}</h3>
                  <div className="flex flex-wrap justify-center md:justify-start gap-6 text-white/40 font-black text-[10px] tracking-widest uppercase">
                    <span className="flex items-center gap-2"><MapPin size={14} className="text-orange-600"/> {hotel.location}</span>
                    <span className="flex items-center gap-2"><Phone size={14} className="text-orange-600"/> {hotel.contactNumber}</span>
                  </div>
                  <p className="text-3xl font-black text-white italic">₹{hotel.pricePerNight}<span className="text-[10px] font-normal not-italic text-white/20 ml-2 uppercase">/ Night</span></p>
                </div>
              </div>

              <div className="flex gap-4 mt-8 xl:mt-0">
                {activeTab === "pending" ? (
                  <>
                    <button onClick={() => handleVerify(hotel._id, "approved")} className="bg-white text-black px-10 py-5 rounded-[25px] font-black text-[10px] tracking-widest hover:bg-green-600 hover:text-white transition-all shadow-xl">APPROVE</button>
                    <button onClick={() => handleVerify(hotel._id, "rejected")} className="bg-white/5 border border-white/10 text-white/30 px-10 py-5 rounded-[25px] font-black text-[10px] tracking-widest hover:bg-red-600 hover:text-white transition-all">REJECT & DELETE</button>
                  </>
                ) : (
                  <div className="flex items-center gap-3 bg-green-500/10 text-green-500 px-8 py-4 rounded-full border border-green-500/20 font-black text-[10px] tracking-widest uppercase">
                    <CheckCircle size={16}/> LIVE ON EXPLORE
                  </div>
                )}
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-white/10 text-center py-40 font-black tracking-[1.5em] uppercase border-4 border-dashed border-white/[0.02] rounded-[80px]">
            {activeTab === "pending" ? "NO_PENDING_REQUESTS" : "NO_VERIFIED_DATA"}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;