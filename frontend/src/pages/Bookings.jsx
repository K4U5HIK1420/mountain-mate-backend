import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Bell, Calendar, Car, CheckCircle2, Clock3, IndianRupee, Loader2, MapPin, Navigation, Phone, ShieldCheck, Star, XCircle } from "lucide-react";
import API from "../utils/api";
import socket from "../utils/socket";
import { useAuth } from "../context/AuthContext";
import { useNotify } from "../context/NotificationContext";
import { Button } from "../components/ui/Button";
import { Container } from "../components/ui/Container";
import LiveRideTracker from "../components/LiveRideTracker";
import DriverSimulation from "../components/DriverSimulation";

const ease = [0.22, 1, 0.36, 1];

export default function Bookings() {
  const { user } = useAuth();
  const { notify } = useNotify();
  const [activeTab, setActiveTab] = useState("user");
  const [userBookings, setUserBookings] = useState([]);
  const [partnerBookings, setPartnerBookings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");
  const [trackingSelection, setTrackingSelection] = useState(null);
  const [reviewDrafts, setReviewDrafts] = useState({});
  const [reviewingId, setReviewingId] = useState("");

  const loadAll = async () => {
    setLoading(true);
    try {
      const [userRes, partnerRes, notificationRes] = await Promise.all([
        API.get("/user/bookings"),
        API.get("/user/partner/incoming").catch(() => ({ data: { data: [] } })),
        API.get("/notifications").catch(() => ({ data: { data: [] } })),
      ]);
      setUserBookings(userRes.data?.data || []);
      setPartnerBookings(partnerRes.data?.data || []);
      setNotifications(notificationRes.data?.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (!user) return;
    socket.emit("join:user", user.id || user._id);
    const refresh = () => loadAll();
    socket.on("notification:new", refresh);
    return () => socket.off("notification:new", refresh);
  }, [user]);

  const stats = useMemo(() => {
    const pendingMine = userBookings.filter((item) => item.status === "pending").length;
    const incoming = partnerBookings.filter((item) => item.status === "pending").length;
    return {
      myTotal: userBookings.length,
      myPending: pendingMine,
      incoming,
      alerts: notifications.filter((item) => !item.read).length,
    };
  }, [userBookings, partnerBookings, notifications]);

  const handleStatusUpdate = async (bookingId, status) => {
    setUpdatingId(bookingId);
    try {
      const res = await API.post("/user/bookings/update-status", { bookingId, status });
      if (res.data?.success) {
        notify(status === "confirmed" ? "Booking confirmed." : "Booking declined.", status === "confirmed" ? "success" : "error");
        await loadAll();
      }
    } catch (err) {
      notify(err?.response?.data?.message || "Unable to update booking right now.", "error");
    } finally {
      setUpdatingId("");
    }
  };

  const updateReviewDraft = (bookingId, patch) => {
    setReviewDrafts((prev) => ({
      ...prev,
      [bookingId]: {
        rating: prev[bookingId]?.rating || 5,
        comment: prev[bookingId]?.comment || "",
        ...patch,
      },
    }));
  };

  const submitReview = async (bookingId) => {
    const draft = reviewDrafts[bookingId] || { rating: 5, comment: "" };
    if (!draft.comment?.trim()) {
      notify("Add a short review comment before submitting.", "error");
      return;
    }

    setReviewingId(bookingId);
    try {
      await API.post("/review/add", {
        bookingId,
        rating: draft.rating || 5,
        comment: draft.comment.trim(),
      });
      notify("Review submitted successfully.", "success");
      setReviewDrafts((prev) => {
        const next = { ...prev };
        delete next[bookingId];
        return next;
      });
      await loadAll();
    } catch (err) {
      notify(err?.response?.data?.message || "Unable to submit review right now.", "error");
    } finally {
      setReviewingId("");
    }
  };

  return (
    <div className="min-h-screen bg-[#040404] text-white">
      <Container className="px-6 pb-20 pt-10 sm:px-8 lg:px-12">
        <motion.section initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease }} className="rounded-[40px] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02)),radial-gradient(circle_at_top,rgba(249,115,22,0.15),transparent_38%),rgba(8,8,8,0.94)] p-6 shadow-[0_38px_100px_rgba(0,0,0,0.42)] md:p-10">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.42em] text-orange-300">Booking Command</p>
              <h1 className="mt-4 text-4xl font-black uppercase italic tracking-[-0.05em] text-white md:text-7xl">Approvals with clear signal.</h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-white/62">
                Users can track every stay and ride request, while owners and drivers can confirm or decline them from one cleaner control surface.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <StatCard label="My Bookings" value={stats.myTotal} />
              <StatCard label="Pending Mine" value={stats.myPending} />
              <StatCard label="Incoming Requests" value={stats.incoming} />
              <StatCard label="Unread Alerts" value={stats.alerts} />
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <TabButton active={activeTab === "user"} onClick={() => setActiveTab("user")}>My Bookings</TabButton>
            <TabButton active={activeTab === "partner"} onClick={() => setActiveTab("partner")}>Owner / Driver Inbox</TabButton>
            <TabButton active={activeTab === "alerts"} onClick={() => setActiveTab("alerts")}>Notifications</TabButton>
          </div>
        </motion.section>

        {loading ? (
          <div className="flex h-[50vh] items-center justify-center">
            <Loader2 className="animate-spin text-orange-400" size={40} />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.section key={activeTab} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 18 }} transition={{ duration: 0.35, ease }} className="mt-10 space-y-6">
              {activeTab === "user" && (
                <BookingList
                  items={userBookings}
                  reviewDrafts={reviewDrafts}
                  reviewingId={reviewingId}
                  onReviewDraftChange={updateReviewDraft}
                  onSubmitReview={submitReview}
                  onTrack={(booking, viewerRole) => setTrackingSelection({ booking, viewerRole })}
                  emptyTitle="No bookings yet"
                  emptyText="Once you request a stay or ride, it will appear here with payment and approval status."
                />
              )}
              {activeTab === "partner" && (
                <BookingList
                  items={partnerBookings}
                  mode="partner"
                  updatingId={updatingId}
                  onTrack={(booking, viewerRole) => setTrackingSelection({ booking, viewerRole })}
                  onApprove={(id) => handleStatusUpdate(id, "confirmed")}
                  onDecline={(id) => handleStatusUpdate(id, "declined")}
                  emptyTitle="No incoming requests"
                  emptyText="When a traveler books one of your stays or rides, it will land here for approval."
                />
              )}
              {activeTab === "alerts" && <NotificationsPanel items={notifications} />}
            </motion.section>
          </AnimatePresence>
        )}
      </Container>

      <LiveRideTracker
        bookingId={trackingSelection?.booking?._id || ""}
        initialBooking={trackingSelection?.booking || null}
        initialViewerRole={trackingSelection?.viewerRole || "rider"}
        open={Boolean(trackingSelection?.booking?._id)}
        onClose={() => setTrackingSelection(null)}
      />
      <DriverSimulation />
    </div>
  );
}

function BookingList({ items, mode = "user", updatingId, onApprove, onDecline, onTrack, emptyTitle, emptyText, reviewDrafts = {}, reviewingId = "", onReviewDraftChange, onSubmitReview }) {
  if (!items.length) {
    return (
      <div className="rounded-[34px] border border-dashed border-white/10 bg-white/[0.02] p-10 text-center text-white/35">
        <Bell className="mx-auto mb-4 text-orange-400/70" size={28} />
        <p className="text-2xl font-black uppercase italic tracking-tight text-white">{emptyTitle}</p>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-white/50">{emptyText}</p>
      </div>
    );
  }

  return items.map((booking, index) => (
    <motion.article
      key={booking._id}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-[34px] border border-white/10 bg-[#090909] p-6 shadow-[0_28px_80px_rgba(0,0,0,0.32)] md:p-8"
    >
      <div className="flex flex-col gap-8 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex gap-5">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[24px] border border-white/10 bg-white/5 text-orange-300">
            {isStayBooking(booking) ? <MapPin size={24} /> : <Car size={24} />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-[10px] font-black uppercase tracking-[0.32em] text-orange-300">{isStayBooking(booking) ? "Stay Request" : "Ride Request"}</p>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-white/45">Ref {booking._id.slice(-6).toUpperCase()}</span>
            </div>
            <h3 className="mt-3 text-2xl font-black uppercase italic tracking-tight text-white md:text-4xl">
              {booking.listingLabel || booking.listingId?.hotelName || booking.listingId?.vehicleType || "Booking"}
            </h3>
            <div className="mt-4 flex flex-wrap gap-3 text-sm text-white/58">
              <MetaChip icon={<Calendar size={14} />} text={new Date(booking.date || booking.createdAt).toLocaleDateString()} />
              {booking.bookingType === "Transport" && (
                <MetaChip
                  icon={<Calendar size={14} />}
                  text={`Ride ${booking.listingId?.availableDate ? new Date(booking.listingId.availableDate).toLocaleDateString() : "Flexible"}`}
                />
              )}
              <MetaChip icon={<IndianRupee size={14} />} text={`${booking.amount || 0}`} />
              <MetaChip icon={<Clock3 size={14} />} text={`Payment ${booking.paymentStatus || "pending"}`} />
              {mode === "partner" && <MetaChip icon={<Phone size={14} />} text={`${booking.customerName} · ${booking.phoneNumber}`} />}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 md:min-w-[260px]">
          <StatusPill status={booking.status} />
          {booking.bookingType === "Transport" && booking.status !== "declined" && booking.status !== "cancelled" && (
              <Button
                variant="ghost"
                onClick={() => onTrack?.(booking, mode === "partner" ? "driver" : "rider")}
                className="rounded-[20px] text-[10px] tracking-[0.26em]"
              >
              <Navigation size={15} /> Live Track
            </Button>
          )}
          {mode === "partner" && booking.status === "pending" && (
            <div className="grid grid-cols-2 gap-3">
              <Button onClick={() => onApprove(booking._id)} disabled={updatingId === booking._id} className="rounded-[20px] text-[10px] tracking-[0.26em]">
                {updatingId === booking._id ? <Loader2 size={15} className="animate-spin" /> : <><CheckCircle2 size={15} /> Confirm</>}
              </Button>
              <Button variant="ghost" onClick={() => onDecline(booking._id)} disabled={updatingId === booking._id} className="rounded-[20px] border-red-500/20 text-[10px] tracking-[0.26em] text-red-300 hover:bg-red-500/10">
                <XCircle size={15} /> Decline
              </Button>
            </div>
          )}
          {mode === "user" && (
            <>
              <div className="rounded-[22px] border border-white/10 bg-white/5 px-4 py-4 text-sm leading-7 text-white/55">
                {booking.status === "pending" && "Your request is paid and waiting for owner or driver approval."}
                {booking.status === "confirmed" && "Your booking has been approved. You are ready to proceed."}
                {booking.status === "completed" && "This booking is completed. You can leave a rating if reviews are enabled for this trip."}
                {booking.status === "declined" && "This request was declined. The listing inventory has been released again."}
                {booking.status === "cancelled" && "This booking was cancelled."}
              </div>
              {booking.hasReview && (
                <div className="rounded-[22px] border border-green-500/20 bg-green-500/10 px-4 py-4 text-[11px] font-black uppercase tracking-[0.24em] text-green-300">
                  Review submitted
                </div>
              )}
              {booking.canReview && (
                <ReviewComposer
                  booking={booking}
                  draft={reviewDrafts[booking._id] || { rating: 5, comment: "" }}
                  reviewing={reviewingId === booking._id}
                  onChange={(patch) => onReviewDraftChange?.(booking._id, patch)}
                  onSubmit={() => onSubmitReview?.(booking._id)}
                />
              )}
            </>
          )}
        </div>
      </div>
    </motion.article>
  ));
}

function NotificationsPanel({ items }) {
  if (!items.length) {
    return (
      <div className="rounded-[34px] border border-dashed border-white/10 bg-white/[0.02] p-10 text-center text-white/35">
        <ShieldCheck className="mx-auto mb-4 text-orange-400/70" size={28} />
        <p className="text-2xl font-black uppercase italic tracking-tight text-white">No notifications yet</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {items.map((item) => (
        <div key={item._id} className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center justify-between gap-4">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-300">{item.title}</p>
            <span className="text-[10px] font-black uppercase tracking-[0.24em] text-white/35">{new Date(item.createdAt).toLocaleString()}</span>
          </div>
          <p className="mt-3 text-sm leading-7 text-white/62">{item.message}</p>
        </div>
      ))}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-[26px] border border-white/10 bg-white/5 px-5 py-5">
      <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/35">{label}</p>
      <p className="mt-3 text-3xl font-black uppercase italic tracking-tight text-white">{value}</p>
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button onClick={onClick} className={`rounded-full px-5 py-3 text-[10px] font-black uppercase tracking-[0.28em] transition-all ${active ? "bg-orange-500 text-white" : "border border-white/10 bg-white/5 text-white/55 hover:text-white"}`}>
      {children}
    </button>
  );
}

function MetaChip({ icon, text }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[11px] text-white/58">
      <span className="text-orange-300">{icon}</span>
      <span>{text}</span>
    </div>
  );
}

function StatusPill({ status }) {
  const normalized = String(status || "pending").toLowerCase();
  const color =
    normalized === "confirmed"
      ? "border-green-500/25 bg-green-500/10 text-green-300"
      : normalized === "declined" || normalized === "cancelled"
        ? "border-red-500/25 bg-red-500/10 text-red-300"
        : "border-orange-500/25 bg-orange-500/10 text-orange-300";

  return (
    <div className={`rounded-full border px-4 py-3 text-center text-[10px] font-black uppercase tracking-[0.3em] ${color}`}>
      {normalized}
    </div>
  );
}

function isStayBooking(booking) {
  return booking.bookingType === "Hotel" || !!booking.listingId?.hotelName;
}

function ReviewComposer({ booking, draft, reviewing, onChange, onSubmit }) {
  return (
    <div className="rounded-[24px] border border-orange-500/20 bg-orange-500/10 p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.28em] text-orange-300">
        {booking.bookingType === "Transport" ? "Rate your ride" : "Rate your stay"}
      </p>
      <div className="mt-4 flex gap-2">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => onChange({ rating: value })}
            className={`rounded-full border px-3 py-2 transition-all ${
              value <= (draft.rating || 5)
                ? "border-orange-400 bg-orange-500/20 text-orange-300"
                : "border-white/10 bg-white/5 text-white/30"
            }`}
          >
            <Star size={14} className={value <= (draft.rating || 5) ? "fill-current" : ""} />
          </button>
        ))}
      </div>
      <textarea
        value={draft.comment || ""}
        onChange={(e) => onChange({ comment: e.target.value })}
        rows={3}
        placeholder="Share your experience"
        className="mt-4 w-full rounded-[20px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-white/20"
      />
      <Button onClick={onSubmit} disabled={reviewing} className="mt-4 rounded-[20px] text-[10px] tracking-[0.26em]">
        {reviewing ? <Loader2 size={15} className="animate-spin" /> : <><Star size={15} /> Submit Review</>}
      </Button>
    </div>
  );
}
