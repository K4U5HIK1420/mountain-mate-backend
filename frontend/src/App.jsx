import React, { useMemo, useState, useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mountain, LogOut, Settings2, ShieldCheck, Menu, X, Sparkles, User, PlusCircle, Car, Heart, Gift, LayoutDashboard, Bot } from 'lucide-react';

// --- CORE UTILS & CONTEXT ---
import API from './utils/api';
import { useNotify } from "./context/NotificationContext";
import { useAuth } from "./context/AuthContext";
import { useTheme } from "./context/ThemeContext";
import { hasSupabaseEnv } from "./utils/supabase";

// --- COMPONENTS ---
import Notification from "./components/Notification";
import AnimatedBackground from "./components/AnimatedBackground";
import ParticlesCanvas from "./components/ParticlesCanvas";
import EnvBanner from "./components/EnvBanner";
import Footer from "./components/Footer";
import LiveChatSupport from "./components/LiveChatSupport";
import ErrorBoundary from "./components/ErrorBoundary";
import AIAdvisor from "./components/Features/AIAdvisor";

import "leaflet/dist/leaflet.css";

const navMotion = {
  type: "spring",
  stiffness: 220,
  damping: 22,
};

// --- LAZY PAGES ---
const Home = React.lazy(() => import("./pages/Home"));
const ExploreStays = React.lazy(() => import("./pages/ExploreStays"));
const ExploreRides = React.lazy(() => import("./pages/ExploreRides"));
const AddHotel = React.lazy(() => import("./pages/AddHotel"));
const AddTransport = React.lazy(() => import("./pages/AddTransport"));
const Bookings = React.lazy(() => import("./pages/Bookings"));
const ManageStays = React.lazy(() => import("./pages/ManageStays"));
const ManageRides = React.lazy(() => import("./pages/ManageRides"));
const Dashboard = React.lazy(() => import("./pages/Dashboard"));
const AdminDashboard = React.lazy(() => import("./pages/AdminDashboard"));
const AdminBookings = React.lazy(() => import("./pages/AdminBookings"));
const Login = React.lazy(() => import("./pages/Login"));
const Register = React.lazy(() => import("./pages/Register"));
const RegisterPartner = React.lazy(() => import("./pages/RegisterPartner"));
const Recommendations = React.lazy(() => import("./pages/Recommendations"));
const Planner = React.lazy(() => import("./pages/Planner"));
const Profile = React.lazy(() => import("./pages/Profile"));
const Referral = React.lazy(() => import("./pages/Referral"));
const Wishlist = React.lazy(() => import("./pages/Wishlist"));
const SupportChat = React.lazy(() => import("./pages/SupportChat"));
const BookingConfirm = React.lazy(() => import("./pages/BookingConfirm"));
const PaymentResult = React.lazy(() => import("./pages/PaymentResult"));

// --- NAVBAR COMPONENT ---
const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isDark, toggle: toggleTheme } = useTheme();
  const token = !!user;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hasListedItems, setHasListedItems] = useState(false);

  // ✅ Fix 403 Forbidden: Only check for content if token exists
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
        setHasListedItems(false);
      }
    };
    checkUserContent();
  }, [token]);

  const navLinks = useMemo(() => [
    { to: "/explore-stays", label: "STAYS" },
    { to: "/explore-rides", label: "RIDES" },
    { to: "/ai-advisor", label: "AI ADVISOR", icon: <Bot size={12}/> },
    { to: "/planner", label: "PLANNER" },
    { to: "/wishlist", label: "WISHLIST", isProtected: true, icon: <Heart size={12}/> },
    { to: "/dashboard", label: "DASHBOARD", isProtected: true, icon: <LayoutDashboard size={12}/> },
  ], []);

  const handleProtectedClick = (e, targetPath) => {
    if (!token) {
      e.preventDefault();
      navigate('/login', { state: { from: targetPath } });
    }
  };

  return (
    <nav className="fixed top-0 w-full z-50 px-4 py-3 sm:px-8 lg:px-12">
      <motion.div
        initial={{ opacity: 0, y: -28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className={`cinematic-surface spotlight-border flex justify-between items-center rounded-[30px] px-6 py-4 transition-all duration-500 shadow-2xl ${isDark ? 'border-white/10 bg-black/55 shadow-orange-900/10' : 'border-black/10 bg-white/70'}`}
      >
        
        <Link to="/" className="flex items-center gap-3">
          <div className="animate-pulse-glow rounded-2xl bg-gradient-to-br from-orange-500 via-orange-600 to-amber-500 p-2.5 text-white shadow-[0_18px_44px_rgba(249,115,22,0.32)] rotate-3"><Mountain size={20}/></div>
          <h1 className="font-black tracking-tighter text-xl uppercase italic text-white hidden sm:block">M-Mate</h1>
        </Link>
        
        <div className="hidden lg:flex gap-6 absolute left-1/2 -translate-x-1/2">
          {navLinks.map((item) => (
            <motion.div key={item.to} whileHover={{ y: -2 }} transition={navMotion}>
              <Link to={item.to} onClick={(e) => item.isProtected && handleProtectedClick(e, item.to)} className={`relative flex items-center gap-1 text-[9px] font-black tracking-[0.15em] transition-all hover:text-orange-500 ${location.pathname === item.to ? 'text-orange-400' : 'text-white/55'}`}>
                {item.icon}{item.label}
                {location.pathname === item.to && (
                  <motion.span
                    layoutId="nav-active-pill"
                    className="absolute -bottom-2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500 to-transparent"
                    transition={navMotion}
                  />
                )}
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="hidden xl:flex items-center gap-2 ml-auto mr-6 border-l border-white/10 pl-6">
            <Link to="/add-hotel" onClick={(e) => handleProtectedClick(e, "/add-hotel")} className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-4 py-2 rounded-xl font-black text-[8px] tracking-widest transition-all italic flex items-center gap-2 hover:-translate-y-0.5">
              <PlusCircle size={12} className="text-orange-500"/> LIST STAY
            </Link>
            <Link to="/add-transport" onClick={(e) => handleProtectedClick(e, "/add-transport")} className="bg-gradient-to-r from-orange-500 to-amber-500 hover:brightness-110 text-white px-4 py-2 rounded-xl font-black text-[8px] tracking-widest transition-all italic shadow-lg flex items-center gap-2 hover:-translate-y-0.5">
              <Car size={12}/> OFFER RIDE
            </Link>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={toggleTheme} className="hidden sm:flex w-10 h-10 rounded-full border border-white/10 items-center justify-center text-white/50 hover:bg-white/5">
            {isDark ? <Sparkles size={14}/> : <Settings2 size={14}/>}
          </button>
          
          {token ? (
            <div className="flex items-center gap-4">
              <Link to="/profile" className="w-10 h-10 rounded-full p-[1.5px] bg-gradient-to-tr from-orange-500 via-amber-400 to-white overflow-hidden shadow-xl">
                <div className="w-full h-full rounded-full bg-black flex items-center justify-center font-black text-orange-500 uppercase">{user.email?.charAt(0)}</div>
              </Link>
              <button onClick={() => { signOut(); navigate("/login"); }} className="text-white/20 hover:text-red-500 active:scale-90 transition-all"><LogOut size={18}/></button>
            </div>
          ) : (
            <Link to="/login" className="bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 hover:brightness-110 text-white px-5 py-2.5 rounded-full font-black text-[9px] tracking-widest italic shadow-lg transition-all hover:-translate-y-0.5">LOGIN</Link>
          )}

          <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden text-white/50 bg-white/5 p-2 rounded-xl border border-white/10 hover:bg-white/10">
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0, y: -20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -20, scale: 0.98 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }} className={`cinematic-surface lg:hidden fixed top-24 right-4 left-4 border rounded-[40px] p-8 shadow-3xl z-[99] ${isDark ? "bg-black/98 border-white/10" : "bg-white/95 border-black/10"}`}>
            <div className="grid gap-3">
              {navLinks.map((item) => (
                <Link key={item.to} to={item.to} onClick={() => setMobileOpen(false)} className="px-6 py-4 rounded-[20px] bg-white/5 border border-white/5 text-white/70 font-black uppercase text-[9px] hover:bg-white/10 hover:text-white">{item.label}</Link>
              ))}
              <Link to="/referral" onClick={() => setMobileOpen(false)} className="px-6 py-4 rounded-[20px] bg-orange-600/10 text-orange-500 font-black text-[9px] flex items-center gap-2 italic"><Gift size={12}/> REFER & EARN</Link>
              <div className="grid grid-cols-2 gap-2 mt-4">
                  <Link to="/add-hotel" onClick={() => setMobileOpen(false)} className="bg-white/5 p-4 rounded-2xl text-[8px] font-black text-center italic border border-white/5 uppercase">LIST STAY</Link>
                  <Link to="/add-transport" onClick={() => setMobileOpen(false)} className="bg-orange-600 p-4 rounded-2xl text-[8px] font-black text-center italic uppercase">OFFER RIDE</Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const PageShell = ({ children }) => (
  <motion.div initial={{ opacity: 0, y: 18, scale: 0.995 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -18, scale: 0.995 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="min-h-screen">
    {children}
  </motion.div>
);

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center bg-black"><p className="text-orange-500 font-black animate-pulse uppercase tracking-widest">TRANSMITTING...</p></div>}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageShell><Home /></PageShell>} />
          <Route path="/explore-stays" element={<PageShell><ExploreStays /></PageShell>} />
          <Route path="/explore-rides" element={<PageShell><ExploreRides /></PageShell>} />
          <Route path="/ai-advisor" element={<PageShell><AIAdvisor /></PageShell>} />
          <Route path="/add-hotel" element={<PageShell><AddHotel /></PageShell>} />
          <Route path="/add-transport" element={<PageShell><AddTransport /></PageShell>} />
          <Route path="/bookings" element={<PageShell><Bookings /></PageShell>} />
          <Route path="/manage-stays" element={<PageShell><ManageStays /></PageShell>} />
          <Route path="/manage-rides" element={<PageShell><ManageRides /></PageShell>} />
          <Route path="/dashboard" element={<PageShell><Dashboard /></PageShell>} />
          <Route path="/admin-mate" element={<PageShell><AdminDashboard /></PageShell>} />
          <Route path="/admin-bookings" element={<PageShell><AdminBookings /></PageShell>} />
          <Route path="/login" element={<PageShell><Login /></PageShell>} />
          <Route path="/register" element={<PageShell><Register /></PageShell>} />
          <Route path="/register-partner" element={<PageShell><RegisterPartner /></PageShell>} />
          <Route path="/recommendations" element={<PageShell><Recommendations /></PageShell>} />
          <Route path="/planner" element={<PageShell><Planner /></PageShell>} />
          <Route path="/profile" element={<PageShell><Profile /></PageShell>} />
          <Route path="/referral" element={<PageShell><Referral /></PageShell>} />
          <Route path="/wishlist" element={<PageShell><Wishlist /></PageShell>} />
          <Route path="/support" element={<PageShell><SupportChat /></PageShell>} />
          <Route path="/booking/:id/confirm" element={<PageShell><BookingConfirm /></PageShell>} />
          <Route path="/payment/success" element={<PageShell><PaymentResult ok={true} /></PageShell>} />
          <Route path="/payment/failure" element={<PageShell><PaymentResult ok={false} /></PageShell>} />
        </Routes>
      </AnimatePresence>
    </Suspense>
  );
};

function App() {
  const { notification } = useNotify();

  if (!hasSupabaseEnv) {
    return (
      <div className="bg-black min-h-screen flex items-center justify-center p-10">
        <EnvBanner title="Config Mismatch" lines={["Establishing contact with server..."]} />
      </div>
    );
  }

  return (
    <Router>
      <ErrorBoundary>
        {/* ✅ Flex Layout Fix: Footer stays at bottom */}
        <div className="min-h-screen flex flex-col bg-[#050505] text-white overflow-x-hidden relative font-sans">
          <AnimatedBackground />
          <ParticlesCanvas />
          <Navbar />
          
          {/* ✅ main area expands to push footer down */}
          <main className="relative z-10 pt-28 flex-1">
            <AnimatedRoutes />
          </main>
          
          <Footer />
          <LiveChatSupport />
          <Notification notification={notification} />
          <div className="fixed bottom-0 w-full h-32 bg-gradient-to-t from-black via-black/70 to-transparent pointer-events-none z-0 opacity-60"></div>
        </div>
      </ErrorBoundary>
    </Router>
  );
}

export default App;
