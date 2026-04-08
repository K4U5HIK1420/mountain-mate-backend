import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Camera,
  Compass,
  Home,
  LifeBuoy,
  LogOut,
  Map,
  Mountain,
  Package,
  Save,
  ShieldCheck,
  Sparkles,
  Star,
  UserCog,
  Car,
  Hotel,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import API from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useNotify } from "../context/NotificationContext";
import { Button } from "../components/ui/Button";
import { Container } from "../components/ui/Container";

const sidebarItems = [
  { id: "bookings", label: "Recent Activity", icon: Package },
  { id: "trips", label: "Saved Plans", icon: Map },
  { id: "settings", label: "Profile Details", icon: UserCog },
];

const bottomNav = [
  { label: "Home", to: "/", icon: Home, adminOnly: false },
  { label: "Stays", to: "/explore-stays", icon: Hotel, adminOnly: false },
  { label: "Rides", to: "/explore-rides", icon: Car, adminOnly: false },
  { label: "Admin", to: "/admin-mate", icon: ShieldCheck, adminOnly: true },
  { label: "Support", to: "/support", icon: LifeBuoy, adminOnly: false },
];

function useCountUp(target, duration = 850) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const numericTarget = Number(target || 0);
    if (!Number.isFinite(numericTarget)) {
      setCount(0);
      return;
    }

    const start = performance.now();
    let frame = null;

    const tick = (time) => {
      const progress = Math.min(1, (time - start) / duration);
      setCount(Math.round(numericTarget * progress));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => {
      if (frame) cancelAnimationFrame(frame);
    };
  }, [target, duration]);

  return count;
}

export default function Profile() {
  const { user, role, signOut, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { notify } = useNotify();

  const [activeTab, setActiveTab] = useState("bookings");
  const [bookings, setBookings] = useState([]);
  const [savedTrips, setSavedTrips] = useState([]);
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [profileForm, setProfileForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    avatarUrl: "",
  });

  const isAdmin = String(role || "").toLowerCase() === "admin";

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const [bookingRes, tripsRes] = await Promise.all([
          API.get("/user/bookings").catch(() => ({ data: { data: [] } })),
          API.get("/trips").catch(() => ({ data: { data: [] } })),
        ]);

        setBookings(bookingRes.data?.data || []);
        setSavedTrips(tripsRes.data?.data || []);
      } catch {
        notify("Profile sync failed", "error");
      }
    };

    if (user) fetchProfileData();
  }, [notify, user]);

  useEffect(() => {
    const fullName =
      user?.user_metadata?.full_name ||
      user?.user_metadata?.display_name ||
      user?.name ||
      user?.fullName ||
      user?.email?.split("@")[0] ||
      "";
    const phone = user?.user_metadata?.phone || user?.phone || "";
    const avatarUrl = user?.user_metadata?.avatar_url || user?.avatarUrl || "";

    setProfileForm({
      fullName,
      email: user?.email || "",
      phone,
      avatarUrl,
    });
    setAvatarPreview(avatarUrl);
  }, [user]);

  const stats = useMemo(
    () => ({
      completed: bookings.length,
      planned: savedTrips.length,
      active: bookings.filter((item) => !["cancelled", "completed"].includes(String(item.status || "").toLowerCase())).length,
      level: Math.max(1, bookings.length + savedTrips.length),
    }),
    [bookings, savedTrips.length]
  );

  const displayName = String(profileForm.fullName || "Traveler").toUpperCase();
  const completedCount = useCountUp(stats.completed);
  const plannedCount = useCountUp(stats.planned);
  const activeCount = useCountUp(stats.active);
  const levelCount = useCountUp(stats.level);

  const visibleBottomNav = bottomNav.filter((item) => !item.adminOnly || isAdmin);

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      notify("Please choose an image file.", "error");
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleProfileSave = async () => {
    if (!profileForm.fullName.trim()) {
      notify("Name is required.", "error");
      return;
    }

    setSaving(true);
    try {
      const payload = new FormData();
      payload.append("fullName", profileForm.fullName.trim());
      payload.append("phone", profileForm.phone.trim());
      payload.append("avatarUrl", profileForm.avatarUrl.trim());
      if (avatarFile) payload.append("avatar", avatarFile);

      const res = await API.post("/user/setup-profile", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const nextAvatar = res.data?.data?.avatarUrl || profileForm.avatarUrl;
      setProfileForm((prev) => ({ ...prev, avatarUrl: nextAvatar }));
      setAvatarPreview(nextAvatar || avatarPreview);
      setAvatarFile(null);
      await refreshUser?.();
      notify("Profile updated.", "success");
    } catch {
      notify("Profile update failed.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <p className="animate-pulse text-[11px] font-black uppercase tracking-[0.35em] text-orange-400">
          Identity Required
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] pb-28 pt-28 text-white md:pt-32">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute left-[4%] top-6 h-[22rem] w-[22rem] rounded-full bg-orange-500/14 blur-[130px]" />
        <div className="absolute bottom-[-8rem] right-[5%] h-[24rem] w-[24rem] rounded-full bg-orange-400/10 blur-[130px]" />
      </div>

      <Container className="relative z-10">
        <section className="rounded-[30px] border border-white/10 bg-[linear-gradient(140deg,rgba(255,255,255,0.06),rgba(255,255,255,0.01)),rgba(6,6,6,0.94)] p-5 backdrop-blur-2xl md:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
              <div className="relative">
                <motion.div
                  animate={{ opacity: [0.25, 0.5, 0.25] }}
                  transition={{ duration: 2.6, repeat: Infinity }}
                  className="absolute -inset-2 rounded-full bg-orange-500/30 blur-2xl"
                />
                <div className="relative h-28 w-28 overflow-hidden rounded-full border border-orange-400/40 bg-black/45 p-1 shadow-[0_0_35px_rgba(249,115,22,0.35)]">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt={profileForm.fullName || "Profile"} className="h-full w-full rounded-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center rounded-full bg-[#0d0d0d] text-4xl font-black italic text-orange-200">
                      {profileForm.email?.charAt(0)?.toUpperCase() || "M"}
                    </div>
                  )}
                </div>
                <label className="absolute bottom-1 right-1 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-black/75 text-orange-200 shadow-lg transition hover:bg-orange-600 hover:text-white">
                  <Camera size={16} />
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </label>
              </div>

              <div>
                <h1 className="text-center text-3xl font-black uppercase italic tracking-[-0.03em] text-white sm:text-left md:text-5xl">
                  {displayName}
                </h1>
                <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-orange-400/30 bg-orange-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-orange-200">
                  <Sparkles size={12} />
                  Verified Expeditionary Elite
                </div>
              </div>
            </div>

            <motion.button
              whileHover={{ y: -2 }}
              onClick={() => navigate("/bookings")}
              className="group rounded-2xl border border-orange-400/30 bg-gradient-to-r from-[#ff6a00] to-[#ff8c00] px-6 py-4 text-left shadow-[0_16px_45px_rgba(249,115,22,0.35)] transition-all"
            >
              <p className="text-xs font-black uppercase tracking-[0.22em] text-black/75">Open Command Center</p>
              <p className="mt-1 flex items-center gap-2 text-sm font-black uppercase tracking-tight text-white">
                My Active Reservations
                <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
              </p>
              <p className="mt-1 text-[11px] text-white/85">
                Manage your upcoming stays, rides & tactical logs
              </p>
            </motion.button>
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={Star} label="Completed Missions" value={completedCount} />
          <StatCard icon={Compass} label="Planned Paths" value={plannedCount} />
          <StatCard icon={Package} label="Active Reservations" value={activeCount} />
          <StatCard icon={ShieldCheck} label="Explorer Level" value={levelCount} />
        </section>

        <section className="mt-6 grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="rounded-[24px] border border-white/10 bg-black/35 p-4 backdrop-blur-xl">
            <div className="space-y-2">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-[11px] font-black uppercase tracking-[0.14em] transition-all ${
                      active
                        ? "border-orange-400/40 bg-orange-500/15 text-orange-100 shadow-[0_10px_25px_rgba(249,115,22,0.2)]"
                        : "border-transparent bg-white/5 text-white/55 hover:border-white/10 hover:text-white"
                    }`}
                  >
                    <Icon size={15} />
                    {item.label}
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleLogout}
              className="mt-6 flex w-full items-center gap-3 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-left text-[11px] font-black uppercase tracking-[0.14em] text-red-200 transition hover:bg-red-500/20"
            >
              <LogOut size={15} />
              Terminate Session
            </button>
          </aside>

          <div className="rounded-[24px] border border-white/10 bg-[linear-gradient(140deg,rgba(255,255,255,0.05),rgba(255,255,255,0.01)),rgba(8,8,8,0.9)] p-5 backdrop-blur-xl md:p-7">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.22 }}
              >
                {activeTab === "bookings" && (
                  bookings.length === 0 ? (
                    <ReservationEmpty onStart={() => navigate("/planner")} />
                  ) : (
                    <div className="space-y-3">
                      {bookings.slice(0, 5).map((booking) => (
                        <BookingCard key={booking._id} booking={booking} />
                      ))}
                    </div>
                  )
                )}

                {activeTab === "trips" && (
                  savedTrips.length === 0 ? (
                    <GenericEmpty title="No saved plans yet." />
                  ) : (
                    <div className="space-y-3">
                      {savedTrips.map((trip, index) => (
                        <button
                          key={`${trip._id || "trip"}-${index}`}
                          onClick={() => navigate("/planner")}
                          className="w-full rounded-xl border border-white/12 bg-white/5 p-4 text-left transition hover:border-orange-400/35"
                        >
                          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-orange-300">Saved Plan</p>
                          <p className="mt-1 text-lg font-black uppercase italic text-white">{trip.title || "Untitled plan"}</p>
                        </button>
                      ))}
                    </div>
                  )
                )}

                {activeTab === "settings" && (
                  <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
                    <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/45">Profile Photo</p>
                      <div className="mt-5 flex flex-col items-center gap-4">
                        <div className="h-36 w-36 overflow-hidden rounded-full border border-orange-400/35 bg-black/30">
                          {avatarPreview ? (
                            <img src={avatarPreview} alt="Preview" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-5xl font-black italic text-orange-200">
                              {profileForm.email?.charAt(0)?.toUpperCase() || "M"}
                            </div>
                          )}
                        </div>
                        <label className="cursor-pointer rounded-full border border-orange-400/25 bg-orange-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-orange-200 transition hover:bg-orange-500/20">
                          Upload Photo
                          <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                        </label>
                      </div>
                    </div>

                    <div className="space-y-4 rounded-[24px] border border-white/10 bg-white/5 p-5">
                      <Field
                        label="Full Name"
                        value={profileForm.fullName}
                        onChange={(value) => setProfileForm((prev) => ({ ...prev, fullName: value }))}
                      />
                      <Field label="Email" value={profileForm.email} readOnly />
                      <Field
                        label="Phone Number"
                        value={profileForm.phone}
                        onChange={(value) => setProfileForm((prev) => ({ ...prev, phone: value }))}
                      />
                      <Field
                        label="Photo URL (optional)"
                        value={profileForm.avatarUrl}
                        onChange={(value) => {
                          setProfileForm((prev) => ({ ...prev, avatarUrl: value }));
                          if (!avatarFile) setAvatarPreview(value);
                        }}
                      />
                      <Button type="button" size="sm" onClick={handleProfileSave} disabled={saving} className="rounded-xl px-5 py-3 text-[10px] tracking-[0.16em]">
                        {saving ? "Saving..." : "Save Profile"}
                        <Save size={14} />
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </section>
      </Container>

      <div className="fixed bottom-3 left-0 z-30 w-full px-3 md:hidden">
        <div className={`mx-auto grid max-w-4xl gap-2 rounded-2xl border border-white/12 bg-black/70 p-2 backdrop-blur-2xl ${visibleBottomNav.length === 4 ? "grid-cols-4" : "grid-cols-5"}`}>
          {visibleBottomNav.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={() => navigate(item.to)}
                className="flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-white/55 transition-all hover:bg-white/8 hover:text-orange-300"
              >
                <Icon size={14} />
                <span className="text-[9px]">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="rounded-2xl border border-white/12 bg-[linear-gradient(145deg,rgba(255,255,255,0.06),rgba(255,255,255,0.01)),rgba(8,8,8,0.9)] p-4 shadow-[0_16px_35px_rgba(0,0,0,0.26)]"
    >
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/45">{label}</p>
        <Icon size={14} className="text-orange-300" />
      </div>
      <p className="mt-3 text-3xl font-black italic tracking-tight text-white">{value}</p>
    </motion.div>
  );
}

function Field({ label, value, onChange, readOnly = false }) {
  return (
    <label className="block">
      <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/45">{label}</p>
      <input
        value={value}
        readOnly={readOnly}
        onChange={(event) => onChange?.(event.target.value)}
        className={`w-full rounded-[18px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition ${readOnly ? "cursor-not-allowed text-white/50" : "focus:border-orange-500/45"}`}
      />
    </label>
  );
}

function ReservationEmpty({ onStart }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-8 text-center">
      <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-orange-400/30 bg-orange-500/10">
        <Mountain size={30} className="text-orange-300" />
      </div>
      <h3 className="text-xl font-black uppercase italic tracking-tight text-white">No journeys yet. Start planning your first adventure.</h3>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-white/58">
        Build your route, reserve stays, and sync rides in one command flow.
      </p>
      <Button type="button" size="sm" onClick={onStart} className="mt-6 rounded-xl px-5 py-3 tracking-[0.16em]">
        Start Planning
      </Button>
    </div>
  );
}

function GenericEmpty({ title }) {
  return (
    <div className="rounded-xl border border-dashed border-white/12 bg-white/5 p-6 text-center">
      <p className="text-sm text-white/55">{title}</p>
    </div>
  );
}

function BookingCard({ booking }) {
  return (
    <div className="rounded-xl border border-white/12 bg-white/5 p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-300">{booking.status || "Active"}</p>
      <p className="mt-1 text-lg font-black uppercase italic text-white">
        {booking.listingLabel || booking.hotelId?.hotelName || booking.customerName || "Reservation"}
      </p>
      <p className="mt-1 text-sm text-white/55">Total: Rs {booking.totalPrice || "---"}</p>
    </div>
  );
}
