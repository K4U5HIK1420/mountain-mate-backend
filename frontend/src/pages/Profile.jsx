import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Mail, MapPin, Heart, Package, 
  Settings, LogOut, Camera, ChevronRight, Clock, 
  Gift, Copy, Map as MapIcon, ShieldCheck, TrendingUp, Sparkles, Briefcase, ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { useNotify } from '../context/NotificationContext';

const Profile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { notify } = useNotify();
  const [activeTab, setActiveTab] = useState('bookings');
  const [bookings, setBookings] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [savedTrips, setSavedTrips] = useState([]);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bookingRes, tripsRes] = await Promise.all([
          API.get('/user/bookings').catch(() => ({ data: { data: [] } })),
          API.get('/trips/my-trips').catch(() => ({ data: [] }))
        ]);
        setBookings(bookingRes.data.data || []);
        setSavedTrips(tripsRes.data || []);
        const storedWishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
        setWishlist(storedWishlist);
      } catch (error) { console.error("Profile Sync Failed"); }
    };
    if (user) fetchData();
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  if (!user) return (
    <div className="h-screen flex items-center justify-center bg-black">
      <p className="text-orange-500 font-black animate-pulse uppercase tracking-[0.5em]">Identity Required...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-32 pb-20 px-4 md:px-8 font-sans relative overflow-hidden">
      
      {/* --- CINEMATIC BACKGROUND --- */}
      <div className="fixed top-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-600/10 blur-[150px] rounded-full pointer-events-none z-0" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-orange-600/10 blur-[150px] rounded-full pointer-events-none z-0" />

      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* --- THE CORE IDENTITY --- */}
        <div className="flex flex-col items-center mb-16">
          <div 
            className="relative group cursor-pointer"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-6 bg-gradient-to-tr from-blue-500 via-purple-500 to-orange-500 rounded-full opacity-10 blur-2xl group-hover:opacity-30 transition-opacity"
            />
            
            <div className="relative w-40 h-40 md:w-48 md:h-48 rounded-full p-[2px] bg-gradient-to-b from-white/20 to-transparent backdrop-blur-3xl overflow-hidden shadow-2xl border border-white/5">
              <div className="w-full h-full rounded-full bg-[#0a0a0a] flex items-center justify-center overflow-hidden">
                <div className="text-6xl font-black italic text-transparent bg-clip-text bg-gradient-to-br from-white to-white/20">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
              </div>
            </div>

            <div className="absolute -bottom-2 right-4 bg-orange-600 p-3 rounded-2xl shadow-2xl border-4 border-[#050505]">
               <ShieldCheck size={20} className="text-white" />
            </div>
          </div>

          <div className="text-center mt-8 space-y-2">
             <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-white">
                {user.user_metadata?.full_name || user.email?.split('@')[0]}
             </h1>
             <p className="text-orange-500 text-[9px] font-black tracking-[0.5em] uppercase italic flex items-center justify-center gap-2">
               <Sparkles size={12}/> Verified Expeditionary Elite
             </p>
          </div>
        </div>

        {/* 🆕 THE CENTRAL COMMAND (MY BOOKINGS CARD) */}
        <motion.div 
          whileHover={{ y: -5, borderColor: 'rgba(249, 115, 22, 0.4)' }}
          onClick={() => navigate('/bookings')}
          className="mb-16 p-8 md:p-10 rounded-[50px] bg-gradient-to-br from-orange-600/[0.08] to-transparent border border-white/10 backdrop-blur-3xl relative overflow-hidden group cursor-pointer shadow-2xl"
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
            <div className="flex gap-8 items-center">
              <div className="p-5 bg-orange-600 rounded-[30px] text-white shadow-[0_15px_40px_rgba(234,88,12,0.3)] group-hover:rotate-12 transition-transform duration-500">
                <Briefcase size={28} />
              </div>
              <div className="text-center md:text-left">
                <h3 className="text-2xl md:text-3xl font-black uppercase italic text-white tracking-tighter">My Active Reservations</h3>
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em] mt-2">Manage your upcoming stays, rides & tactical logs</p>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-white/5 px-8 py-4 rounded-full border border-white/10 group-hover:border-orange-500/50 transition-all">
              <span className="text-[10px] font-black uppercase tracking-widest text-orange-500">Open Command Center</span>
              <ChevronRight className="text-orange-500 group-hover:translate-x-2 transition-transform" size={18} />
            </div>
          </div>
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-orange-600/10 blur-[60px] rounded-full pointer-events-none" />
        </motion.div>

        {/* --- STATS DASHBOARD --- */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          <StatCard label="Completed missions" val={bookings.length} />
          <StatCard label="Planned paths" val={savedTrips.length} />
          <StatCard label="Vaulted items" val={wishlist.length} />
          <StatCard label="Referral Credits" val="₹1,250" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* NAVIGATION TABS */}
          <div className="lg:col-span-3 space-y-3">
            {[
              { id: 'bookings', label: 'Recent Activity', icon: <Package size={18}/> },
              { id: 'trips', label: 'Tactical Maps', icon: <MapIcon size={18}/> },
              { id: 'wishlist', label: 'Secured Vault', icon: <Heart size={18}/> },
              { id: 'settings', label: 'Identity Config', icon: <Settings size={18}/> }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-5 px-8 py-5 rounded-[25px] font-black text-[9px] uppercase tracking-widest transition-all border ${
                  activeTab === tab.id ? 'bg-orange-600 border-orange-500 text-white shadow-xl italic' : 'bg-white/5 border-transparent text-white/30 hover:bg-white/10 hover:text-white'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
            <button onClick={handleLogout} className="w-full flex items-center gap-5 px-8 py-5 rounded-[25px] font-black text-[9px] uppercase tracking-widest text-red-500 bg-red-500/5 mt-8 border border-red-500/10 hover:bg-red-500 hover:text-white transition-all">
              <LogOut size={18}/> Terminate Session
            </button>
          </div>

          {/* DYNAMIC CONTENT AREA */}
          <div className="lg:col-span-9 bg-white/[0.02] border border-white/5 rounded-[50px] p-8 md:p-12 backdrop-blur-xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {activeTab === 'bookings' && (
                  bookings.length === 0 ? <EmptyState title="No Recent Deployments" /> : bookings.slice(0, 3).map(b => <BookingCard key={b._id} booking={b} />)
                )}

                {activeTab === 'trips' && (
                  savedTrips.length === 0 ? <EmptyState title="No Tactical Drafts" /> : savedTrips.map((t, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 p-8 rounded-[35px] flex justify-between items-center group hover:bg-white/[0.08] transition-all cursor-pointer">
                       <div className="space-y-2">
                         <div className="flex items-center gap-2 text-orange-500 font-black text-[8px] uppercase tracking-widest italic"><Clock size={12}/> Draft Log</div>
                         <h4 className="text-xl font-black italic uppercase tracking-tighter">{t.title}</h4>
                       </div>
                       <ChevronRight className="text-white/20 group-hover:text-orange-500 transition-colors" />
                    </div>
                  ))
                )}

                {activeTab === 'wishlist' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {wishlist.length === 0 ? <EmptyState title="Vault Devoid of Items" /> : wishlist.map(w => <WishCard key={w._id} item={w} />)}
                  </div>
                )}

                {activeTab === 'settings' && (
                  <div className="space-y-10">
                    <h3 className="text-lg font-black italic uppercase tracking-widest border-l-4 border-orange-600 pl-4 leading-none text-white">Security Credentials</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <InputGroup label="Identity Name" val={user.user_metadata?.full_name} />
                       <InputGroup label="Uplink Frequency (Email)" val={user.email} />
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- ELITE SUB-COMPONENTS ---

const StatCard = ({ label, val }) => (
  <div className="bg-white/5 border border-white/10 p-6 rounded-[30px] text-center backdrop-blur-xl hover:border-orange-500/30 transition-all group">
    <p className="text-[7px] font-black text-white/20 uppercase tracking-[0.4em] mb-2 group-hover:text-orange-500 transition-colors">{label}</p>
    <p className="text-2xl md:text-3xl font-black italic text-white tracking-tighter">{val}</p>
  </div>
);

const BookingCard = ({ booking }) => (
  <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded-[35px] flex flex-col md:flex-row gap-6 items-center hover:border-orange-500/20 transition-all">
    <div className="w-16 h-16 rounded-2xl bg-orange-600/10 flex items-center justify-center text-orange-500 border border-orange-500/10">
      <ShieldCheck size={24} />
    </div>
    <div className="flex-1 text-center md:text-left">
      <div className="text-[8px] font-black text-green-500 uppercase tracking-widest mb-1">Active Deployment</div>
      <h4 className="text-xl font-black italic uppercase tracking-tighter">{booking.hotelId?.hotelName || 'Fleet Request'}</h4>
    </div>
    <div className="text-right">
       <p className="text-xl font-black italic text-white">₹{booking.totalPrice || '---'}</p>
    </div>
  </div>
);

const WishCard = ({ item }) => (
  <div className="bg-white/5 border border-white/10 rounded-[35px] overflow-hidden group relative">
    <div className="h-40 relative">
       <img src={item.images?.[0]} className="w-full h-full object-cover opacity-50 group-hover:scale-110 transition-transform duration-700" alt="vaulted" />
       <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
       <div className="absolute bottom-4 left-6">
         <h4 className="text-lg font-black italic uppercase tracking-tighter">{item.hotelName}</h4>
       </div>
    </div>
  </div>
);

const InputGroup = ({ label, val }) => (
  <div className="space-y-3">
    <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.4em] ml-2">{label}</p>
    <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-xs font-bold text-white/50 italic">{val || 'Awaiting Input'}</div>
  </div>
);

const EmptyState = ({ title }) => (
  <div className="py-20 text-center border border-dashed border-white/10 rounded-[40px] bg-white/[0.01]">
    <Sparkles size={32} className="text-white/5 mx-auto mb-4" />
    <h4 className="text-sm font-black italic uppercase text-white/20 tracking-[0.3em]">{title}</h4>
  </div>
);

export default Profile;