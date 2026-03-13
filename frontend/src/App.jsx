import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mountain, LogOut, Settings2, ShieldCheck } from 'lucide-react';
import API from './utils/api';
import { io } from "socket.io-client";
const socket = io("http://localhost:5000");
import Notification from "./components/Notification";
import { useNotify } from "./context/NotificationContext";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";

// Pages Import
import ExploreStays from './pages/ExploreStays'; 
import ExploreRides from './pages/ExploreRides'; 
import AddHotel from './pages/AddHotel';
import AddTransport from './pages/AddTransport';
import Bookings from './pages/Bookings';
import ManageRides from './pages/ManageRides';
import ManageStays from './pages/ManageStays';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import Register from './pages/Register';

// --- NAVIGATION COMPONENT ---
const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [hasListedItems, setHasListedItems] = useState(false);

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
  
  // Dynamic Nav Items Logic
  const navItems = [
    { to: "/explore-stays", label: "STAYS", isProtected: false, hide: false },
    { to: "/explore-rides", label: "RIDES", isProtected: false, hide: false },
    { to: "/add-hotel", label: "LIST STAY", isProtected: true, hide: false },
    { to: "/add-transport", label: "OFFER RIDE", isProtected: true, hide: false },
    // Manage tabs: Hide completely if no token OR no data
    { to: "/manage-stays", label: "MANAGE STAYS", isProtected: true, hide: !token || !hasListedItems },
    { to: "/manage-rides", label: "MANAGE RIDES", isProtected: true, hide: !token || !hasListedItems },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <nav className="fixed top-0 w-full z-20 px-12 py-10 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
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
      <div className="flex items-center gap-6">
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
      </div>
    </nav>
  );
};

// --- MAIN APP COMPONENT ---
function App() {
  const { notification } = useNotify();
  return (
    <Router>
      <div className="bg-[#0a0a0a] min-h-screen font-sans selection:bg-orange-600 selection:text-white overflow-x-hidden relative">
        
        <div className="fixed inset-0 z-0 pointer-events-none">
          <img 
            src="https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=2500" 
            className="w-full h-full object-cover"
            alt="Mountains"
          />
          <div className="absolute inset-0 bg-black/45 backdrop-blur-[1px]"></div>
        </div>

        {!document.querySelector('.ride-modal-open') && <Navbar />}

        <main className="relative z-10">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<ExploreStays />} />
              <Route path="/explore-stays" element={<ExploreStays />} />
              <Route path="/explore-rides" element={<ExploreRides />} />
              <Route path="/add-hotel" element={<AddHotel />} />
              <Route path="/add-transport" element={<AddTransport />} />
              <Route path="/bookings" element={<Bookings />} />
              <Route path="/manage-stays" element={<ManageStays />} />
              <Route path="/manage-rides" element={<ManageRides />} />
              <Route path="/admin-mate" element={<AdminDashboard />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Routes>
          </AnimatePresence>
        </main>

        <div className="fixed bottom-0 w-full h-40 bg-gradient-to-t from-black/90 to-transparent pointer-events-none z-0"></div>
      </div>
      <Notification notification={notification} />
    </Router>
  );
}

export default App;