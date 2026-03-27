<<<<<<< HEAD
import React, { useState, useEffect } from 'react';
import API from "../utils/api";
import {
  MapPin, Phone, Lock, LogOut, Zap, Car, Hotel, X, Info, Users, 
  IndianRupee, Navigation, User, ShieldCheck, Activity, Database, AlertCircle, Trash2, CheckCircle, LayoutDashboard
} from "lucide-react";
import socket from "../utils/socket";
import { useNotify } from "../context/NotificationContext";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
// ✅ Dashboard Import kiya
import Dashboard from "./Dashboard"; 

const AdminDashboard = () => {
  const { notify } = useNotify();
  const { loading: authLoading, user, signOut } = useAuth();
  const [hotels, setHotels] = useState([]);
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [viewMode, setViewMode] = useState("hotels");
  const [activeTab, setActiveTab] = useState("pending");
  const [notification, setNotification] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setAccessDenied(true);
      return;
    }
    fetchAllData();
  }, [authLoading, user]);

  useEffect(() => {
    socket.on("driverBookingNotification", (data) => {
      setNotification({
        vehicle: data.vehicle,
        seatsBooked: data.seatsBooked,
        seatsRemaining: data.seatsRemaining
      });
      setTimeout(() => setNotification(null), 5000);
    });
    return () => socket.off("driverBookingNotification");
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    setAccessDenied(false);
    try {
      const hotelRes = await API.get("/hotel/admin/all");
      setHotels(hotelRes.data.data || hotelRes.data || []);
      try {
        const rideRes = await API.get("/transport/admin/all");
        setRides(rideRes.data.data || rideRes.data || []);
      } catch (err) { setRides([]); }
    } catch (err) {
      if ([401, 403].includes(err?.response?.status)) {
        setAccessDenied(true);
      }
    }
    finally { setLoading(false); }
  };

  const handleLogout = async () => {
    await signOut();
    window.location.href = "/login";
  };

  const handleAction = async (id, action, type) => {
    if (action === "rejected" && confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      notify("🚨 Click REJECT again to permanently delete", "warning");
      return;
    }
    try {
      const endpoint = type === "hotels" ? "/hotel/verify" : "/transport/verify";
      const idKey = type === "hotels" ? "hotelId" : "rideId";
      await API.patch(endpoint, { [idKey]: id, action });
      notify(action === "approved" ? "✅ ENTRY VERIFIED" : "🚨 ENTRY PURGED", action === "approved" ? "success" : "error");
      setConfirmDeleteId(null);
      setSelectedItem(null);
      fetchAllData();
    } catch (err) { notify("Protocol Failed", "error"); }
  };

  const currentSet = viewMode === "hotels" ? hotels : rides;
  const filteredData = currentSet.filter(item => 
    activeTab === "pending" ? item.status !== "approved" : item.status === "approved"
  );

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505] pt-32 px-6">
        <div className="text-orange-500 font-black tracking-[0.5em] uppercase text-[10px] animate-pulse italic">Accessing Central Core...</div>
      </div>
    );
  }

  if (!user || accessDenied) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505] px-6 pt-32 pb-24">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md w-full bg-white/[0.02] border border-white/10 p-12 rounded-[50px] text-center backdrop-blur-3xl shadow-3xl">
          <div className="bg-orange-600 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-10 shadow-2xl">
            <Lock className="text-white" size={32} />
          </div>
          <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">SENTINEL <span className="text-orange-500">VAULT.</span></h2>
          <p className="text-white/20 text-[9px] font-black uppercase tracking-[0.5em] mt-4 mb-10 italic">High-Level Clearance Required</p>
          <a href="/login" className="block w-full bg-white text-black font-black p-6 rounded-2xl hover:bg-orange-600 hover:text-white transition-all uppercase text-xs tracking-widest shadow-xl">Re-establish Uplink</a>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] pt-32 px-4 md:px-12 pb-32 text-white">
      
      {/* --- SECTION 1: GLOBAL DASHBOARD (OVERVIEW) --- */}
      <div className="max-w-7xl mx-auto mb-24">
        <div className="flex items-center gap-4 mb-10 border-l-4 border-orange-600 pl-6">
          <h2 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter text-white">
            System <span className="text-orange-600">Overview.</span>
          </h2>
          <LayoutDashboard className="text-white/10" size={28} />
        </div>
        
        {/* Isme Dashboard render ho raha hai */}
        <div className="bg-white/[0.02] border border-white/5 rounded-[50px] p-2 md:p-8 backdrop-blur-3xl shadow-inner">
           <Dashboard isCompact={true} /> 
        </div>
      </div>

      {/* --- SECTION 2: MANAGEMENT HUB --- */}
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-8">
          <div>
            <h2 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase leading-none text-white">
              Data <span className="text-orange-600/50">Streams.</span>
            </h2>
            <p className="text-white/30 text-[9px] flex items-center gap-3 mt-4 uppercase tracking-[0.4em] font-bold italic">
              <Activity size={14} className="text-orange-500 animate-pulse" /> Managing {filteredData.length} Live Assets
            </p>
          </div>
          
          <button onClick={handleLogout} className="flex items-center gap-3 bg-white/5 border border-white/10 px-8 py-4 rounded-full hover:bg-red-600/20 hover:text-red-500 hover:border-red-600/30 transition-all group">
            <span className="text-[10px] font-black tracking-widest">PURGE SESSION</span>
            <LogOut size={18} className="text-white/20 group-hover:text-red-500" />
          </button>
        </div>

        {/* Command Bar */}
        <div className="mb-12 flex flex-wrap gap-4 justify-between items-center bg-white/[0.02] p-3 rounded-[35px] border border-white/5 backdrop-blur-3xl shadow-2xl">
          <div className="flex gap-2 p-1.5 bg-black/40 rounded-2xl border border-white/5 w-full md:w-auto">
            <button onClick={() => setViewMode("hotels")} className={`flex-1 md:flex-none flex items-center justify-center gap-3 px-8 py-3 rounded-xl font-black text-[10px] tracking-widest transition-all ${viewMode === "hotels" ? "bg-white text-black shadow-lg" : "text-white/30 hover:text-white"}`}><Hotel size={14} /> STAYS</button>
            <button onClick={() => setViewMode("rides")} className={`flex-1 md:flex-none flex items-center justify-center gap-3 px-8 py-3 rounded-xl font-black text-[10px] tracking-widest transition-all ${viewMode === "rides" ? "bg-white text-black shadow-lg" : "text-white/30 hover:text-white"}`}><Car size={14} /> RIDES</button>
          </div>
          
          <div className="flex gap-2 w-full md:w-auto">
            <button onClick={() => setActiveTab("pending")} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-black text-[9px] tracking-widest transition-all ${activeTab === "pending" ? "bg-orange-600 text-white" : "bg-white/5 text-white/20 hover:text-white"}`}>
                PENDING
            </button>
            <button onClick={() => setActiveTab("verified")} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-black text-[9px] tracking-widest transition-all ${activeTab === "verified" ? "bg-green-600 text-white" : "bg-white/5 text-white/20 hover:text-white"}`}>
                ARCHIVE
            </button>
          </div>
        </div>

        {/* Assets List */}
        <div className="grid gap-4">
          {loading ? (
            <div className="text-white/5 text-center py-40 animate-pulse font-black tracking-[1.5em] text-2xl uppercase">Synchronizing Stream...</div>
          ) : filteredData.length > 0 ? (
            filteredData.map((item) => (
              <motion.div layout key={item._id} onClick={() => setSelectedItem(item)} className="group relative bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 p-6 md:p-8 rounded-[40px] flex flex-col md:flex-row justify-between items-center cursor-pointer transition-all duration-500 hover:border-orange-500/20">
                <div className="flex flex-col md:flex-row gap-8 items-center w-full md:w-auto">
                  <div className="relative overflow-hidden w-24 h-24 rounded-2xl bg-zinc-900 border border-white/10 shrink-0">
                    <img src={item.images?.[0]} className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all duration-700" alt="" />
                  </div>
                  <div className="text-center md:text-left space-y-2">
                    <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">{viewMode === "hotels" ? item.hotelName : item.vehicleType}</h3>
                    <div className="text-white/20 text-[8px] font-bold flex flex-wrap justify-center md:justify-start gap-4 uppercase tracking-widest">
                      <span className="flex items-center gap-2"><MapPin size={10} className="text-orange-500" /> {item.location || item.routeFrom}</span>
                      <span className="flex items-center gap-2"><Phone size={10} className="text-orange-500" /> {item.contactNumber}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-8 mt-6 md:mt-0">
                   <div className="text-right">
                      <p className="text-[7px] font-black text-white/20 uppercase tracking-widest italic mb-1">Asset Value</p>
                      <p className="text-white text-2xl font-black italic tracking-tighter leading-none">₹{item.pricePerNight || item.pricePerSeat}</p>
                   </div>
                   <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-white/10 group-hover:bg-orange-600 group-hover:text-white transition-all active:scale-90 shadow-xl"><ArrowRight size={20} /></div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-white/5 text-center py-40 font-black tracking-[1em] text-xl italic uppercase">Vault Idle: No Submissions found</div>
          )}
        </div>
      </div>

      {/* --- SENTINEL MODAL --- */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedItem(null)} className="absolute inset-0 bg-black/98 backdrop-blur-2xl" />
            <motion.div initial={{ scale: 0.95, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }} className="relative w-full max-w-6xl bg-[#0a0a0a] border border-white/10 rounded-[50px] overflow-hidden shadow-3xl flex flex-col md:flex-row h-full max-h-[85vh]">
              
              <button onClick={() => setSelectedItem(null)} className="absolute top-8 right-8 w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-white/40 hover:text-white z-50 transition-all border border-white/10"><X size={24}/></button>

              <div className="w-full md:w-1/2 relative bg-zinc-900 border-r border-white/5 overflow-hidden flex items-center justify-center">
                <img src={selectedItem.images?.[0]} className="absolute inset-0 w-full h-full object-cover opacity-20 blur-3xl" alt=""/>
                <img src={selectedItem.images?.[0]} className="relative w-full h-full object-contain z-10 p-12" alt="" />
              </div>

              <div className="flex-1 p-10 md:p-14 overflow-y-auto no-scrollbar space-y-10 bg-gradient-to-br from-[#0a0a0a] to-[#111]">
                <div className="space-y-4">
                  <span className="text-orange-500 text-[10px] font-black tracking-[0.4em] uppercase">Security Clearance Required</span>
                  <h2 className="text-5xl font-black italic tracking-tighter uppercase leading-none">{viewMode === "hotels" ? selectedItem.hotelName : selectedItem.vehicleType}</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="bg-white/5 p-6 rounded-[30px] border border-white/5 space-y-4 shadow-inner">
                      <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] flex items-center gap-2 italic"><Database size={16} className="text-orange-600"/> Metadata</p>
                      <div className="space-y-3 text-[10px] uppercase font-black text-white/70">
                         <p className="flex justify-between border-b border-white/5 pb-2"><span>Partner:</span> <span className="text-orange-500 italic">{selectedItem.driverName || selectedItem.ownerName || "Authorized Pilot"}</span></p>
                         <p className="flex justify-between border-b border-white/5 pb-2"><span>Line:</span> <span className="text-white italic">{selectedItem.contactNumber}</span></p>
                         <p className="flex justify-between"><span>Region:</span> <span className="text-white italic">{selectedItem.location || selectedItem.routeFrom}</span></p>
                      </div>
                   </div>
                   <div className="bg-white/[0.03] p-8 rounded-[30px] border border-white/5 text-center flex flex-col justify-center">
                      <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Fare Logic</p>
                      <p className="text-4xl font-black italic text-orange-500 tracking-tighter">₹{selectedItem.pricePerNight || selectedItem.pricePerSeat}</p>
                   </div>
                </div>

                <div className="space-y-4">
                   <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] italic border-l-2 border-orange-600 pl-4">Partner Narrative</p>
                   <p className="text-white/50 text-xs font-medium leading-relaxed italic uppercase">{selectedItem.description || "No descriptive narrative provided by asset partner."}</p>
                </div>

                {activeTab === "pending" ? (
                  <div className="flex flex-col sm:flex-row gap-4 pt-6">
                    <button onClick={() => handleAction(selectedItem._id, "approved", viewMode)} className="flex-1 bg-white text-black font-black py-6 rounded-[25px] uppercase text-[10px] tracking-[0.4em] hover:bg-green-600 hover:text-white transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3 italic">
                        <ShieldCheck size={18}/> AUTHORIZE
                    </button>
                    <button onClick={() => handleAction(selectedItem._id, "rejected", viewMode)} className="flex-1 bg-red-600/10 text-red-600 border border-red-600/20 font-black py-6 rounded-[25px] uppercase text-[10px] tracking-[0.4em] hover:bg-red-600 hover:text-white transition-all active:scale-95 flex items-center justify-center gap-3 italic">
                        <Trash2 size={18}/> {confirmDeleteId === selectedItem._id ? "CONFIRM" : "REJECT"}
                    </button>
                  </div>
                ) : (
                  <div className="bg-green-600/10 p-6 rounded-[25px] border border-green-600/20 flex items-center justify-center gap-4 text-green-500">
                      <CheckCircle size={20}/>
                      <p className="text-[9px] font-black uppercase tracking-[0.5em]">Live Asset Active</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="fixed bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-orange-600/20 to-transparent"></div>
    </div>
  );
};

const ArrowRight = ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
);

export default AdminDashboard;
=======
import React, { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Ban, BookOpen, Building2, Car, CheckCircle2, Crown, Database, Download, FileClock, Loader2, RefreshCw, Search, Shield, Star, Trash2, Users, WalletCards, WandSparkles } from "lucide-react";
import API from "../utils/api";
import { useNotify } from "../context/NotificationContext";
import { useAuth } from "../context/AuthContext";
import { Container } from "../components/ui/Container";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";

const PRESET_STORAGE_KEY = "mm_admin_console_presets_v1";
const SECTIONS = ["overview", "audit", "users", "userMeta", "hotels", "rides", "bookings", "trips", "reviews", "raw"];
const RAW_COLLECTIONS = ["users", "userMeta", "hotels", "rides", "bookings", "trips", "reviews", "audit"];
const META = { overview: { label: "Overview", icon: Shield }, audit: { label: "Audit", icon: FileClock }, users: { label: "Users", icon: Users }, userMeta: { label: "User Meta", icon: WalletCards }, hotels: { label: "Hotels", icon: Building2 }, rides: { label: "Rides", icon: Car }, bookings: { label: "Bookings", icon: BookOpen }, trips: { label: "Trips", icon: ArrowUpRight }, reviews: { label: "Reviews", icon: Star }, raw: { label: "Raw Ops", icon: Database } };
const COLS = { audit: [["createdAt", "When"], ["adminEmail", "Admin"], ["action", "Action"], ["targetType", "Target"], ["summary", "Summary"]], users: [["email", "Identity"], ["displayName", "Name"], ["role", "Role"], ["lastSignInAt", "Last Seen"]], userMeta: [["email", "Email"], ["displayName", "Display"], ["userId", "User Id"], ["updatedAt", "Updated"]], hotels: [["hotelName", "Stay"], ["location", "Location"], ["status", "Status"], ["pricePerNight", "Price"]], rides: [["vehicleType", "Ride"], ["routeFrom", "From"], ["routeTo", "To"], ["status", "Status"]], bookings: [["customerName", "Customer"], ["listingLabel", "Listing"], ["status", "Status"], ["paymentStatus", "Payment"]], trips: [["title", "Trip"], ["userId", "Owner"], ["status", "Status"], ["updatedAt", "Updated"]], reviews: [["customerName", "Reviewer"], ["hotelName", "Hotel"], ["rating", "Rating"], ["createdAt", "Created"]] };
const fmtDate = (v) => !v ? "--" : (Number.isNaN(new Date(v).getTime()) ? String(v) : new Date(v).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }));
const pretty = (v) => JSON.stringify(v, null, 2);

function StatCard({ title, value, sublabel, accent }) {
  return <div className="relative overflow-hidden rounded-[34px] border border-white/10 bg-white/[0.03] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)]"><div className={`absolute inset-0 bg-gradient-to-br ${accent} opacity-60`} /><div className="relative space-y-3"><p className="text-[10px] font-black uppercase tracking-[0.35em] text-white/35">{title}</p><div className="flex items-end justify-between gap-3"><p className="text-4xl font-black italic tracking-tight text-white">{value}</p><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">{sublabel}</p></div></div></div>;
}

export default function AdminDashboard() {
  const { notify } = useNotify();
  const { user, loading: authLoading } = useAuth();
  const [section, setSection] = useState("overview");
  const [rawCollection, setRawCollection] = useState("users");
  const [overview, setOverview] = useState(null);
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [rawDraft, setRawDraft] = useState("");
  const [userDraft, setUserDraft] = useState({ role: "user", displayName: "", bannedUntil: "" });
  const [confirmText, setConfirmText] = useState("");
  const [loadingSection, setLoadingSection] = useState(false);
  const [saving, setSaving] = useState(false);
  const [destroying, setDestroying] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 1 });
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [targetFilter, setTargetFilter] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");
  const [presetName, setPresetName] = useState("");
  const [savedPresets, setSavedPresets] = useState({});
  const rawMode = section === "raw";
  const auditMode = section === "audit";
  const selectedId = selected?.id || selected?._id;
  const destructiveUnlocked = confirmText === "CONFIRM";
  const currentPresetKey = rawMode ? `raw:${rawCollection}` : section;
  const columns = useMemo(() => rawMode ? Object.keys(rows[0] || {}).filter((k) => k !== "__v").slice(0, 5).map((key) => ({ key, label: key })) : (COLS[section] || []).map(([key, label]) => ({ key, label })), [rows, section, rawMode]);
  const statCards = useMemo(() => {
    const t = overview?.totals;
    if (!t) return [];
    return [{ title: "Auth Users", value: t.users, sublabel: "Supabase", accent: "from-orange-500/25 to-transparent" }, { title: "User Meta", value: t.userMeta, sublabel: "profiles", accent: "from-violet-400/20 to-transparent" }, { title: "Live Stays", value: t.hotels, sublabel: `${t.pendingHotels} pending`, accent: "from-amber-400/20 to-transparent" }, { title: "Fleet", value: t.rides, sublabel: `${t.pendingRides} pending`, accent: "from-sky-400/20 to-transparent" }, { title: "Bookings", value: t.bookings, sublabel: `${t.pendingBookings} pending`, accent: "from-emerald-400/20 to-transparent" }, { title: "Audit Logs", value: t.audits, sublabel: "history", accent: "from-cyan-400/20 to-transparent" }];
  }, [overview]);
  const bulkButtons = useMemo(() => {
    if (rawMode || auditMode || selectedIds.length === 0) return [];
    if (section === "hotels") return [{ label: "Approve", action: "approve" }, { label: "Pending", action: "pending" }, { label: "Delete", action: "delete", danger: true }];
    if (section === "rides") return [{ label: "Approve", action: "approve" }, { label: "Reject", action: "reject", danger: true }, { label: "Pending", action: "pending" }, { label: "Delete", action: "delete", danger: true }];
    if (section === "bookings") return [{ label: "Confirm", action: "set-status", payload: { status: "confirmed" } }, { label: "Cancel", action: "set-status", payload: { status: "cancelled" }, danger: true }, { label: "Paid", action: "set-payment", payload: { paymentStatus: "paid" } }, { label: "Delete", action: "delete", danger: true }];
    if (section === "trips") return [{ label: "Mark Booked", action: "set-status", payload: { status: "booked" } }, { label: "Mark Draft", action: "set-status", payload: { status: "draft" } }, { label: "Delete", action: "delete", danger: true }];
    if (section === "reviews" || section === "userMeta") return [{ label: "Delete", action: "delete", danger: true }];
    return [];
  }, [section, selectedIds, rawMode, auditMode]);

  const endpoint = (kind = section, rawKind = rawCollection) => kind === "overview" ? "/admin-console/overview" : kind === "audit" ? "/admin-console/audit" : kind === "userMeta" ? "/admin-console/user-meta" : kind === "raw" ? `/admin-console/raw/${rawKind}` : `/admin-console/${kind}`;
  const actionUrl = () => rawMode ? `/admin-console/raw/${rawCollection}/${selectedId}` : section === "userMeta" ? `/admin-console/user-meta/${selectedId}` : `/admin-console/${section}/${selectedId}`;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PRESET_STORAGE_KEY);
      setSavedPresets(raw ? JSON.parse(raw) : {});
    } catch {
      setSavedPresets({});
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(savedPresets));
    } catch {
      // Ignore storage failures
    }
  }, [savedPresets]);

  useEffect(() => { setPage(1); setSelected(null); setSelectedIds([]); setRows([]); setRawDraft(""); setConfirmText(""); setStatusFilter(""); setPaymentFilter(""); setRoleFilter(""); setActionFilter(""); setTargetFilter(""); setSortDir("desc"); setSortBy(section === "users" ? "createdAt" : "updatedAt"); }, [section, rawCollection, pageSize]);
  useEffect(() => {
    if (!selected) { setRawDraft(""); setUserDraft({ role: "user", displayName: "", bannedUntil: "" }); return; }
    setRawDraft(section === "users" ? "" : pretty(selected));
    if (section === "users") setUserDraft({ role: selected.role || "user", displayName: selected.displayName || "", bannedUntil: selected.bannedUntil || "" });
  }, [selected, section]);

  const loadOverview = async () => { const res = await API.get("/admin-console/overview"); setOverview(res.data?.data || null); };
  const loadData = async (kind = section, term = query, rawKind = rawCollection, nextPage = page, nextSize = pageSize) => {
    if (kind === "overview") return loadOverview();
    setLoadingSection(true);
    try {
      const params = {
        ...(term ? { q: term } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(paymentFilter ? { paymentStatus: paymentFilter } : {}),
        ...(roleFilter ? { role: roleFilter } : {}),
        ...(actionFilter ? { action: actionFilter } : {}),
        ...(targetFilter ? { targetType: targetFilter } : {}),
        ...(sortBy ? { sortBy } : {}),
        ...(sortDir ? { sortDir } : {}),
        page: nextPage,
        pageSize: nextSize
      };
      const res = await API.get(endpoint(kind, rawKind), { params });
      const data = (res.data?.data || []).map((item) => (kind === "reviews" ? { ...item, hotelName: item.hotelId?.hotelName || "Hotel" } : item));
      setRows(data);
      setPagination(res.data?.pagination || { page: nextPage, pageSize: nextSize, total: data.length, totalPages: 1 });
      setAccessDenied(false);
    } catch (err) {
      if ([401, 403].includes(err?.response?.status)) setAccessDenied(true);
      else notify("Unable to load admin data.", "error");
    } finally { setLoadingSection(false); }
  };
  useEffect(() => { if (!authLoading && user) { loadData(section, query, rawCollection, page, pageSize); if (section !== "overview") loadOverview(); } }, [authLoading, user, section, query, rawCollection, page, pageSize, statusFilter, paymentFilter, roleFilter, actionFilter, targetFilter, sortBy, sortDir]);

  const refreshCurrent = async () => { await loadData(section, query, rawCollection, page, pageSize); if (section !== "overview") await loadOverview(); };
  const toggleSelectedId = (id) => setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const toggleSelectAll = () => { const ids = rows.map((row) => row.id || row._id).filter(Boolean); setSelectedIds((prev) => (prev.length === ids.length ? [] : ids)); };
  const patchSelected = (partial) => { const next = { ...selected, ...partial }; setSelected(next); setRawDraft(pretty(next)); };
  const exportSection = async (format = "json") => {
    const target = rawMode ? rawCollection : section;
    try {
      const res = await API.get(`/admin-console/export/${target}`, { params: { format }, responseType: "blob" });
      const filename = (res.headers["content-disposition"] || "").match(/filename="([^"]+)"/)?.[1] || `admin-${target}.${format}`;
      const url = window.URL.createObjectURL(new Blob([res.data])); const a = document.createElement("a"); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); window.URL.revokeObjectURL(url);
      notify(`${target} exported.`, "success");
    } catch { notify("Export failed.", "error"); }
  };
  const handleSave = async () => {
    if (!selectedId || auditMode) return;
    setSaving(true);
    try {
      if (section === "users") await API.patch(`/admin-console/users/${selectedId}`, { role: userDraft.role, displayName: userDraft.displayName, bannedUntil: userDraft.bannedUntil || null });
      else await API.patch(actionUrl(), JSON.parse(rawDraft));
      notify("Admin record updated.", "success"); await refreshCurrent();
    } catch (err) { notify(err?.response?.data?.message || "Unable to save record.", "error"); } finally { setSaving(false); }
  };
  const handleDelete = async () => {
    if (!selectedId || !destructiveUnlocked || auditMode) return;
    setDestroying(true);
    try { await API.delete(actionUrl()); notify(section === "users" ? "User terminated." : "Record deleted.", "success"); setSelected(null); setConfirmText(""); await refreshCurrent(); }
    catch (err) { notify(err?.response?.data?.message || "Unable to delete record.", "error"); }
    finally { setDestroying(false); }
  };
  const handleBulk = async (item) => {
    if (item.danger && !destructiveUnlocked) return notify("Type CONFIRM before destructive bulk actions.", "warning");
    setBulkLoading(true);
    try { await API.post("/admin-console/bulk", { section, ids: selectedIds, action: item.action, payload: item.payload || {} }); notify(`Bulk action completed for ${selectedIds.length} record(s).`, "success"); setSelectedIds([]); setSelected(null); if (item.danger) setConfirmText(""); await refreshCurrent(); }
    catch (err) { notify(err?.response?.data?.message || "Bulk action failed.", "error"); }
    finally { setBulkLoading(false); }
  };
  const resetViewControls = () => {
    setQuery("");
    setStatusFilter("");
    setPaymentFilter("");
    setRoleFilter("");
    setActionFilter("");
    setTargetFilter("");
    setSortBy(section === "users" ? "createdAt" : "updatedAt");
    setSortDir("desc");
    setPage(1);
  };
  const savePreset = () => {
    const name = presetName.trim();
    if (!name) return notify("Enter a preset name first.", "warning");
    setSavedPresets((prev) => ({
      ...prev,
      [currentPresetKey]: {
        ...(prev[currentPresetKey] || {}),
        [name]: {
          query,
          statusFilter,
          paymentFilter,
          roleFilter,
          actionFilter,
          targetFilter,
          sortBy,
          sortDir,
          pageSize,
        },
      },
    }));
    setPresetName("");
    notify("View preset saved.", "success");
  };
  const applyPreset = (name) => {
    const preset = savedPresets[currentPresetKey]?.[name];
    if (!preset) return;
    setQuery(preset.query || "");
    setStatusFilter(preset.statusFilter || "");
    setPaymentFilter(preset.paymentFilter || "");
    setRoleFilter(preset.roleFilter || "");
    setActionFilter(preset.actionFilter || "");
    setTargetFilter(preset.targetFilter || "");
    setSortBy(preset.sortBy || (section === "users" ? "createdAt" : "updatedAt"));
    setSortDir(preset.sortDir || "desc");
    setPageSize(preset.pageSize || 20);
    setPage(1);
    notify(`Preset "${name}" applied.`, "success");
  };
  const deletePreset = (name) => {
    setSavedPresets((prev) => {
      const next = { ...(prev[currentPresetKey] || {}) };
      delete next[name];
      return { ...prev, [currentPresetKey]: next };
    });
    notify(`Preset "${name}" removed.`, "success");
  };
  const toggleSort = (key) => {
    if (sortBy === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDir("asc");
    }
    setPage(1);
  };

  if (authLoading) return <div className="min-h-screen bg-[#050505] pt-32"><Container className="flex min-h-[60vh] items-center justify-center"><div className="text-[10px] font-black uppercase tracking-[0.45em] text-orange-400"><Loader2 size={16} className="mr-2 inline animate-spin" />Authorizing console</div></Container></div>;
  if (!user || accessDenied) return <div className="min-h-screen bg-[#050505] pt-32 pb-24"><Container><div className="mx-auto max-w-xl rounded-[40px] border border-white/10 bg-white/[0.03] p-12 text-center shadow-[0_30px_90px_rgba(0,0,0,0.42)]"><Crown size={34} className="mx-auto text-orange-400" /><h1 className="mt-6 text-4xl font-black uppercase italic tracking-tight text-white">Admin clearance required</h1><p className="mt-4 text-sm leading-7 text-white/50">This console unlocks only when the backend confirms your Supabase admin role.</p></div></Container></div>;

  return (
    <div className="min-h-screen bg-[#050505] pb-24 pt-32 text-white">
      <Container className="space-y-8">
        <div className="grid gap-8 xl:grid-cols-[280px_1fr]">
          <div className="space-y-6 xl:sticky xl:top-32 xl:self-start">
            <div className="rounded-[34px] border border-white/10 bg-white/[0.03] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)]"><p className="text-[10px] font-black uppercase tracking-[0.35em] text-white/30">Admin workspace</p><div className="mt-5 space-y-2">{SECTIONS.map((key) => { const Icon = META[key].icon; return <button key={key} type="button" onClick={() => setSection(key)} className={`flex w-full items-center justify-between rounded-[24px] border px-4 py-4 text-left transition ${section === key ? "border-orange-500/30 bg-orange-500/10 text-white" : "border-white/6 bg-black/20 text-white/55 hover:border-white/14 hover:text-white"}`}><span className="flex items-center gap-3"><Icon size={16} className={section === key ? "text-orange-300" : "text-white/35"} /><span className="text-[11px] font-black uppercase tracking-[0.24em]">{META[key].label}</span></span><ArrowUpRight size={14} className="text-white/25" /></button>; })}</div></div>
            <div className="rounded-[34px] border border-orange-500/15 bg-gradient-to-br from-orange-500/10 to-transparent p-5"><p className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-300">Phase 3 active</p><p className="mt-4 text-sm leading-7 text-white/55">Audit history, exports, typed confirmations, and page controls are now built into the admin vault.</p></div>
          </div>

          <div className="space-y-8">
            {section === "overview" ? (
              <div className="space-y-8">
                <div className="rounded-[38px] border border-orange-500/20 bg-[linear-gradient(145deg,rgba(249,115,22,0.14),rgba(255,255,255,0.02)),rgba(8,8,8,0.95)] p-8 shadow-[0_30px_90px_rgba(0,0,0,0.42)]"><div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div className="space-y-4"><p className="text-[10px] font-black uppercase tracking-[0.45em] text-orange-300">Power Console Phase 3</p><h1 className="text-4xl font-black uppercase italic tracking-[-0.05em] text-white md:text-6xl">Safer ops and audit trail online.</h1><p className="max-w-2xl text-sm leading-7 text-white/55">Every admin mutation is now logged, exports are one click away, and destructive actions require typed confirmation.</p></div><div className="rounded-[28px] border border-white/10 bg-black/30 px-5 py-4 text-[10px] font-black uppercase tracking-[0.32em] text-white/45">Admin only surface</div></div></div>
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{statCards.map((card) => <StatCard key={card.title} {...card} />)}</div>
                <div className="rounded-[34px] border border-white/10 bg-white/[0.03] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)]"><div className="mb-6 flex items-center gap-3"><WandSparkles className="text-orange-400" size={18} /><p className="text-[10px] font-black uppercase tracking-[0.28em] text-orange-300">Phase 3 unlocks</p></div><div className="space-y-4 text-sm leading-7 text-white/55"><p>`Audit` now shows the history of admin updates, deletes, bulk actions, and exports.</p><p>All list views support pagination and export downloads.</p><p>Users now include activity summaries for partner-owned stays, rides, bookings, and trips.</p></div></div>
              </div>
            ) : (
              <div className="grid gap-8 2xl:grid-cols-[1.12fr_0.88fr]">
                <div className="overflow-hidden rounded-[34px] border border-white/10 bg-white/[0.03] shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
                  <div className="border-b border-white/10 px-6 py-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.32em] text-white/30">{META[section].label}</p><h2 className="mt-2 text-3xl font-black uppercase italic tracking-tight text-white">Live control surface</h2></div><div className="flex flex-col gap-3 sm:flex-row">{rawMode && <select value={rawCollection} onChange={(e) => setRawCollection(e.target.value)} className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-4 text-[11px] font-black uppercase tracking-[0.2em] text-white outline-none">{RAW_COLLECTIONS.map((item) => <option key={item} value={item}>{item}</option>)}</select>}<Input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder={`Search ${rawMode ? rawCollection : META[section].label.toLowerCase()}...`} leftIcon={Search} className="min-w-[220px]" />{section === "users" && <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }} className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-4 text-[11px] font-black uppercase tracking-[0.2em] text-white outline-none"><option value="">All Roles</option><option value="admin">admin</option><option value="user">user</option></select>}{["hotels","rides","trips"].includes(section) && <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-4 text-[11px] font-black uppercase tracking-[0.2em] text-white outline-none"><option value="">All Status</option><option value="pending">pending</option><option value="approved">approved</option><option value="rejected">rejected</option><option value="draft">draft</option><option value="booked">booked</option></select>}{section === "bookings" && <><select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-4 text-[11px] font-black uppercase tracking-[0.2em] text-white outline-none"><option value="">All Booking Status</option><option value="pending">pending</option><option value="confirmed">confirmed</option><option value="completed">completed</option><option value="cancelled">cancelled</option></select><select value={paymentFilter} onChange={(e) => { setPaymentFilter(e.target.value); setPage(1); }} className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-4 text-[11px] font-black uppercase tracking-[0.2em] text-white outline-none"><option value="">All Payment</option><option value="pending">pending</option><option value="paid">paid</option><option value="failed">failed</option></select></>}{section === "audit" && <><select value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(1); }} className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-4 text-[11px] font-black uppercase tracking-[0.2em] text-white outline-none"><option value="">All Actions</option><option value="update">update</option><option value="delete">delete</option><option value="bulk">bulk</option><option value="export">export</option><option value="terminate">terminate</option></select><Input value={targetFilter} onChange={(e) => { setTargetFilter(e.target.value); setPage(1); }} placeholder="Target type" className="min-w-[140px]" /></>}<select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-4 text-[11px] font-black uppercase tracking-[0.2em] text-white outline-none">{[10, 20, 50].map((size) => <option key={size} value={size}>{size} / page</option>)}</select><Button variant="ghost" size="md" onClick={refreshCurrent}><RefreshCw size={16} /> Refresh</Button><Button variant="ghost" size="md" onClick={resetViewControls}>Reset</Button>{!auditMode && <Button variant="ghost" size="md" onClick={() => exportSection("json")}><Download size={16} /> JSON</Button>}{!auditMode && <Button variant="ghost" size="md" onClick={() => exportSection("csv")}><Download size={16} /> CSV</Button>}</div></div><div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center"><Input value={presetName} onChange={(e) => setPresetName(e.target.value)} placeholder="Save current view as..." className="min-w-[220px]" /><Button variant="ghost" size="sm" onClick={savePreset}>Save Preset</Button><div className="flex flex-wrap gap-2">{Object.keys(savedPresets[currentPresetKey] || {}).map((name) => <div key={name} className="flex items-center gap-1 rounded-full border border-white/10 bg-black/20 px-2 py-1"><button type="button" onClick={() => applyPreset(name)} className="text-[10px] font-black uppercase tracking-[0.18em] text-white/70">{name}</button><button type="button" onClick={() => deletePreset(name)} className="text-[10px] text-red-400">x</button></div>)}</div></div></div>
                  {bulkButtons.length > 0 && <div className="border-b border-white/10 px-6 py-4"><div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between"><div className="flex items-center gap-4"><p className="text-[10px] font-black uppercase tracking-[0.28em] text-orange-300">{selectedIds.length} selected</p><Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="Type CONFIRM for deletes" className="min-w-[220px]" /></div><div className="flex flex-wrap gap-3">{bulkButtons.map((item) => <Button key={`${item.label}-${item.action}`} size="sm" variant={item.danger ? "danger" : "ghost"} onClick={() => handleBulk(item)} disabled={bulkLoading || (item.danger && !destructiveUnlocked)}>{bulkLoading ? <Loader2 size={14} className="animate-spin" /> : item.danger ? <Trash2 size={14} /> : <CheckCircle2 size={14} />}{item.label}</Button>)}</div></div></div>}
                  <div className="overflow-x-auto"><table className="min-w-full text-left"><thead><tr className="border-b border-white/10 text-[10px] font-black uppercase tracking-[0.28em] text-white/30">{bulkButtons.length > 0 && !rawMode && <th className="px-4 py-4"><input type="checkbox" checked={rows.length > 0 && selectedIds.length === rows.length} onChange={toggleSelectAll} /></th>}{columns.map((c) => <th key={c.key} className="px-6 py-4"><button type="button" onClick={() => toggleSort(c.key)} className="flex items-center gap-2">{c.label}{sortBy === c.key ? <span>{sortDir === "asc" ? "↑" : "↓"}</span> : null}</button></th>)}</tr></thead><tbody>{loadingSection ? <tr><td colSpan={columns.length + (bulkButtons.length > 0 && !rawMode ? 1 : 0)} className="px-6 py-12 text-center text-[10px] font-black uppercase tracking-[0.35em] text-white/35"><Loader2 size={16} className="mr-2 inline animate-spin" />Loading stream</td></tr> : rows.length === 0 ? <tr><td colSpan={columns.length + (bulkButtons.length > 0 && !rawMode ? 1 : 0)} className="px-6 py-12 text-center text-[10px] font-black uppercase tracking-[0.35em] text-white/35">No records found</td></tr> : rows.map((row) => { const id = row.id || row._id; return <tr key={id} className={`cursor-pointer border-b border-white/6 transition hover:bg-white/[0.04] ${selectedId === id ? "bg-orange-500/8" : ""}`} onClick={() => setSelected(row)}>{bulkButtons.length > 0 && !rawMode && <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={selectedIds.includes(id)} onChange={() => toggleSelectedId(id)} /></td>}{columns.map((c) => <td key={c.key} className="px-6 py-4 align-top text-sm text-white/80">{["createdAt", "updatedAt", "lastSignInAt"].includes(c.key) ? fmtDate(row[c.key]) : c.key === "pricePerNight" ? `Rs ${row[c.key] ?? 0}` : typeof row[c.key] === "object" && row[c.key] !== null ? pretty(row[c.key]).slice(0, 80) : row[c.key] ?? "--"}</td>)}</tr>; })}</tbody></table></div>
                  <div className="flex items-center justify-between border-t border-white/10 px-6 py-4 text-[10px] font-black uppercase tracking-[0.24em] text-white/35"><span>Page {pagination.page} / {pagination.totalPages} • {pagination.total} records</span><div className="flex gap-3"><Button variant="ghost" size="sm" onClick={() => setPage((p) => Math.max(p - 1, 1))} disabled={pagination.page <= 1}>Prev</Button><Button variant="ghost" size="sm" onClick={() => setPage((p) => Math.min(p + 1, pagination.totalPages || 1))} disabled={pagination.page >= pagination.totalPages}>Next</Button></div></div>
                </div>

                <div className="2xl:sticky 2xl:top-32 2xl:self-start">
                  {!selected ? <div className="rounded-[34px] border border-dashed border-white/10 bg-white/[0.02] p-8 text-center text-white/35"><Database size={28} className="mx-auto mb-4 text-orange-400/70" /><p className="text-[10px] font-black uppercase tracking-[0.32em]">Select a record</p><p className="mt-4 text-sm leading-7">Pick any row to inspect raw data, edit fields, review audit history, or take an action.</p></div> : <div className="rounded-[34px] border border-white/10 bg-white/[0.03] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)]"><div className="mb-6 flex items-start justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-300">{rawMode ? `${rawCollection} detail` : `${META[section].label} detail`}</p><h3 className="mt-2 text-2xl font-black uppercase italic tracking-tight text-white">{selected.displayName || selected.email || selected.hotelName || selected.vehicleType || selected.customerName || selected.title || selected.action || "Record"}</h3></div><div className="rounded-full border border-white/10 bg-black/30 px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/35">{selected.status || selected.role || selected.targetType || "live"}</div></div>{section === "users" ? <div className="space-y-5"><div className="rounded-[26px] border border-white/8 bg-black/20 p-5"><p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/30">Identity</p><p className="mt-3 text-sm text-white/80">{selected.email}</p><p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">{selected.id}</p><div className="mt-4 grid grid-cols-2 gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-white/45"><div>Hotels: {selected.activity?.hotels || 0}</div><div>Rides: {selected.activity?.rides || 0}</div><div>Bookings: {selected.activity?.bookings || 0}</div><div>Trips: {selected.activity?.trips || 0}</div></div></div><label className="block text-[10px] font-black uppercase tracking-[0.24em] text-white/35">Display name<input value={userDraft.displayName} onChange={(e) => setUserDraft((p) => ({ ...p, displayName: e.target.value }))} className="mt-3 w-full rounded-[24px] border border-white/10 bg-white/5 px-5 py-4 text-sm font-bold text-white outline-none focus:border-orange-500/50" /></label><label className="block text-[10px] font-black uppercase tracking-[0.24em] text-white/35">Role<select value={userDraft.role} onChange={(e) => setUserDraft((p) => ({ ...p, role: e.target.value }))} className="mt-3 w-full rounded-[24px] border border-white/10 bg-white/5 px-5 py-4 text-sm font-bold uppercase text-white outline-none"><option value="user">user</option><option value="admin">admin</option></select></label><div className="rounded-[26px] border border-white/8 bg-black/20 p-5 text-sm text-white/55"><p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/30">Auth metadata</p><pre className="mt-4 overflow-auto whitespace-pre-wrap break-all text-[12px] leading-6 text-white/55">{pretty(selected.authUser || {})}</pre></div></div> : section === "hotels" ? <div className="space-y-5"><div className="grid gap-4 md:grid-cols-2"><label className="block text-[10px] font-black uppercase tracking-[0.24em] text-white/35">Hotel name<input value={selected.hotelName || ""} onChange={(e) => patchSelected({ hotelName: e.target.value })} className="mt-3 w-full rounded-[24px] border border-white/10 bg-white/5 px-5 py-4 text-sm font-bold text-white outline-none" /></label><label className="block text-[10px] font-black uppercase tracking-[0.24em] text-white/35">Location<input value={selected.location || ""} onChange={(e) => patchSelected({ location: e.target.value })} className="mt-3 w-full rounded-[24px] border border-white/10 bg-white/5 px-5 py-4 text-sm font-bold text-white outline-none" /></label><label className="block text-[10px] font-black uppercase tracking-[0.24em] text-white/35">Price per night<input value={selected.pricePerNight || 0} onChange={(e) => patchSelected({ pricePerNight: Number(e.target.value) || 0 })} className="mt-3 w-full rounded-[24px] border border-white/10 bg-white/5 px-5 py-4 text-sm font-bold text-white outline-none" /></label><label className="block text-[10px] font-black uppercase tracking-[0.24em] text-white/35">Rooms<input value={selected.roomsAvailable || 0} onChange={(e) => patchSelected({ roomsAvailable: Number(e.target.value) || 0 })} className="mt-3 w-full rounded-[24px] border border-white/10 bg-white/5 px-5 py-4 text-sm font-bold text-white outline-none" /></label></div><div className="flex flex-wrap gap-3"><Button variant="neutral" size="sm" onClick={() => patchSelected({ status: "approved", isVerified: true })}><CheckCircle2 size={14} />Approve</Button><Button variant="ghost" size="sm" onClick={() => patchSelected({ status: "pending", isVerified: false })}><RefreshCw size={14} />Pending</Button></div><label className="block text-[10px] font-black uppercase tracking-[0.24em] text-white/35">Description<textarea value={selected.description || ""} onChange={(e) => patchSelected({ description: e.target.value })} rows={5} className="mt-3 w-full rounded-[26px] border border-white/10 bg-black/30 px-5 py-4 text-[12px] leading-6 text-white outline-none" /></label><details className="rounded-[20px] border border-white/10 bg-black/20 p-4"><summary className="cursor-pointer text-[10px] font-black uppercase tracking-[0.24em] text-white/40">Advanced JSON</summary><textarea value={rawDraft || pretty(selected)} onChange={(e) => setRawDraft(e.target.value)} rows={10} className="mt-3 w-full rounded-[20px] border border-white/10 bg-black/30 px-4 py-3 text-[12px] leading-6 text-white outline-none" /></details></div> : section === "userMeta" ? <div className="space-y-5"><div className="grid gap-4 md:grid-cols-2"><label className="block text-[10px] font-black uppercase tracking-[0.24em] text-white/35">Display name<input value={selected.displayName || ""} onChange={(e) => patchSelected({ displayName: e.target.value })} className="mt-3 w-full rounded-[24px] border border-white/10 bg-white/5 px-5 py-4 text-sm font-bold text-white outline-none" /></label><label className="block text-[10px] font-black uppercase tracking-[0.24em] text-white/35">Email<input value={selected.email || ""} onChange={(e) => patchSelected({ email: e.target.value })} className="mt-3 w-full rounded-[24px] border border-white/10 bg-white/5 px-5 py-4 text-sm font-bold text-white outline-none" /></label></div><div className="grid gap-4 md:grid-cols-2"><div className="rounded-[22px] border border-white/10 bg-black/20 px-4 py-4 text-sm text-white/70">Wishlist items: {selected.wishlistCount ?? selected.wishlist?.length ?? 0}</div><div className="rounded-[22px] border border-white/10 bg-black/20 px-4 py-4 text-sm text-white/70">Referral invites: {selected.inviteCount ?? selected.referral?.invitedUsers?.length ?? 0}</div></div><label className="block text-[10px] font-black uppercase tracking-[0.24em] text-white/35">Referral code<input value={selected.referral?.code || ""} onChange={(e) => patchSelected({ referral: { ...(selected.referral || {}), code: e.target.value } })} className="mt-3 w-full rounded-[24px] border border-white/10 bg-white/5 px-5 py-4 text-sm font-bold text-white outline-none" /></label><details className="rounded-[20px] border border-white/10 bg-black/20 p-4"><summary className="cursor-pointer text-[10px] font-black uppercase tracking-[0.24em] text-white/40">Advanced JSON</summary><textarea value={rawDraft || pretty(selected)} onChange={(e) => setRawDraft(e.target.value)} rows={10} className="mt-3 w-full rounded-[20px] border border-white/10 bg-black/30 px-4 py-3 text-[12px] leading-6 text-white outline-none" /></details></div> : <div className="space-y-5">{(section === "rides") && !rawMode && <div className="flex flex-wrap gap-3"><Button variant="neutral" size="sm" onClick={() => patchSelected({ status: "approved", isVerified: true })}><CheckCircle2 size={14} />Approve</Button><Button variant="ghost" size="sm" onClick={() => patchSelected({ status: "pending", isVerified: false })}><RefreshCw size={14} />Pending</Button><Button variant="danger" size="sm" onClick={() => patchSelected({ status: "rejected", isVerified: false })}><Ban size={14} />Reject</Button></div>}{section === "bookings" && !rawMode && <div className="grid gap-4 md:grid-cols-2"><label className="block text-[10px] font-black uppercase tracking-[0.24em] text-white/35">Booking status<select value={selected.status || "pending"} onChange={(e) => patchSelected({ status: e.target.value })} className="mt-3 w-full rounded-[24px] border border-white/10 bg-white/5 px-5 py-4 text-sm font-bold uppercase text-white outline-none">{["pending", "confirmed", "completed", "cancelled"].map((item) => <option key={item} value={item}>{item}</option>)}</select></label><label className="block text-[10px] font-black uppercase tracking-[0.24em] text-white/35">Payment status<select value={selected.paymentStatus || "pending"} onChange={(e) => patchSelected({ paymentStatus: e.target.value })} className="mt-3 w-full rounded-[24px] border border-white/10 bg-white/5 px-5 py-4 text-sm font-bold uppercase text-white outline-none">{["pending", "paid", "failed"].map((item) => <option key={item} value={item}>{item}</option>)}</select></label></div>}<label className="block text-[10px] font-black uppercase tracking-[0.24em] text-white/35">Raw editor<textarea value={rawDraft || pretty(selected)} onChange={(e) => setRawDraft(e.target.value)} rows={18} disabled={auditMode} className="mt-3 w-full rounded-[26px] border border-white/10 bg-black/30 px-5 py-4 text-[12px] leading-6 text-white outline-none focus:border-orange-500/50 disabled:opacity-70" /></label></div>}{!auditMode && <div className="mt-6 space-y-4"><Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="Type CONFIRM before destructive action" /><div className="flex flex-wrap gap-3"><Button onClick={handleSave} disabled={saving} size="md">{saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}Save changes</Button><Button variant="danger" size="md" onClick={handleDelete} disabled={destroying || !destructiveUnlocked}>{destroying ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}{section === "users" ? "Terminate user" : "Delete record"}</Button></div></div>}</div>}
                </div>
              </div>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}
>>>>>>> 340ae896844c3324af5d17ca2aa02f2c08e6427d
