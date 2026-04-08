import React, { useMemo, useState, useEffect, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate, Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, PlusCircle, Car, LayoutGrid, ChevronDown, Shield, Bell } from "lucide-react";

import API from "./utils/api";
import { useNotify } from "./context/NotificationContext";
import { useAuth } from "./context/AuthContext";
import { hasSupabaseEnv } from "./utils/supabase";
import socket from "./utils/socket";

import Notification from "./components/Notification";
import AnimatedBackground from "./components/AnimatedBackground";
import Footer from "./components/Footer";
import LiveChatSupport from "./components/LiveChatSupport";
import ErrorBoundary from "./components/ErrorBoundary";
import AIAdvisor from "./components/Features/AIAdvisor";

import "leaflet/dist/leaflet.css";

const MAINTENANCE_MODE = false;

const maintenanceLines = ["Website under maintenance"];

const MaintenancePage = () => {
  const [visibleText, setVisibleText] = useState("");

  useEffect(() => {
    const fullText = maintenanceLines[0];
    let index = 0;
    const intervalId = window.setInterval(() => {
      index += 1;
      setVisibleText(fullText.slice(0, index));
      if (index >= fullText.length) {
        window.clearInterval(intervalId);
      }
    }, 55);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050505] px-6 text-white">
      <div className="font-['Georgia'] text-center text-3xl italic tracking-[0.08em] text-white/90 sm:text-5xl">
        {visibleText}
        <span className="ml-1 inline-block h-[1em] w-[1px] animate-pulse bg-white/70 align-middle" />
      </div>
    </div>
  );
};

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
};

const RefreshRedirect = () => {
  const location = useLocation();

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    const hashParams = new URLSearchParams(hash);
    const searchParams = new URLSearchParams(window.location.search);
    const hasOAuthPayload =
      !!searchParams.get("code") ||
      !!hashParams.get("access_token") ||
      !!hashParams.get("refresh_token") ||
      !!hashParams.get("type");

    if (location.pathname === "/auth/callback" || hasOAuthPayload) {
      return;
    }

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

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
};

const AppLayout = ({ children }) => {
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-[#050505] font-sans text-white">
      <AnimatedBackground />
      <RefreshRedirect />
      <Navbar />
      <main className={`relative z-10 flex-1 ${isHomePage ? "pt-0" : "pt-32"}`}>
        <Suspense fallback={<div className="flex h-screen items-center justify-center bg-black"><p className="text-[10px] font-black uppercase tracking-widest text-orange-500 italic animate-pulse">Syncing Command...</p></div>}>
          {children}
        </Suspense>
      </main>
      <Footer />
      <LiveChatSupport />
      <Notification notification={Notification} />
      <div className="pointer-events-none fixed bottom-0 h-32 w-full bg-gradient-to-t from-black via-black/70 to-transparent opacity-60" />
    </div>
  );
};

const GA_MEASUREMENT_ID = "G-HQQHDKVTYQ";

const AnalyticsTracker = () => {
  const location = useLocation();

  useEffect(() => {
    if (typeof window.gtag !== "function") return;

    window.gtag("config", GA_MEASUREMENT_ID, {
      page_path: `${location.pathname}${location.search}${location.hash}`,
      page_title: document.title,
      page_location: window.location.href,
    });
  }, [location.pathname, location.search, location.hash]);

  return null;
};

const Home = React.lazy(() => import("./pages/Home"));
const ExploreStays = React.lazy(() => import("./pages/ExploreStays"));
const ExploreRides = React.lazy(() => import("./pages/ExploreRides"));
const AddHotel = React.lazy(() => import("./pages/AddHotel"));
const AddTransport = React.lazy(() => import("./pages/AddTransport"));
const Bookings = React.lazy(() => import("./pages/Bookings"));
const ManageStays = React.lazy(() => import("./pages/ManageStays"));
const ManageRides = React.lazy(() => import("./pages/ManageRides"));
const AdminDashboard = React.lazy(() => import("./pages/AdminDashboard"));
const AdminBookings = React.lazy(() => import("./pages/AdminBookingsPanel"));
const AdminSupport = React.lazy(() => import("./pages/AdminSupport"));
const Login = React.lazy(() => import("./pages/Login"));
const ResetPassword = React.lazy(() => import("./pages/ResetPassword"));
const AuthCallback = React.lazy(() => import("./pages/AuthCallback"));
const Register = React.lazy(() => import("./pages/Register"));
const VerifyEmail = React.lazy(() => import("./pages/VerifyEmail"));
const RegisterPartner = React.lazy(() => import("./pages/RegisterPartner"));
const Recommendations = React.lazy(() => import("./pages/Recommendations"));
const Planner = React.lazy(() => import("./pages/Planner"));
const Profile = React.lazy(() => import("./pages/Profile"));
const SupportChat = React.lazy(() => import("./pages/SupportChat"));
const BookingConfirm = React.lazy(() => import("./pages/BookingConfirm"));
const PaymentResult = React.lazy(() => import("./pages/PaymentResult"));

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const { notify } = useNotify();
  const token = !!user;
  const [hasAdminAccess, setHasAdminAccess] = useState(false);
  const isAdmin = role === "admin" || hasAdminAccess;
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
          API.get("/transport/admin/all").catch(() => ({ data: [] })),
        ]);
        const hData = hRes.data?.data || hRes.data || [];
        const rData = rRes.data?.data || rRes.data || [];
        setHasHotels(hData.length > 0);
        setHasRides(rData.length > 0);
      } catch {
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
      } catch {
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

  const openNotifications = async () => {
    setNotificationOpen((prev) => !prev);
    if (unreadCount > 0) {
      setUnreadCount(0);
      try {
        await API.patch("/notifications/read");
      } catch (_err) {
        // Non-blocking: keep the drawer usable even if the mark-read call fails.
      }
    }
  };

  const navLinks = useMemo(
    () => [
      { to: "/explore-stays", label: "STAYS" },
      { to: "/explore-rides", label: "RIDES" },
      ...(token ? [{ to: "/bookings", label: "MY BOOKINGS" }] : []),
    ],
    [token]
  );

  const navAvatar = user?.user_metadata?.avatar_url || user?.avatarUrl || "";
  const navInitial = user?.email?.charAt(0)?.toUpperCase() || "M";

  return (
    <nav className="fixed top-0 w-full z-[9999] px-3 py-3 sm:px-6 lg:px-10 pointer-events-none">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="pointer-events-auto mx-auto max-w-7xl rounded-[32px] border border-white/10 bg-black/45 px-4 py-3 shadow-2xl backdrop-blur-[40px] transition-all duration-700 sm:px-6"
      >
        <div className="flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src="/mountain-mate-badge.png"
              alt="Mountain Mate logo"
              className="h-12 w-12 rounded-full bg-white object-cover shadow-xl transition-transform duration-500 group-hover:rotate-6"
            />
          </Link>

          <div className="hidden xl:flex flex-1 items-center justify-center gap-10">
            {navLinks.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`relative flex items-center gap-1.5 text-[10px] font-black tracking-[0.25em] uppercase italic transition-all hover:text-orange-500 ${location.pathname === item.to ? "text-orange-400" : "text-white/30"}`}
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
                className={`relative flex items-center gap-2 text-[10px] font-black tracking-[0.25em] uppercase italic transition-all hover:text-orange-500 ${
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
                className={`relative flex items-center gap-2 text-[10px] font-black tracking-[0.25em] uppercase italic transition-all hover:text-orange-500 ${
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

            <div
              className="relative ml-2 flex items-center border-l border-white/10 pl-8"
              onMouseEnter={() => token && setIsBusinessOpen(true)}
              onMouseLeave={() => token && setIsBusinessOpen(false)}
            >
              <button
                onClick={() => !token && navigate("/login")}
                className={`flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] italic transition-all outline-none ${isBusinessOpen ? "text-white" : "text-orange-500 hover:text-white"}`}
              >
                <LayoutGrid size={12} /> MY BUSINESS <ChevronDown size={10} className={`transition-transform duration-500 ${isBusinessOpen ? "rotate-180" : ""}`} />
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
                      <Link to="/add-hotel" className="flex items-center gap-3 rounded-2xl border border-orange-500/10 bg-orange-500/5 p-3 text-[9px] font-black uppercase tracking-widest text-orange-500 italic hover:bg-orange-500/10"><PlusCircle size={14} />List New Stay</Link>
                      <Link to="/add-transport" className="mt-1 flex items-center gap-3 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 p-3 text-[9px] font-black uppercase tracking-widest text-white italic shadow-lg hover:brightness-110"><Car size={14} />Offer New Ride</Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {isAdmin && (
              <Link
                to="/admin-mate"
                className="hidden items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/8 px-4 py-3 text-[9px] font-black uppercase tracking-[0.24em] text-orange-300 transition-all hover:bg-orange-500/14 hover:text-white xl:flex"
              >
                <Shield size={12} />
                Admin
              </Link>
            )}
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
                        className="fixed left-3 right-3 top-[5.5rem] z-[99999] rounded-[28px] border border-white/10 bg-[#0a0a0a]/95 p-4 shadow-[0_30px_90px_rgba(0,0,0,0.55)] backdrop-blur-[60px] sm:absolute sm:left-auto sm:right-0 sm:top-[120%] sm:w-[340px]"
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
                <Link to="/profile" className="h-10 w-10 rounded-full bg-gradient-to-tr from-orange-500 via-amber-400 to-white p-[2.5px] shadow-2xl transition-transform hover:scale-110">
                  <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-[#0a0a0a] text-[12px] font-black uppercase italic text-orange-500">
                    {navAvatar ? (
                      <img src={navAvatar} alt="Profile" className="h-full w-full object-cover" />
                    ) : (
                      navInitial
                    )}
                  </div>
                </Link>
              </div>
            ) : (
              <Link to="/login" className="rounded-full bg-orange-600 px-7 py-3 text-[10px] font-black tracking-widest text-white italic shadow-lg transition-all hover:bg-orange-500 active:scale-95">LOGIN</Link>
            )}
            <button onClick={() => setMobileOpen(!mobileOpen)} className="rounded-2xl border border-white/10 bg-white/5 p-3 text-white/50 lg:hidden">
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="pointer-events-auto mx-auto mt-3 max-w-7xl rounded-[28px] border border-white/10 bg-black/85 p-4 shadow-2xl backdrop-blur-[40px]"
          >
            <div className="grid gap-3">
              {navLinks.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={`rounded-[20px] border px-4 py-4 text-[10px] font-black uppercase tracking-[0.28em] italic transition-all ${location.pathname === item.to ? "border-orange-500/30 bg-orange-500/10 text-orange-300" : "border-white/10 bg-white/5 text-white/70 hover:text-white"}`}
                >
                  {item.label}
                </Link>
              ))}
              {isAdmin && <Link to="/admin-mate" onClick={() => setMobileOpen(false)} className="rounded-[20px] border border-orange-500/20 bg-orange-500/10 px-4 py-4 text-[10px] font-black uppercase tracking-[0.28em] text-orange-300 italic">Admin Console</Link>}
              {isAdmin && <Link to="/admin-support" onClick={() => setMobileOpen(false)} className="rounded-[20px] border border-orange-500/20 bg-orange-500/10 px-4 py-4 text-[10px] font-black uppercase tracking-[0.28em] text-orange-300 italic">Support Queue</Link>}
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
  if (MAINTENANCE_MODE) return <MaintenancePage />;
  if (!hasSupabaseEnv) return <div className="flex min-h-screen items-center justify-center bg-black text-[10px] font-black uppercase tracking-[0.5em] text-orange-500 italic animate-pulse">Establishing Uplink...</div>;

  return (
    <Router>
      <ErrorBoundary>
        <ScrollToTop />
        <AnalyticsTracker />
        <AppLayout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/explore-stays" element={<ExploreStays />} />
            <Route path="/explore-rides" element={<ExploreRides />} />
            <Route path="/ai-advisor" element={<AIAdvisor />} />
            <Route path="/add-hotel" element={<ProtectedRoute><AddHotel /></ProtectedRoute>} />
            <Route path="/add-transport" element={<ProtectedRoute><AddTransport /></ProtectedRoute>} />
            <Route path="/bookings" element={<ProtectedRoute><Bookings /></ProtectedRoute>} />
            <Route path="/manage-stays" element={<ProtectedRoute><ManageStays /></ProtectedRoute>} />
            <Route path="/manage-rides" element={<ProtectedRoute><ManageRides /></ProtectedRoute>} />
            <Route path="/admin-mate" element={<AdminDashboard />} />
            <Route path="/admin-bookings" element={<AdminBookings />} />
            <Route path="/admin-support" element={<AdminSupport />} />
            <Route path="/login" element={<Login />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/register-partner" element={<RegisterPartner />} />
            <Route path="/recommendations" element={<Recommendations />} />
            <Route path="/planner" element={<Planner />} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/support" element={<SupportChat />} />
            <Route path="/booking/:id/confirm" element={<BookingConfirm />} />
            <Route path="/payment/success" element={<PaymentResult ok={true} />} />
            <Route path="/payment/failure" element={<PaymentResult ok={false} />} />
          </Routes>
        </AppLayout>
      </ErrorBoundary>
    </Router>
  );
}

export default App;
