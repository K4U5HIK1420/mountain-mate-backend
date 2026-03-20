import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Mail, MapPin, Heart, Package, 
  Settings, LogOut, Camera, ChevronRight, Clock, 
  Gift, Copy, Map as MapIcon, ShieldCheck, Zap, TrendingUp, Sparkles
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
        const bookingRes = await API.get('/booking/user');
        setBookings(bookingRes.data.data || []);
        const tripsRes = await API.get('/trips/my-trips');
        setSavedTrips(tripsRes.data || []);
        const storedWishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
        setWishlist(storedWishlist);
      } catch (error) { console.error("Profile Fetch Error"); }
    };
    if (user) fetchData();
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  if (!user) return <div className="...">Access Restricted...</div>;

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-32 pb-20 px-4 md:px-8 font-sans relative overflow-hidden">
      
      {/* --- GEMINI MULTI-COLOR AURA --- */}
      <div className="fixed top-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-600/10 blur-[150px] rounded-full pointer-events-none z-0" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-orange-600/10 blur-[150px] rounded-full pointer-events-none z-0" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-600/[0.03] blur-[180px] rounded-full pointer-events-none z-0" />

      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* --- THE GEMINI AVATAR CORE --- */}
        <div className="flex flex-col items-center mb-24">
          <div 
            className="relative group cursor-pointer"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* Rotating Outer Ring */}
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-6 bg-gradient-to-tr from-blue-500 via-purple-500 to-orange-500 rounded-full opacity-20 blur-2xl group-hover:opacity-40 transition-opacity"
            />
            
            {/* The Main Circle */}
            <div className="relative w-40 h-40 md:w-52 md:h-52 rounded-full p-[3px] bg-gradient-to-b from-white/20 to-transparent backdrop-blur-3xl overflow-hidden shadow-2xl">
              <div className="w-full h-full rounded-full bg-[#0a0a0a] flex items-center justify-center overflow-hidden border border-white/5">
                {user?.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-6xl font-black italic text-transparent bg-clip-text bg-gradient-to-br from-white to-white/20">
                    {user.email?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: isHovered ? 1 : 0 }}
                className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2"
              >
                <Camera size={24} className="text-orange-500" />
                <span className="text-[8px] font-black uppercase tracking-widest">Update Identity</span>
              </motion.div>
            </div>

            {/* Verification Badge */}
            <div className="absolute -bottom-2 right-6 bg-orange-600 p-3 rounded-2xl shadow-2xl border-4 border-[#050505]">
               <ShieldCheck size={20} className="text-white" />
            </div>
          </div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center mt-10 space-y-3">
             <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter leading-none">
                {user.user_metadata?.full_name || user.email?.split('@')[0]}
             </h1>
             <p className="text-orange-500 text-[10px] font-black tracking-[0.5em] uppercase italic flex items-center justify-center gap-3">
               <TrendingUp size={14}/> Expedition Level: Elite Explorer
             </p>
          </motion.div>
        </div>

        {/* --- STATS DASHBOARD --- */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          <StatCard label="Completed missions" val={bookings.length} />
          <StatCard label="Planned paths" val={savedTrips.length} />
          <StatCard label="Vaulted items" val={wishlist.length} />
          <StatCard label="Referral Credits" val="₹1,250" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* NAVIGATION TABS */}
          <div className="lg:col-span-3 space-y-2">
            {[
              { id: 'bookings', label: 'History', icon: <Package size={18}/> },
              { id: 'trips', label: 'Expeditions', icon: <MapIcon size={18}/> },
              { id: 'wishlist', label: 'Vault', icon: <Heart size={18}/> },
              { id: 'settings', label: 'Identity', icon: <Settings size={18}/> }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-5 px-8 py-5 rounded-3xl font-black text-[10px] uppercase tracking-widest transition-all ${
                  activeTab === tab.id ? 'bg-orange-600 text-white shadow-xl italic' : 'bg-white/5 text-white/30 hover:bg-white/10 hover:text-white'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
            <button onClick={handleLogout} className="w-full flex items-center gap-5 px-8 py-6 rounded-3xl font-black text-[10px] uppercase tracking-widest text-red-500 bg-red-500/5 mt-8 hover:bg-red-500 hover:text-white transition-all">
              <LogOut size={18}/> Terminate
            </button>
          </div>

          {/* DYNAMIC CONTENT AREA */}
          <div className="lg:col-span-9">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {activeTab === 'bookings' && (
                  bookings.length === 0 ? <EmptyState title="No Missions" /> : bookings.map(b => <BookingCard key={b._id} booking={b} />)
                )}

                {activeTab === 'trips' && (
                  savedTrips.length === 0 ? <EmptyState title="No Planned Paths" /> : savedTrips.map((t, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 p-8 rounded-[40px] flex justify-between items-center group hover:bg-white/[0.08] transition-all">
                       <div className="space-y-2">
                         <div className="flex items-center gap-2 text-orange-500 font-black text-[9px] uppercase tracking-widest italic"><Clock size={12}/> Tactical Draft</div>
                         <h4 className="text-2xl font-black italic uppercase tracking-tighter">{t.title}</h4>
                       </div>
                       <ChevronRight className="text-white/20 group-hover:text-orange-500 transition-colors" />
                    </div>
                  ))
                )}

                {activeTab === 'wishlist' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {wishlist.length === 0 ? <EmptyState title="Vault Empty" /> : wishlist.map(w => <WishCard key={w._id} item={w} />)}
                  </div>
                )}

                {activeTab === 'settings' && (
                  <div className="bg-white/5 border border-white/10 rounded-[50px] p-10 space-y-10">
                    <h3 className="text-xl font-black italic uppercase tracking-widest border-l-2 border-orange-600 pl-4 leading-none">Security Config</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <InputGroup label="Identity" val={user.user_metadata?.full_name} />
                       <InputGroup label="Frequency (Email)" val={user.email} />
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
  <div className="bg-white/5 border border-white/10 p-8 rounded-[35px] text-center backdrop-blur-xl hover:border-orange-500/30 transition-all group">
    <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em] mb-3 group-hover:text-orange-500 transition-colors">{label}</p>
    <p className="text-3xl md:text-4xl font-black italic text-white tracking-tighter">{val}</p>
  </div>
);

const BookingCard = ({ booking }) => (
  <div className="bg-white/[0.02] border border-white/5 p-8 rounded-[45px] flex flex-col md:flex-row gap-8 items-center hover:bg-white/[0.04] transition-all group">
    <div className="w-24 h-24 rounded-3xl bg-orange-600/10 flex items-center justify-center text-orange-500 border border-orange-500/20 shadow-inner">
      <ShieldCheck size={32} />
    </div>
    <div className="flex-1 text-center md:text-left space-y-3">
      <div className="text-[9px] font-black text-green-500 uppercase tracking-widest bg-green-500/10 w-fit px-3 py-1 rounded-full mx-auto md:mx-0">Active Deployment</div>
      <h4 className="text-2xl font-black italic uppercase tracking-tighter">{booking.hotelId?.hotelName || 'Fleet Request'}</h4>
      <p className="text-white/20 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center md:justify-start gap-2 italic">
        <MapPin size={12}/> {booking.hotelId?.location || 'Uttarakhand Sector'}
      </p>
    </div>
    <div className="text-right">
       <p className="text-2xl font-black italic text-white">₹{booking.totalPrice || '---'}</p>
       <p className="text-[8px] font-black text-white/20 uppercase">Tactical Fare</p>
    </div>
  </div>
);

const WishCard = ({ item }) => (
  <div className="bg-white/5 border border-white/10 rounded-[40px] overflow-hidden group">
    <div className="h-44 relative">
       <img src={item.images?.[0]} className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-1000" />
       <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
       <div className="absolute bottom-4 left-6">
         <h4 className="text-xl font-black italic uppercase tracking-tighter">{item.hotelName}</h4>
       </div>
    </div>
  </div>
);

const InputGroup = ({ label, val }) => (
  <div className="space-y-3 text-left">
    <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.4em] ml-4">{label}</p>
    <div className="bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-sm font-bold text-white/60 italic">{val || 'Not Set'}</div>
  </div>
);

const EmptyState = ({ title }) => (
  <div className="py-24 text-center border-2 border-dashed border-white/5 rounded-[50px] bg-white/[0.01]">
    <Sparkles size={40} className="text-white/5 mx-auto mb-4" />
    <h4 className="text-xl font-black italic uppercase text-white/20 tracking-widest">{title}</h4>
  </div>
);

export default Profile;