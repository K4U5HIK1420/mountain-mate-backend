import React, { useEffect, useState } from "react";
import API from "../utils/api";
import {MapPin, Phone, Lock, LogOut, Zap, Car, Hotel, X, Info, Users, IndianRupee, Navigation, User} from "lucide-react";
import { io } from "socket.io-client";
const socket = io("http://localhost:5000");
import { useNotify } from "../context/NotificationContext";
import { motion, AnimatePresence } from "framer-motion";

const AdminDashboard = () => {

  const { notify } = useNotify();
  const [hotels, setHotels] = useState([]);
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState("hotels");
  const [activeTab, setActiveTab] = useState("pending");
  const [notification, setNotification] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  
  // Modal State
  const [selectedItem, setSelectedItem] = useState(null);

  const ADMIN_PASSWORD = "1234";

  useEffect(() => {
    if (isAuthenticated) { fetchAllData(); }
  }, [isAuthenticated]);

  useEffect(() => {

    socket.on("driverBookingNotification", (data) => {

      console.log("🚗 New booking received:", data);

      setNotification({
        vehicle: data.vehicle,
        seatsBooked: data.seatsBooked,
        seatsRemaining: data.seatsRemaining
      });

      // auto hide after 5 seconds
      setTimeout(() => {
        setNotification(null);
      }, 5000);

    });

    return () => {
    socket.off("driverBookingNotification");
  };

}, []);

  const fetchAllData = async () => {

  setLoading(true);

  try {

    // Fetch hotels
    const hotelRes = await API.get("/hotel/admin/all");

    const hotelData = Array.isArray(hotelRes.data)
      ? hotelRes.data
      : hotelRes.data.data || [];

    setHotels(hotelData);

    // Fetch rides
    try {

      const rideRes = await API.get("/transport/admin/all");

      const rideData = Array.isArray(rideRes.data)
        ? rideRes.data
        : rideRes.data.data || [];

      setRides(rideData);

    } catch (rideError) {

      console.warn("Ride API not available yet");
      setRides([]);

    }

  } catch (err) {

    console.error("Hotel fetch failed:", err);

  } finally {

    setLoading(false);

  }

};

  const handleLogin = (e) => {
    e.preventDefault();

    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
    } else {
      notify("❌ ACCESS DENIED!", "error");
      setPassword("");
    }
  };

  const handleAction = async (id, action, type) => {

  if (action === "rejected" && confirmDeleteId !== id) {
    setConfirmDeleteId(id);

    notify("🚨 Click REJECT again to permanently delete", "warning");

    return; // STOP here so it does not delete yet
  }

  try {

    const endpoint =
      type === "hotels"
        ? "/hotel/verify"
        : "/transport/verify";

    const idKey =
      type === "hotels"
        ? "hotelId"
        : "rideId";

    await API.patch(endpoint, { [idKey]: id, action });

    notify(
      action === "approved"
        ? "✅ Submission Approved"
        : "🚨 Submission Deleted",
      action === "approved" ? "success" : "error"
    );

    setConfirmDeleteId(null);
    setSelectedItem(null);
    fetchAllData();

  } catch (err) {

    console.error(err);
    notify("Action failed!", "error");

  }

};
  const currentSet = viewMode === "hotels" ? hotels : rides;
  const filteredData = currentSet.filter(item => 
    activeTab === "pending" ? item.status !== "approved" : item.status === "approved"
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505] px-6 fixed inset-0 z-[2000]">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md w-full bg-white/5 border border-white/10 p-12 rounded-[60px] text-center backdrop-blur-3xl">
          <div className="bg-orange-600 w-20 h-20 rounded-[30px] flex items-center justify-center mx-auto mb-8"><Lock className="text-white" size={32} /></div>
          <h2 className="text-4xl font-black text-white uppercase italic text-glow">ADMIN <span className="text-orange-500">GATE</span></h2>
          <form onSubmit={handleLogin} className="space-y-6 mt-8">
            <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-white/5 border border-white/10 p-6 rounded-2xl text-center text-white outline-none focus:border-orange-500" />
            <button className="w-full bg-white text-black font-black p-6 rounded-2xl hover:bg-orange-600 hover:text-white transition-all">UNLOCK VAULT</button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070707] pt-40 px-12 pb-32 selection:bg-orange-500">
      {/* HEADER SECTION */}
      <div className="max-w-7xl mx-auto flex justify-between items-end mb-16">
        <div>
          <h1 className="text-7xl font-black text-white italic">VAULT <span className="text-orange-600">2.0</span></h1>
          <p className="text-white/30 text-xs flex items-center gap-2 mt-3 uppercase tracking-widest"><Zap size={14} className="text-orange-600" /> Secure Database Management</p>
        </div>
        <button onClick={() => { setIsAuthenticated(false); window.location.reload(); }} className="flex items-center gap-3 bg-white/5 border border-white/10 px-6 py-3 rounded-full hover:bg-red-600 group transition-all">
          <span className="text-white/40 text-[10px] font-black group-hover:text-white">LOGOUT</span>
          <LogOut size={18} className="text-white/20 group-hover:text-white" />
        </button>
      </div>

      {/* TABS & SWITCHES */}
      <div className="max-w-7xl mx-auto mb-10 flex flex-wrap gap-6 justify-between">
        <div className="flex gap-4">
          <button onClick={() => setViewMode("hotels")} className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-xs tracking-widest transition-all ${viewMode === "hotels" ? "bg-white text-black" : "bg-white/5 text-white/40 border border-white/10"}`}><Hotel size={18} /> HOTELS</button>
          <button onClick={() => setViewMode("rides")} className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-xs tracking-widest transition-all ${viewMode === "rides" ? "bg-white text-black" : "bg-white/5 text-white/40 border border-white/10"}`}><Car size={18} /> RIDES</button>
        </div>
        <div className="flex gap-2 p-1 bg-white/5 rounded-2xl border border-white/10">
          <button onClick={() => setActiveTab("pending")} className={`px-8 py-3 rounded-xl font-black text-[10px] tracking-[0.2em] transition-all ${activeTab === "pending" ? "bg-orange-600 text-white shadow-lg" : "text-white/20 hover:text-white"}`}>PENDING</button>
          <button onClick={() => setActiveTab("verified")} className={`px-8 py-3 rounded-xl font-black text-[10px] tracking-[0.2em] transition-all ${activeTab === "verified" ? "bg-green-600 text-white shadow-lg" : "text-white/20 hover:text-white"}`}>VERIFIED</button>
        </div>
      </div>

      {/* TABS */}
      <div className="max-w-7xl mx-auto mb-12 flex gap-4">
        <button
          onClick={() => setActiveTab("pending")}
          className={`px-8 py-3 rounded-full ${
            activeTab === "pending" ? "bg-orange-600 text-white" : "text-white/40"
          }`}
        >
          PENDING
        </button>

        <button
          onClick={() => setActiveTab("verified")}
          className={`px-8 py-3 rounded-full ${
            activeTab === "verified" ? "bg-green-600 text-white" : "text-white/40"
          }`}
        >
          VERIFIED
        </button>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`fixed top-6 right-6 p-6 rounded-2xl shadow-xl z-[5000] ${
                notification.type === "warning"
                  ? "bg-orange-600 text-white border border-orange-400"
                  : notification.type === "error"
                  ? "bg-red-600 text-white border border-red-400"
                  : notification.type === "success"
                  ? "bg-green-600 text-white border border-green-400"
                  : "bg-zinc-900 text-white border border-white/10"
              }`}
          >

          <h3 className="text-white font-bold text-lg mb-2">
            🚗 New Ride Booking
          </h3>

          <p className="text-white/70 text-sm">
            Vehicle: <span className="text-white">{notification.vehicle}</span>
          </p>

          <p className="text-white/70 text-sm">
            Seats Booked: <span className="text-orange-500">{notification.seatsBooked}</span>
          </p>

          <p className="text-white/70 text-sm">
            Seats Remaining: <span className="text-green-500">{notification.seatsRemaining}</span>
          </p>

          </motion.div>
        )}
      </div>

      {/* DATA */}
      <div className="grid gap-8 max-w-7xl mx-auto">
        {loading ? (
          <div className="text-white/10 text-center py-40 animate-pulse font-black tracking-[1em]">SYNCING...</div>
        ) : filteredData.length > 0 ? (
          filteredData.map((item) => (
            <motion.div layout key={item._id} onClick={() => setSelectedItem(item)} className="group bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 p-8 rounded-[40px] flex justify-between items-center cursor-pointer transition-all">
              <div className="flex gap-10 items-center">
                <div className="relative overflow-hidden w-32 h-32 rounded-3xl">
                  <img src={item.images?.[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-white italic tracking-tighter">{viewMode === "hotels" ? item.hotelName : item.vehicleName}</h3>
                  <div className="text-white/30 text-[10px] font-bold flex gap-6 mt-2 uppercase tracking-widest">
                    <span className="flex items-center gap-2"><MapPin size={12} className="text-orange-500" /> {item.location || item.routeFrom}</span>
                    <span className="flex items-center gap-2"><Phone size={12} className="text-orange-500" /> {item.contactNumber}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-12">
                 <p className="text-white text-4xl font-black italic">₹{item.pricePerNight || item.pricePerSeat || item.pricePerDay}</p>
                 <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-white/20 group-hover:border-orange-500 group-hover:text-orange-500 transition-all"><Zap size={20} /></div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-white/10 text-center py-40 font-black tracking-[1em]">EMPTY VAULT</div>
        )}
      </div>

      {/* DETAIL MODAL */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-[3000] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedItem(null)} className="absolute inset-0 bg-black/90 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="relative w-full max-w-4xl bg-[#111] border border-white/10 rounded-[50px] overflow-hidden shadow-2xl">
              <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="h-full bg-zinc-900">
                   <img src={selectedItem.images?.[0]} className="w-full h-full object-cover" alt="" />
                </div>
                <div className="p-12 space-y-8">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-orange-500 text-[10px] font-black tracking-[0.3em] uppercase">{viewMode === "hotels" ? "Property Submission" : "Vehicle Submission"}</span>
                      <h2 className="text-4xl font-black text-white italic tracking-tighter mt-1">{viewMode === "hotels" ? selectedItem.hotelName : selectedItem.vehicleName}</h2>
                    </div>
                    <button onClick={() => setSelectedItem(null)} className="p-2 bg-white/5 rounded-full text-white/40 hover:text-white"><X size={20}/></button>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Contact Person</p>
                      <p className="text-white font-bold flex items-center gap-2"><User size={14} className="text-orange-500"/> {selectedItem.driverName || selectedItem.ownerName || "Staff"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Phone Number</p>
                      <p className="text-white font-bold flex items-center gap-2"><Phone size={14} className="text-orange-500"/> {selectedItem.contactNumber}</p>
                    </div>
                    {viewMode === "rides" ? (
                      <>
                        <div className="space-y-1">
                          <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Route From</p>
                          <p className="text-white font-bold flex items-center gap-2"><MapPin size={14} className="text-orange-500"/> {selectedItem.routeFrom}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Route To</p>
                          <p className="text-white font-bold flex items-center gap-2"><Navigation size={14} className="text-orange-500"/> {selectedItem.routeTo}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Seats Available</p>
                          <p className="text-white font-bold flex items-center gap-2"><Users size={14} className="text-orange-500"/> {selectedItem.seatsAvailable} Seats</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="space-y-1">
                          <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Landmark</p>
                          <p className="text-white font-bold flex items-center gap-2"><MapPin size={14} className="text-orange-500"/> {selectedItem.landmark || "N/A"}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Total Rooms</p>
                          <p className="text-white font-bold flex items-center gap-2"><Hotel size={14} className="text-orange-500"/> {selectedItem.totalRooms || selectedItem.roomsAvailable}</p>
                        </div>
                      </>
                    )}
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Base Pricing</p>
                      <p className="text-white font-black text-2xl tracking-tighter">₹{selectedItem.pricePerNight || selectedItem.pricePerSeat || selectedItem.pricePerDay}</p>
                    </div>
                  </div>

                  {activeTab === "pending" && (
                    <div className="flex gap-4 pt-6 border-t border-white/5">
                      <button onClick={() => handleAction(selectedItem._id, "approved", viewMode)} className="flex-1 bg-white text-black font-black p-5 rounded-2xl hover:bg-orange-600 hover:text-white transition-all">APPROVE DATA</button>
                      <button onClick={() => handleAction(selectedItem._id, "rejected", viewMode)} className="flex-1 bg-red-600/10 text-red-600 border border-red-600/20 font-black p-5 rounded-2xl hover:bg-red-600 hover:text-white transition-all">REJECT</button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;