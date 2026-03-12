import React, { useEffect, useState } from "react";
import API from "../utils/api";
import {
  MapPin,
  Phone,
  Lock,
  LogOut,
  Zap,
  Car,
  Hotel
} from "lucide-react";
import { motion } from "framer-motion";

const AdminDashboard = () => {
  const [hotels, setHotels] = useState([]);
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState("hotels");
  const [activeTab, setActiveTab] = useState("pending");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");

  const ADMIN_PASSWORD = "1234";

  // 🔹 Fetch data after login
  useEffect(() => {
    if (isAuthenticated) {
      fetchAllData();
    }
  }, [isAuthenticated]);

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
      alert("❌ ACCESS DENIED!");
      setPassword("");
    }
  };

  const handleAction = async (id, action, type) => {
  const confirmMsg = action === "rejected" ? "🚨 DELETE PERMANENTLY?" : "APPROVE?";
  if (!window.confirm(confirmMsg)) return;

  try {
    const endpoint = type === "hotels" ? "/hotel/verify" : "/transport/verify";
    const idKey = type === "hotels" ? "hotelId" : "rideId";

    await API.patch(endpoint, { [idKey]: id, action });

    fetchAllData();

    if (action === "approved") {
      setActiveTab("verified");
    }

  } catch (err) {
    console.error(err);
    alert("Action failed!");
  }
};

  const currentSet = viewMode === "hotels" ? hotels : rides;

  const filteredData = currentSet.filter(item => {
  if (activeTab === "pending") {
    return item.status !== "approved";
  }

  if (activeTab === "verified") {
    return item.status === "approved";
  }
});

  // 🔐 LOGIN SCREEN
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505] px-6 fixed inset-0 z-[2000]">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full bg-white/5 border border-white/10 p-12 rounded-[60px] text-center backdrop-blur-3xl"
        >
          <div className="bg-orange-600 w-20 h-20 rounded-[30px] flex items-center justify-center mx-auto mb-8">
            <Lock className="text-white" size={32} />
          </div>

          <h2 className="text-4xl font-black text-white uppercase italic">
            ADMIN <span className="text-orange-500">GATE</span>
          </h2>

          <form onSubmit={handleLogin} className="space-y-6 mt-8">
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 p-6 rounded-2xl text-center text-white"
            />

            <button className="w-full bg-white text-black font-black p-6 rounded-2xl hover:bg-orange-600 hover:text-white transition-all">
              UNLOCK VAULT
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070707] pt-40 px-12 pb-32">
      <div className="max-w-7xl mx-auto flex justify-between items-end mb-16">
        <div>
          <h1 className="text-7xl font-black text-white italic">
            VAULT <span className="text-orange-600">2.0</span>
          </h1>

          <p className="text-white/30 text-xs flex items-center gap-2 mt-3">
            <Zap size={14} className="text-orange-600" />
            DATABASE MANAGEMENT
          </p>
        </div>

        <button
          onClick={() => {
            setIsAuthenticated(false);
            window.location.reload();
          }}
          className="flex items-center gap-3 bg-white/5 border border-white/10 px-6 py-3 rounded-full"
        >
          <span className="text-white/40 text-xs uppercase">Logout</span>
          <LogOut size={18} className="text-white/20" />
        </button>
      </div>

      {/* SERVICE SWITCH */}
      <div className="max-w-7xl mx-auto mb-10 flex gap-6">
        <button
          onClick={() => setViewMode("hotels")}
          className={`flex items-center gap-3 px-6 py-4 rounded-full font-bold ${
            viewMode === "hotels"
              ? "bg-white text-black"
              : "text-white/40 border border-white/10"
          }`}
        >
          <Hotel size={20} /> HOTELS
        </button>

        <button
          onClick={() => setViewMode("rides")}
          className={`flex items-center gap-3 px-6 py-4 rounded-full font-bold ${
            viewMode === "rides"
              ? "bg-white text-black"
              : "text-white/40 border border-white/10"
          }`}
        >
          <Car size={20} /> RIDES
        </button>
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
      </div>

      {/* DATA */}
      <div className="grid gap-8 max-w-7xl mx-auto">
        {loading ? (
          <div className="text-white/30 text-center py-40">SYNCING...</div>
        ) : filteredData.length > 0 ? (
          filteredData.map((item) => (
            <motion.div
              key={item._id}
              className="bg-white/[0.03] border border-white/5 p-10 rounded-[40px] flex justify-between items-center"
            >
              <div className="flex gap-10 items-center">
                <img
                  src={item.images?.[0]}
                  className="w-40 h-40 object-cover rounded-xl"
                  alt=""
                />

                <div>
                  <h3 className="text-3xl font-black text-white">
                    {viewMode === "hotels"
                      ? item.hotelName
                      : item.vehicleName}
                  </h3>

                  <div className="text-white/40 text-sm flex gap-4 mt-2">
                    <span className="flex items-center gap-1">
                      <MapPin size={14} /> {item.location}
                    </span>

                    <span className="flex items-center gap-1">
                      <Phone size={14} /> {item.contactNumber}
                    </span>
                  </div>

                  <p className="text-white text-xl mt-3 font-bold">
                    ₹{item.pricePerNight || item.pricePerDay}
                  </p>
                </div>
              </div>

              {activeTab === "pending" && (
                <div className="flex gap-4">
                  <button
                    onClick={() =>
                      handleAction(item._id, "approved", viewMode)
                    }
                    className="bg-white text-black px-6 py-3 rounded-xl"
                  >
                    Approve
                  </button>

                  <button
                    onClick={() =>
                      handleAction(item._id, "rejected", viewMode)
                    }
                    className="bg-red-600 text-white px-6 py-3 rounded-xl"
                  >
                    Reject
                  </button>
                </div>
              )}
            </motion.div>
          ))
        ) : (
          <div className="text-white/20 text-center py-40">EMPTY</div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;