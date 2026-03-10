import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mountain, LogOut, Settings2 } from 'lucide-react';

// Pages Import
import Explore from './pages/Explore';
import AddHotel from './pages/AddHotel';
import AddTransport from './pages/AddTransport';
import Bookings from './pages/Bookings';
import ManageRides from './pages/ManageRides';
import ManageStays from './pages/ManageStays';

// --- NAVIGATION COMPONENT ---
const Navbar = () => {
  const location = useLocation();
  
  const navItems = [
    { to: "/", label: "EXPLORE" },
    { to: "/add-hotel", label: "STAYS" },
    { to: "/add-transport", label: "RIDES" },
    { to: "/manage-stays", label: "MANAGE STAYS" },
    { to: "/manage-rides", label: "MANAGE RIDES" },
  ];

  return (
    <nav className="fixed top-0 w-full z-[1000] px-12 py-10 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
      {/* Brand Identity */}
      <div className="flex items-center gap-2">
        <div className="bg-[#0D4D2E] p-1.5 rounded-md text-white shadow-xl">
          <Mountain size={22}/>
        </div>
        <h1 className="text-white font-black tracking-tighter text-2xl uppercase italic">M-Mate</h1>
      </div>
      
      {/* Navigation Links */}
      <div className="hidden lg:flex gap-10 absolute left-1/2 -translate-x-1/2">
        {navItems.map((item) => (
          <Link 
            key={item.to} 
            to={item.to} 
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

      {/* Disconnect Button */}
      <div className="flex items-center gap-6">
        <button className="text-white/40 hover:text-white transition-all flex items-center gap-2 font-black text-[10px] tracking-widest group">
          <Settings2 size={18} className="group-hover:rotate-90 transition-transform duration-500"/>
          <LogOut size={20}/>
        </button>
      </div>
    </nav>
  );
};

// --- MAIN APP COMPONENT ---
function App() {
  return (
    <Router>
      <div className="bg-[#0a0a0a] min-h-screen font-sans selection:bg-orange-600 selection:text-white overflow-x-hidden relative">
        
        {/* Immersive Global Background */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <img 
            src="https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=2500" 
            className="w-full h-full object-cover"
            alt="Kedarnath Mountains Base"
          />
          <div className="absolute inset-0 bg-black/45 backdrop-blur-[1px]"></div>
        </div>

        <Navbar />

        {/* Content Routing */}
        <main className="relative z-10">
          <AnimatePresence mode="wait">
            <Routes key={window.location.pathname}>
              <Route path="/" element={<Explore />} />
              <Route path="/add-hotel" element={<AddHotel />} />
              <Route path="/add-transport" element={<AddTransport />} />
              <Route path="/bookings" element={<Bookings />} />
              <Route path="/manage-stays" element={<ManageStays />} />
              <Route path="/manage-rides" element={<ManageRides />} />
            </Routes>
          </AnimatePresence>
        </main>

        {/* Bottom Vignette Layer */}
        <div className="fixed bottom-0 w-full h-40 bg-gradient-to-t from-black/90 to-transparent pointer-events-none z-0"></div>
      </div>
    </Router>
  );
}

export default App;