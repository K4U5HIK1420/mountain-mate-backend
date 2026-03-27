import React, { useMemo, useState, useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mountain, LogOut, Menu, X, Sparkles, PlusCircle, Car, LayoutGrid, ChevronDown, Shield, Bell } from 'lucide-react';

// --- CORE UTILS & CONTEXT ---
import API from './utils/api';
import { useNotify } from "./context/NotificationContext";
import { useAuth } from "./context/AuthContext";
import { useTheme } from "./context/ThemeContext";
import { hasSupabaseEnv } from "./utils/supabase";
import socket from "./utils/socket";

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

const RefreshRedirect = () => {
  const location = useLocation();

  useEffect(() => {
    const navEntries = window.performance?.getEntriesByType?.("navigation") || [];
    const navType = navEntries[0]?.type;
    const legacyNavType = window.performance?.navigation?.type;
    const isReload = navType === "reload" || legacyNavType === 1;

    if (isReload && location.pathname !== "/") {
      window.location.replace("/");
    }
  }, [location.pathname]);

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

// --- PREMIUM NAVBAR ---
const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { notify } = useNotify();
  const { isDark, toggle: toggleTheme } = useTheme();
  const token = !!user;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isBusinessOpen, setIsBusinessOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  
  const [hasHotels, setHasHotels] = useState(false);
  const [hasRides, setHasRides] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

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
    if (!token || !user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    let active = true;

    const loadNotifications = async () => {
      try {
        const res = await API.get("/notifications");
        if (!active) return;
        setNotifications(res.data?.data || []);
        setUnreadCount(res.data?.unreadCount || 0);
      } catch (_err) {
        if (!active) return;
        setNotifications([]);
        setUnreadCount(0);
      }
    };

    socket.emit("join:user", user.id || user._id);

    const handleNewNotification = (item) => {
      if (!active) return;
      setNotifications((prev) => [item, ...prev].slice(0, 20));
      setUnreadCount((prev) => prev + 1);
      notify(item.title || item.message, item.type?.includes("declined") ? "error" : "success");
    };

    loadNotifications();
    const intervalId = window.setInterval(loadNotifications, 15000);
    socket.on("notification:new", handleNewNotification);

    return () => {
      active = false;
      window.clearInterval(intervalId);
      socket.off("notification:new", handleNewNotification);
    };
  }, [token, user, notify]);

  const openNotifications = async () => {
    setNotificationOpen((prev) => !prev);
    if (unreadCount > 0) {
      setUnreadCount(0);
      try {
        await API.patch("/notifications/read");
      } catch (_err) {
        // Keep UI responsive even if read sync fails.
      }
    }
  };

  // ✅ ONLY CORE SERVICES IN NAVBAR
  const navLinks = useMemo(() => [
    { to: "/explore-stays", label: "STAYS" },
    { to: "/explore-rides", label: "RIDES" },
  ], []);

  return (
    <nav className="fixed top-0 w-full z-[9999] px-3 py-3 sm:px-6 lg:px-10 pointer-events-none">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`pointer-events-auto mx-auto max-w-7xl rounded-[32px] border border-white/10 px-4 py-3 shadow-2xl transition-all duration-700 sm:px-6 ${isDark ? 'bg-black/45 backdrop-blur-[40px]' : 'bg-white/60 backdrop-blur-md'}`}
      >
        <div className="flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 p-2.5 text-white shadow-xl transition-transform group-hover:rotate-6">
              <Mountain size={20}/>
            </div>
            <div className="flex flex-col text-left">
              <h1 className="font-black tracking-tighter text-lg uppercase italic leading-none text-white sm:text-xl">M-Mate</h1>
              <span className="mt-1 text-[7px] font-bold uppercase tracking-[0.3em] text-orange-500">Uttarakhand</span>
            </div>
          </Link>

          <div className="hidden xl:flex flex-1 items-center justify-center gap-10">
            {navLinks.map((item) => (
              <Link 
                key={item.to} 
                to={item.to}
                className={`relative flex items-center gap-1.5 text-[10px] font-black tracking-[0.25em] uppercase italic transition-all hover:text-orange-500 ${location.pathname === item.to ? 'text-orange-400' : 'text-white/30'}`}
              >
                {item.label}
                {location.pathname === item.to && (
                  <motion.span layoutId="nav-pill" className="absolute -bottom-2 left-0 right-0 h-[2px] bg-orange-500 shadow-[0_0_15px_#f97316]" />
                )}
              </Link>
            ))}

            <div 
              className="relative ml-2 flex items-center border-l border-white/10 pl-8"
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
                    className="absolute top-[120%] -left-10 z-[99999] w-64 rounded-[32px] border border-white/10 bg-[#0a0a0a]/95 p-5 shadow-[0_40px_100px_rgba(0,0,0,1)] backdrop-blur-[80px]"
                  >
                    <div className="flex flex-col gap-1.5 text-left">
                      <div className="mb-4 flex items-center justify-between px-3">
                        <span className="text-[7px] font-black uppercase tracking-[0.4em] text-white/20 italic">Command Vault</span>
                        <Shield size={10} className="text-orange-500/50" />
                      </div>
                      {hasHotels && <Link to="/manage-stays" onClick={() => setIsBusinessOpen(false)} className="group flex justify-between rounded-2xl p-3 transition-all hover:bg-white/5"><span className="text-[9px] font-black uppercase tracking-widest text-white/50 italic group-hover:text-orange-500">Manage Stays</span><div className="h-1.5 w-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_#f97316]" /></Link>}
                      {hasRides && <Link to="/manage-rides" onClick={() => setIsBusinessOpen(false)} className="group flex justify-between rounded-2xl p-3 transition-all hover:bg-white/5"><span className="text-[9px] font-black uppercase tracking-widest text-white/50 italic group-hover:text-orange-500">Manage Rides</span><div className="h-1.5 w-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_#f97316]" /></Link>}
                      <div className="mx-2 my-3 h-px bg-white/5" />
                      <Link to="/add-hotel" className="flex items-center gap-3 rounded-2xl border border-orange-500/10 bg-orange-500/5 p-3 text-[9px] font-black uppercase tracking-widest text-orange-500 italic hover:bg-orange-500/10"><PlusCircle size={14}/> List New Stay</Link>
                      <Link to="/add-transport" className="mt-1 flex items-center gap-3 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 p-3 text-[9px] font-black uppercase tracking-widest text-white italic shadow-lg hover:brightness-110"><Car size={14}/> Offer New Ride</Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <button onClick={toggleTheme} className="hidden h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/40 transition-all hover:bg-white/5 hover:text-white sm:flex"><Sparkles size={16}/></button>
          {token ? (
            <div className="flex items-center gap-5">
              <div className="relative">
                <button onClick={openNotifications} className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/55 transition-all hover:bg-white/5 hover:text-white">
                  <Bell size={16} />
                  {unreadCount > 0 && <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-orange-500 px-1.5 py-0.5 text-center text-[9px] font-black text-white">{Math.min(unreadCount, 9)}+</span>}
                </button>
                <AnimatePresence>
                  {notificationOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.98 }}
                      className="absolute right-0 top-[120%] z-[99999] w-[340px] rounded-[28px] border border-white/10 bg-[#0a0a0a]/95 p-4 shadow-[0_30px_90px_rgba(0,0,0,0.55)] backdrop-blur-[60px]"
                    >
                      <div className="mb-3 flex items-center justify-between px-2">
                        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-orange-300">Booking Alerts</p>
                        <Link to="/bookings" onClick={() => setNotificationOpen(false)} className="text-[9px] font-black uppercase tracking-[0.24em] text-white/45 hover:text-white">Open</Link>
                      </div>
                      <div className="space-y-3">
                        {notifications.length === 0 ? (
                          <div className="rounded-[22px] border border-white/10 bg-white/5 px-4 py-5 text-[11px] text-white/45">No alerts yet.</div>
                        ) : (
                          notifications.slice(0, 5).map((item) => (
                            <div key={item._id} className="rounded-[22px] border border-white/10 bg-white/5 px-4 py-4">
                              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white">{item.title}</p>
                              <p className="mt-2 text-xs leading-6 text-white/60">{item.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
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
        </div>
      </motion.div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className={`pointer-events-auto mx-auto mt-3 max-w-7xl rounded-[28px] border border-white/10 p-4 shadow-2xl ${isDark ? 'bg-black/85 backdrop-blur-[40px]' : 'bg-white/85 backdrop-blur-md'}`}
          >
            <div className="grid gap-3">
              {navLinks.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={`rounded-[20px] border px-4 py-4 text-[10px] font-black uppercase tracking-[0.28em] italic transition-all ${location.pathname === item.to ? 'border-orange-500/30 bg-orange-500/10 text-orange-300' : 'border-white/10 bg-white/5 text-white/70 hover:text-white'}`}
                >
                  {item.label}
                </Link>
              ))}
              {token && (
                <>
                  {hasHotels && <Link to="/manage-stays" onClick={() => setMobileOpen(false)} className="rounded-[20px] border border-white/10 bg-white/5 px-4 py-4 text-[10px] font-black uppercase tracking-[0.28em] text-white/70 italic">Manage Stays</Link>}
                  {hasRides && <Link to="/manage-rides" onClick={() => setMobileOpen(false)} className="rounded-[20px] border border-white/10 bg-white/5 px-4 py-4 text-[10px] font-black uppercase tracking-[0.28em] text-white/70 italic">Manage Rides</Link>}
                  <Link to="/add-hotel" onClick={() => setMobileOpen(false)} className="rounded-[20px] border border-orange-500/20 bg-orange-500/10 px-4 py-4 text-[10px] font-black uppercase tracking-[0.28em] text-orange-300 italic">List New Stay</Link>
                  <Link to="/add-transport" onClick={() => setMobileOpen(false)} className="rounded-[20px] bg-gradient-to-r from-orange-600 to-amber-600 px-4 py-4 text-[10px] font-black uppercase tracking-[0.28em] text-white italic">Offer New Ride</Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

function App() {
  const { notification } = useNotify();
  if (!hasSupabaseEnv) return <div className="bg-black min-h-screen flex items-center justify-center text-orange-500 font-black uppercase tracking-[0.5em] text-[10px] animate-pulse italic">Establishing Uplink...</div>;

  return (
    <Router>
      <ErrorBoundary>
        <div className="min-h-screen flex flex-col bg-[#050505] text-white overflow-x-hidden relative font-sans">
          <AnimatedBackground />
          <ParticlesCanvas />
          <RefreshRedirect />
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
                <Route path="/login" element={<Login />} />
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
