import React, { useMemo, useState, useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mountain, LogOut, Settings2, ShieldCheck, Menu, X, Heart, Sparkles, CalendarDays, MessageSquareText, Gift, User } from 'lucide-react';
import API from './utils/api';
import Notification from "./components/Notification";
import { useNotify } from "./context/NotificationContext";
import AnimatedBackground from "./components/AnimatedBackground";
import { useAuth } from "./context/AuthContext";
import { hasSupabaseEnv } from "./utils/supabase";
import EnvBanner from "./components/EnvBanner";
import Footer from "./components/Footer";
import LiveChatSupport from "./components/LiveChatSupport";
import { useTheme } from "./context/ThemeContext";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";

// Lazy pages
const ExploreStays = React.lazy(() => import("./pages/ExploreStays"));
const ExploreRides = React.lazy(() => import("./pages/ExploreRides"));
const Home = React.lazy(() => import("./pages/Home"));
const AddHotel = React.lazy(() => import("./pages/AddHotel"));
const AddTransport = React.lazy(() => import("./pages/AddTransport"));
const Bookings = React.lazy(() => import("./pages/Bookings"));
const ManageRides = React.lazy(() => import("./pages/ManageRides"));
const ManageStays = React.lazy(() => import("./pages/ManageStays"));
const AdminDashboard = React.lazy(() => import("./pages/AdminDashboard"));
const Login = React.lazy(() => import("./pages/Login"));
const Register = React.lazy(() => import("./pages/Register"));
const Recommendations = React.lazy(() => import("./pages/Recommendations"));
const BookingConfirm = React.lazy(() => import("./pages/BookingConfirm"));
const PaymentResult = React.lazy(() => import("./pages/PaymentResult"));
const Planner = React.lazy(() => import("./pages/Planner"));
const Wishlist = React.lazy(() => import("./pages/Wishlist"));
const Referral = React.lazy(() => import("./pages/Referral"));
const SupportChat = React.lazy(() => import("./pages/SupportChat"));
const AdminBookings = React.lazy(() => import("./pages/AdminBookings"));
const Profile = React.lazy(() => import("./pages/Profile"));

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isDark, toggle: toggleTheme } = useTheme();
  const token = !!user;
  const [hasListedItems, setHasListedItems] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false); // Tooltip state

  useEffect(() => {
    const checkUserContent = async () => {
      if (!token) {
        setHasListedItems(false);
        return;
      }
      try {
        const [hotelRes, rideRes] = await Promise.all([
          API.get("/hotel/admin/all"), 
          API.get("/transport/admin/all")
        ]);
        const hData = hotelRes.data?.data || hotelRes.data || [];
        const rData = rideRes.data?.data || rideRes.data || [];
        if (hData.length > 0 || rData.length > 0) setHasListedItems(true);
      } catch (err) {
        // Partner check failed
      }
    };
    checkUserContent();
  }, [token]);

  const handleProtectedClick = (e, targetPath) => {
    if (!token) {
      e.preventDefault();
      navigate('/login', { state: { from: targetPath } });
    }
  };
  
  const navItems = useMemo(() => ([
    { to: "/explore-stays", label: "STAYS", isProtected: false },
    { to: "/explore-rides", label: "RIDES", isProtected: false },
    { to: "/recommendations", label: "AI PICKS", isProtected: false },
    { to: "/planner", label: "PLANNER", isProtected: false },
    { to: "/wishlist", label: "WISHLIST", isProtected: true },
    { to: "/support", label: "SUPPORT", isProtected: false },
    { to: "/referral", label: "REFERRAL", isProtected: true },
    { to: "/add-hotel", label: "LIST STAY", isProtected: true },
    { to: "/add-transport", label: "OFFER RIDE", isProtected: true },
    { to: "/manage-stays", label: "MANAGE STAYS", isProtected: true, hide: !token || !hasListedItems },
    { to: "/manage-rides", label: "MANAGE RIDES", isProtected: true, hide: !token || !hasListedItems },
  ]), [token, hasListedItems]);

  const handleLogout = () => {
    signOut();
    navigate("/login", { replace: true });
  };

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <nav className="fixed top-0 w-full z-50">
      <div className={`px-5 sm:px-8 lg:px-12 py-4 flex justify-between items-center backdrop-blur-2xl border-b ${isDark ? 'border-white/10' : 'border-black/10'}`}>
        <Link to="/" className="flex items-center gap-2">
          <div className="bg-gradient-to-br from-[#F97316] to-[#EA580C] p-1.5 rounded-md text-white shadow-xl">
            <Mountain size={22}/>
          </div>
          <h1 className="font-black tracking-tighter text-2xl uppercase italic leading-none text-white">M-Mate</h1>
        </Link>
        
        <div className="hidden lg:flex gap-10 absolute left-1/2 -translate-x-1/2">
          {navItems.filter(item => !item.hide).map((item) => (
            <Link 
              key={item.to} 
              to={item.to} 
              onClick={(e) => item.isProtected && handleProtectedClick(e, item.to)}
              className={`text-[10px] font-black tracking-[0.28em] transition-all duration-300 hover:text-[#F97316] relative ${
                location.pathname === item.to ? 'text-[#F97316]' : 'text-white/70'
              }`}>
              {item.label}
              {location.pathname === item.to && (
                <motion.div layoutId="navLine" className="absolute -bottom-2 left-0 w-full h-[2px] bg-[#F97316]" />
              )}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4 sm:gap-6">
          <button type="button" onClick={toggleTheme} className={`hidden sm:inline-flex items-center justify-center w-11 h-11 rounded-full border transition-all active:scale-95 ${isDark ? "bg-white/5 border-white/10 text-white/70" : "bg-black/5 border-black/10 text-slate-700"}`}>
            <span className="text-[10px] font-black tracking-widest">{isDark ? "DARK" : "LIGHT"}</span>
          </button>
          
          <Link to="/admin-mate" className={`${isDark ? "text-white/25" : "text-slate-500"} hover:text-orange-500 transition-all flex items-center gap-2 font-black text-[9px] tracking-widest leading-none`}>
             <ShieldCheck size={16}/> ADMIN
          </Link>

          {token ? (
            <div className="flex items-center gap-4">
              {/* --- GOL PROFILE ICON WITH TOOLTIP --- */}
              <div className="relative flex items-center justify-center">
                <Link 
                  to="/profile" 
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                  className="relative group"
                >
                  <div className="absolute -inset-1 bg-gradient-to-tr from-blue-500 via-purple-500 to-orange-500 rounded-full opacity-0 group-hover:opacity-40 blur-md transition-opacity duration-500" />
                  <div className="relative w-10 h-10 rounded-full p-[1.5px] bg-gradient-to-b from-white/20 to-transparent backdrop-blur-3xl overflow-hidden border border-white/10 group-hover:border-orange-500/50 transition-all shadow-xl">
                    <div className="w-full h-full rounded-full bg-[#0a0a0a] flex items-center justify-center overflow-hidden">
                      {user.user_metadata?.avatar_url ? (
                        <img src={user.user_metadata.avatar_url} alt="User" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[12px] font-black italic text-orange-500">
                          {user.email?.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>

                {/* --- TOOLTIP --- */}
                <AnimatePresence>
                  {showTooltip && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute top-14 right-0 min-w-[150px] bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl pointer-events-none z-[60]"
                    >
                      <p className="text-white font-black italic uppercase text-[11px] tracking-tighter">
                        {user.user_metadata?.full_name || user.email?.split('@')[0]}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">Active Explorer</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button onClick={handleLogout} className={`${isDark ? "text-white/30 hover:text-red-500" : "text-slate-400 hover:text-red-600"} transition-all group`}>
                <LogOut size={20}/>
              </button>
            </div>
          ) : (
            <Link to="/login" className={`${isDark ? "text-white/50" : "text-slate-600"} hover:text-orange-500 font-black text-[10px] tracking-widest`}>LOGIN</Link>
          )}

          <button type="button" onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden text-white/70">
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ x: 24, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 24, opacity: 0 }} className={`lg:hidden fixed top-20 right-4 left-4 border rounded-[28px] shadow-2xl overflow-hidden ${isDark ? "bg-[#0b0b0b]/95 border-white/10" : "bg-white/90 border-black/10"}`}>
            <div className="p-6 grid gap-2">
              {navItems.filter(item => !item.hide).map((item) => (
                <Link key={item.to} to={item.to} onClick={() => setMobileOpen(false)} className={`px-4 py-3 rounded-2xl border font-black uppercase tracking-[0.25em] text-[10px] ${location.pathname === item.to ? "bg-orange-600 text-white" : "bg-white/5 text-white/70"}`}>
                  {item.label}
                </Link>
              ))}
              {token && (
                 <Link to="/profile" className="px-4 py-3 rounded-2xl border bg-white/5 text-white/70 font-black uppercase tracking-[0.25em] text-[10px] flex items-center gap-2">
                   <User size={14}/> MY PROFILE
                 </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const PageShell = ({ children }) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>
    {children}
  </motion.div>
);

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#050505]"><p className="text-orange-500 font-black animate-pulse uppercase tracking-[0.5em]">Syncing Terrain...</p></div>}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageShell><Home /></PageShell>} />
          <Route path="/explore-stays" element={<PageShell><ExploreStays /></PageShell>} />
          <Route path="/explore-rides" element={<PageShell><ExploreRides /></PageShell>} />
          <Route path="/add-hotel" element={<PageShell><AddHotel /></PageShell>} />
          <Route path="/add-transport" element={<PageShell><AddTransport /></PageShell>} />
          <Route path="/bookings" element={<PageShell><Bookings /></PageShell>} />
          <Route path="/manage-stays" element={<PageShell><ManageStays /></PageShell>} />
          <Route path="/manage-rides" element={<PageShell><ManageRides /></PageShell>} />
          <Route path="/admin-mate" element={<PageShell><AdminDashboard /></PageShell>} />
          <Route path="/login" element={<PageShell><Login /></PageShell>} />
          <Route path="/register" element={<PageShell><Register /></PageShell>} />
          <Route path="/recommendations" element={<PageShell><Recommendations /></PageShell>} />
          <Route path="/booking/:id/confirm" element={<PageShell><BookingConfirm /></PageShell>} />
          <Route path="/payment/success" element={<PageShell><PaymentResult ok={true} /></PageShell>} />
          <Route path="/payment/failure" element={<PageShell><PaymentResult ok={false} /></PageShell>} />
          <Route path="/planner" element={<PageShell><Planner /></PageShell>} />
          <Route path="/wishlist" element={<PageShell><Wishlist /></PageShell>} />
          <Route path="/referral" element={<PageShell><Referral /></PageShell>} />
          <Route path="/support" element={<PageShell><SupportChat /></PageShell>} />
          <Route path="/admin-bookings" element={<PageShell><AdminBookings /></PageShell>} />
          <Route path="/profile" element={<PageShell><Profile /></PageShell>} />
        </Routes>
      </AnimatePresence>
    </Suspense>
  );
};

function App() {
  const { notification } = useNotify();
  if (!hasSupabaseEnv) {
    return (
      <Router>
        <div className="bg-[#0a0a0a] min-h-screen relative flex items-center justify-center">
          <EnvBanner title="Configuration Missing" lines={["Please check your environment variables."]} />
        </div>
      </Router>
    );
  }
  return (
    <Router>
      <div className="min-h-screen bg-[#050505] text-white overflow-x-hidden relative">
        <AnimatedBackground />
        <Navbar />
        <main className="relative z-10">
          <AnimatedRoutes />
        </main>
        <Footer />
        <LiveChatSupport />
        <div className="fixed bottom-0 w-full h-40 bg-gradient-to-t from-[#050505] to-transparent pointer-events-none z-0"></div>
      </div>
      <Notification notification={notification} />
    </Router>
  );
}

export default App;