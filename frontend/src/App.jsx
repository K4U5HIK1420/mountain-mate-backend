import React, { useMemo, useState, useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mountain, LogOut, Settings2, ShieldCheck, Menu, X } from 'lucide-react';
import API from './utils/api';
import Notification from "./components/Notification";
import { useNotify } from "./context/NotificationContext";
import AnimatedBackground from "./components/AnimatedBackground";
import { useAuth } from "./context/AuthContext";
import { hasSupabaseEnv } from "./utils/supabase";
import EnvBanner from "./components/EnvBanner";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";

// Lazy pages (code-splitting)
const ExploreStays = React.lazy(() => import("./pages/ExploreStays"));
const ExploreRides = React.lazy(() => import("./pages/ExploreRides"));
const AddHotel = React.lazy(() => import("./pages/AddHotel"));
const AddTransport = React.lazy(() => import("./pages/AddTransport"));
const Bookings = React.lazy(() => import("./pages/Bookings"));
const ManageRides = React.lazy(() => import("./pages/ManageRides"));
const ManageStays = React.lazy(() => import("./pages/ManageStays"));
const AdminDashboard = React.lazy(() => import("./pages/AdminDashboard"));
const Login = React.lazy(() => import("./pages/Login"));
const Register = React.lazy(() => import("./pages/Register"));

// --- NAVIGATION COMPONENT ---
const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const token = !!user;
  const [hasListedItems, setHasListedItems] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Check user content for Manage tabs (Only if logged in)
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
        const hData = hotelRes.data.data || hotelRes.data || [];
        const rData = rideRes.data.data || rideRes.data || [];
        
        if (hData.length > 0 || rData.length > 0) {
          setHasListedItems(true);
        }
      } catch (err) {
        console.log("Not a partner yet or fetch error");
      }
    };
    checkUserContent();
  }, [token]);

  // Click Handler for Protected Links
  const handleProtectedClick = (e, targetPath) => {
    if (!token) {
      e.preventDefault();
      // Redirecting to login and saving the target path to return later
      navigate('/login', { state: { from: targetPath } });
    }
  };
  
  const navItems = useMemo(() => ([
    { to: "/explore-stays", label: "STAYS", isProtected: false, hide: false },
    { to: "/explore-rides", label: "RIDES", isProtected: false, hide: false },
    { to: "/add-hotel", label: "LIST STAY", isProtected: true, hide: false },
    { to: "/add-transport", label: "OFFER RIDE", isProtected: true, hide: false },
    // Manage tabs: Hide completely if no token OR no data
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
    <nav className="fixed top-0 w-full z-20 px-5 sm:px-8 lg:px-12 py-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
      {/* Brand Identity */}
      <div className="flex items-center gap-2">
        <div className="bg-[#0D4D2E] p-1.5 rounded-md text-white shadow-xl">
          <Mountain size={22}/>
        </div>
        <h1 className="text-white font-black tracking-tighter text-2xl uppercase italic leading-none">M-Mate</h1>
      </div>
      
      {/* Navigation Links */}
      <div className="hidden lg:flex gap-10 absolute left-1/2 -translate-x-1/2">
        {navItems.filter(item => !item.hide).map((item) => (
          <Link 
            key={item.to} 
            to={item.to} 
            onClick={(e) => item.isProtected && handleProtectedClick(e, item.to)}
            className={`text-[10px] font-black tracking-[0.3em] transition-all duration-300 hover:text-orange-500 relative ${
              location.pathname === item.to ? 'text-orange-500' : 'text-white/80'
            }`}
          >
            {item.label}
            {location.pathname === item.to && (
              <motion.div 
                layoutId="navLine"
                className="absolute -bottom-2 left-0 w-full h-[2px] bg-orange-500 shadow-[0_0_10px_#f97316]"
              />
            )}
          </Link>
        ))}
      </div>

      {/* Admin & Logout Section */}
      <div className="flex items-center gap-4 sm:gap-6">
        <Link to="/admin-mate" className="text-white/20 hover:text-orange-500 transition-all flex items-center gap-2 font-black text-[9px] tracking-widest leading-none">
           <ShieldCheck size={16}/> ADMIN
        </Link>

        {token ? (
          <button onClick={handleLogout} className="text-white/40 hover:text-white transition-all flex items-center gap-2 font-black text-[10px] tracking-widest group leading-none">
            <Settings2 size={18} className="group-hover:rotate-90 transition-transform duration-500"/>
            <LogOut size={20}/>
          </button>
        ) : (
          <Link to="/login" className="text-white/40 hover:text-orange-500 font-black text-[10px] tracking-widest leading-none">LOGIN</Link>
        )}

        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className="lg:hidden inline-flex items-center justify-center w-11 h-11 rounded-full bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all active:scale-95"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/70 backdrop-blur-md"
              aria-label="Close menu overlay"
            />
            <motion.div
              initial={{ x: 24, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 24, opacity: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 35 }}
              className="lg:hidden fixed top-20 right-4 left-4 sm:left-auto sm:right-6 sm:w-[420px] bg-[#0b0b0b]/95 border border-white/10 rounded-[28px] shadow-2xl overflow-hidden"
            >
              <div className="p-6">
                <p className="text-[10px] font-black tracking-[0.5em] text-white/25 uppercase italic">
                  Navigation
                </p>
                <div className="mt-5 grid gap-2">
                  {navItems
                    .filter((item) => !item.hide)
                    .map((item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={(e) => item.isProtected && handleProtectedClick(e, item.to)}
                        className={`px-4 py-3 rounded-2xl border transition-all font-black uppercase tracking-[0.25em] text-[10px] ${
                          location.pathname === item.to
                            ? "bg-orange-600 text-white border-orange-500/40"
                            : "bg-white/5 text-white/75 border-white/10 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        {item.label}
                      </Link>
                    ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
};

const PageShell = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
};

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-7 py-5 rounded-[26px] bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl"
          >
            <div className="flex items-center gap-4">
              <div className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
              <p className="text-[10px] font-black tracking-[0.45em] uppercase text-white/60 italic">
                Loading terrain…
              </p>
            </div>
          </motion.div>
        </div>
      }
    >
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageShell><ExploreStays /></PageShell>} />
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
        </Routes>
      </AnimatePresence>
    </Suspense>
  );
};

// --- MAIN APP COMPONENT ---
function App() {
  const { notification } = useNotify();
  if (!hasSupabaseEnv) {
    return (
      <Router>
        <div className="bg-[#0a0a0a] min-h-screen font-sans selection:bg-orange-600 selection:text-white overflow-x-hidden relative">
          <AnimatedBackground />
          <EnvBanner
            title="Missing Supabase environment variables"
            lines={[
              "Your app can’t start because VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not loaded.",
              "Fix: ensure `frontend/.env` contains both variables, then fully stop and restart `npm run dev` (Vite only reads .env on startup).",
              "If you already added them, restart the dev server and hard refresh the browser (Ctrl+Shift+R).",
            ]}
          />
        </div>
      </Router>
    );
  }
  return (
    <Router>
      <div className="bg-[#0a0a0a] min-h-screen font-sans selection:bg-orange-600 selection:text-white overflow-x-hidden relative">

        <AnimatedBackground />
        <Navbar />

        <main className="relative z-10">
          <AnimatedRoutes />
        </main>

        <div className="fixed bottom-0 w-full h-40 bg-gradient-to-t from-black/90 to-transparent pointer-events-none z-0"></div>
      </div>
      <Notification notification={notification} />
    </Router>
  );
}

export default App;