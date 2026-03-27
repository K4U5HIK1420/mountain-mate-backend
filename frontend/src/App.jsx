import React, { useMemo, useState, useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mountain, LogOut, Menu, X, PlusCircle, Car, LayoutGrid, ChevronDown, Shield } from 'lucide-react';

// --- CORE UTILS & CONTEXT ---
import API from './utils/api';
import { useNotify } from "./context/NotificationContext";
import { useAuth } from "./context/AuthContext";
import { hasSupabaseEnv } from "./utils/supabase";

// --- COMPONENTS ---
import Notification from "./components/Notification";
import AnimatedBackground from "./components/AnimatedBackground";
import ParticlesCanvas from "./components/ParticlesCanvas";
import Footer from "./components/Footer";
import LiveChatSupport from "./components/LiveChatSupport";
import ErrorBoundary from "./components/ErrorBoundary";
import AIAdvisor from "./components/Features/AIAdvisor";

import "leaflet/dist/leaflet.css";

// --- PROTECTED ROUTE WRAPPER ---
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
};

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
};

// --- LAZY IMPORTS ---
const Home = React.lazy(() => import("./pages/Home"));
const ExploreStays = React.lazy(() => import("./pages/ExploreStays"));
const ExploreRides = React.lazy(() => import("./pages/ExploreRides"));
const AddHotel = React.lazy(() => import("./pages/AddHotel"));
const AddTransport = React.lazy(() => import("./pages/AddTransport"));
const Bookings = React.lazy(() => import("./pages/Bookings"));
const ManageStays = React.lazy(() => import("./pages/ManageStays"));
const ManageRides = React.lazy(() => import("./pages/ManageRides"));
const AdminDashboard = React.lazy(() => import("./pages/AdminCommandCenter"));
const AdminBookings = React.lazy(() => import("./pages/AdminBookingsPanel"));
const AdminSupport = React.lazy(() => import("./pages/AdminSupport"));
const Login = React.lazy(() => import("./pages/Login"));
const ResetPassword = React.lazy(() => import("./pages/ResetPassword"));
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

// --- PREMIUM NAVBAR ---
const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, signOut } = useAuth();
  const token = !!user;
  const [hasAdminAccess, setHasAdminAccess] = useState(false);
  const isAdmin = role === "admin" || hasAdminAccess;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isBusinessOpen, setIsBusinessOpen] = useState(false);
  
  const [hasHotels, setHasHotels] = useState(false);
  const [hasRides, setHasRides] = useState(false);

  useEffect(() => {
    const checkPartnerRoles = async () => {
      if (!token) return;
      try {
        const [hRes, rRes] = await Promise.all([
          API.get("/hotel/admin/all").catch(() => ({ data: [] })),
          API.get("/transport/admin/all").catch(() => ({ data: [] }))
        ]);
        const hData = hRes.data?.data || hRes.data || [];
        const rData = rRes.data?.data || rRes.data || [];
        setHasHotels(hData.length > 0);
        setHasRides(rData.length > 0);
      } catch (err) {
        setHasHotels(false);
        setHasRides(false);
      }
    };
    checkPartnerRoles();
  }, [token]);

  useEffect(() => {
    let active = true;

    const checkAdminAccess = async () => {
      if (!token) {
        setHasAdminAccess(false);
        return;
      }

      if (role === "admin") {
        setHasAdminAccess(true);
        return;
      }

      try {
        await API.get("/admin-console/overview");
        if (active) {
          setHasAdminAccess(true);
        }
      } catch {
        if (active) {
          setHasAdminAccess(false);
        }
      }
    };

    checkAdminAccess();

    return () => {
      active = false;
    };
  }, [token, role]);

  // ✅ ONLY CORE SERVICES IN NAVBAR
  const navLinks = useMemo(() => [
    { to: "/explore-stays", label: "STAYS" },
    { to: "/explore-rides", label: "RIDES" },
  ], []);

  return (
    <nav className="fixed top-0 w-full z-[9999] px-4 py-5 sm:px-8 lg:px-16 pointer-events-none">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="pointer-events-auto mx-auto max-w-7xl flex justify-between items-center rounded-[40px] px-8 py-4 transition-all duration-700 shadow-2xl relative border border-white/10 bg-black/40 backdrop-blur-[40px]"
      >
        {/* LOGO */}
        <Link to="/" className="flex items-center gap-4 group">
          <div className="relative rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 p-2.5 text-white shadow-xl group-hover:rotate-6 transition-transform">
            <Mountain size={22}/>
          </div>
          <div className="flex flex-col text-left">
            <h1 className="font-black tracking-tighter text-xl uppercase italic leading-none text-white">M-Mate</h1>
            <span className="text-[7px] font-bold tracking-[0.3em] text-orange-500 mt-1 uppercase">Uttarakhand</span>
          </div>
        </Link>
        
        {/* CENTER LINKS (CLEAN) */}
        <div className="hidden lg:flex gap-12 absolute left-1/2 -translate-x-1/2 items-center">
          {navLinks.map((item) => (
            <Link 
              key={item.to} 
              to={item.to}
              className={`relative flex items-center gap-1.5 text-[10px] font-black tracking-[0.25em] transition-all hover:text-orange-500 uppercase italic ${location.pathname === item.to ? 'text-orange-400' : 'text-white/30'}`}
            >
              {item.label}
              {location.pathname === item.to && (
                <motion.span layoutId="nav-pill" className="absolute -bottom-2 left-0 right-0 h-[2px] bg-orange-500 shadow-[0_0_15px_#f97316]" />
              )}
            </Link>
          ))}

          {isAdmin && (
            <Link
              to="/admin-mate"
              className={`relative flex items-center gap-2 text-[10px] font-black tracking-[0.25em] transition-all hover:text-orange-500 uppercase italic ${
                location.pathname === "/admin-mate" || location.pathname === "/admin-bookings"
                  ? "text-orange-400"
                  : "text-white/30"
              }`}
            >
              <Shield size={12} />
              Admin Console
              {(location.pathname === "/admin-mate" || location.pathname === "/admin-bookings") && (
                <motion.span layoutId="nav-pill" className="absolute -bottom-2 left-0 right-0 h-[2px] bg-orange-500 shadow-[0_0_15px_#f97316]" />
              )}
            </Link>
          )}

          {isAdmin && (
            <Link
              to="/admin-support"
              className={`relative flex items-center gap-2 text-[10px] font-black tracking-[0.25em] transition-all hover:text-orange-500 uppercase italic ${
                location.pathname === "/admin-support"
                  ? "text-orange-400"
                  : "text-white/30"
              }`}
            >
              <Shield size={12} />
              Support Queue
              {location.pathname === "/admin-support" && (
                <motion.span layoutId="nav-pill" className="absolute -bottom-2 left-0 right-0 h-[2px] bg-orange-500 shadow-[0_0_15px_#f97316]" />
              )}
            </Link>
          )}

          {/* SMART BUSINESS GATEWAY */}
          <div 
            className="relative ml-4 border-l border-white/10 pl-10 flex items-center h-full"
            onMouseEnter={() => token && setIsBusinessOpen(true)}
            onMouseLeave={() => token && setIsBusinessOpen(false)}
          >
            <button 
              onClick={() => !token && navigate('/login')}
              className={`flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] italic transition-all outline-none ${isBusinessOpen ? 'text-white' : 'text-orange-500 hover:text-white'}`}
            >
              <LayoutGrid size={12}/> MY BUSINESS <ChevronDown size={10} className={`transition-transform duration-500 ${isBusinessOpen ? 'rotate-180' : ''}`}/>
            </button>
            
            <AnimatePresence>
              {token && isBusinessOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 15, scale: 0.95 }}
                  className="absolute top-[120%] -left-10 w-64 bg-[#0a0a0a]/95 border border-white/10 rounded-[32px] p-5 shadow-[0_40px_100px_rgba(0,0,0,1)] backdrop-blur-[80px] z-[99999]"
                >
                  <div className="flex flex-col gap-1.5 text-left">
                    <div className="px-3 mb-4 flex items-center justify-between">
                      <span className="text-[7px] font-black text-white/20 uppercase tracking-[0.4em] italic">Command Vault</span>
                      <Shield size={10} className="text-orange-500/50" />
                    </div>
                    {hasHotels && <Link to="/manage-stays" onClick={() => setIsBusinessOpen(false)} className="group flex justify-between p-3 rounded-2xl hover:bg-white/5 transition-all"><span className="text-[9px] font-black text-white/50 group-hover:text-orange-500 uppercase tracking-widest italic">Manage Stays</span><div className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_#f97316]" /></Link>}
                    {hasRides && <Link to="/manage-rides" onClick={() => setIsBusinessOpen(false)} className="group flex justify-between p-3 rounded-2xl hover:bg-white/5 transition-all"><span className="text-[9px] font-black text-white/50 group-hover:text-orange-500 uppercase tracking-widest italic">Manage Rides</span><div className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_#f97316]" /></Link>}
                    <div className="h-px bg-white/5 my-3 mx-2" />
                    <Link to="/add-hotel" className="flex items-center gap-3 p-3 text-orange-500 bg-orange-500/5 hover:bg-orange-500/10 rounded-2xl text-[9px] font-black uppercase tracking-widest italic border border-orange-500/10"><PlusCircle size={14}/> List New Stay</Link>
                    <Link to="/add-transport" className="flex items-center gap-3 p-3 text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:brightness-110 rounded-2xl text-[9px] font-black uppercase tracking-widest italic shadow-lg mt-1"><Car size={14}/> Offer New Ride</Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* RIGHT ACTION BAR */}
        <div className="flex items-center gap-4">
          {isAdmin && (
            <Link
              to="/admin-mate"
              className="hidden xl:flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/8 px-4 py-3 text-[9px] font-black uppercase tracking-[0.24em] text-orange-300 transition-all hover:bg-orange-500/14 hover:text-white"
            >
              <Shield size={12} />
              Admin
            </Link>
          )}
          {token ? (
            <div className="flex items-center gap-5">
              <Link to="/profile" className="w-10 h-10 rounded-full p-[2.5px] bg-gradient-to-tr from-orange-500 via-amber-400 to-white shadow-2xl hover:scale-110 transition-transform">
                <div className="w-full h-full rounded-full bg-[#0a0a0a] flex items-center justify-center font-black text-orange-500 uppercase text-[12px] italic">{user.email?.charAt(0)}</div>
              </Link>
              <button onClick={() => { signOut(); navigate("/login"); }} className="text-white/20 hover:text-red-500 transition-colors"><LogOut size={18}/></button>
            </div>
          ) : (
            <Link to="/login" className="bg-orange-600 hover:bg-orange-500 text-white px-7 py-3 rounded-full font-black text-[10px] tracking-widest italic shadow-lg transition-all active:scale-95">LOGIN</Link>
          )}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden text-white/50 bg-white/5 p-3 rounded-2xl border border-white/10">{mobileOpen ? <X size={20} /> : <Menu size={20} />}</button>
        </div>
      </motion.div>
    </nav>
  );
};

function App() {
  const { notification } = useNotify();
  if (!hasSupabaseEnv) return <div className="bg-black min-h-screen flex items-center justify-center text-orange-500 font-black uppercase tracking-[0.5em] text-[10px] animate-pulse italic">Establishing Uplink...</div>;

  return (
    <Router>
      <ErrorBoundary>
        <ScrollToTop />
        <div className="min-h-screen flex flex-col bg-[#050505] text-white overflow-x-hidden relative font-sans">
          <AnimatedBackground />
          <ParticlesCanvas />
          <Navbar />
          <main className="relative z-10 pt-32 flex-1">
            <Suspense fallback={<div className="h-screen flex items-center justify-center bg-black"><p className="text-orange-500 font-black animate-pulse tracking-widest uppercase italic text-[10px]">Syncing Command...</p></div>}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/explore-stays" element={<ExploreStays />} />
                <Route path="/explore-rides" element={<ExploreRides />} />
                <Route path="/ai-advisor" element={<AIAdvisor />} />
                <Route path="/add-hotel" element={ <ProtectedRoute><AddHotel /></ProtectedRoute> } />
                <Route path="/add-transport" element={ <ProtectedRoute><AddTransport /></ProtectedRoute> } />
                <Route path="/bookings" element={ <ProtectedRoute><Bookings /></ProtectedRoute> } />
                <Route path="/manage-stays" element={ <ProtectedRoute><ManageStays /></ProtectedRoute> } />
                <Route path="/manage-rides" element={ <ProtectedRoute><ManageRides /></ProtectedRoute> } />
                <Route path="/admin-mate" element={<AdminDashboard />} />
                <Route path="/admin-bookings" element={<AdminBookings />} />
                <Route path="/admin-support" element={<AdminSupport />} />
                <Route path="/login" element={<Login />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/register" element={<Register />} />
                <Route path="/register-partner" element={<RegisterPartner />} />
                <Route path="/recommendations" element={<Recommendations />} />
                <Route path="/planner" element={<Planner />} />
                <Route path="/profile" element={ <ProtectedRoute><Profile /></ProtectedRoute> } />
                <Route path="/referral" element={<Referral />} />
                <Route path="/wishlist" element={<Wishlist />} />
                <Route path="/support" element={<SupportChat />} />
                <Route path="/booking/:id/confirm" element={<BookingConfirm />} />
                <Route path="/payment/success" element={<PaymentResult ok={true} />} />
                <Route path="/payment/failure" element={<PaymentResult ok={false} />} />
              </Routes>
            </Suspense>
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
