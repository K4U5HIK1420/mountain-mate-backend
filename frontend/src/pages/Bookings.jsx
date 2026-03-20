import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MoreVertical, CheckCircle2, Clock, XCircle, Ban } from "lucide-react";
import API from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useNotify } from "../context/NotificationContext";
import { Button } from "../components/ui/Button";

const Bookings = () => {
  const { user } = useAuth();
  const { notify } = useNotify();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [cancelingId, setCancelingId] = useState(null);

  const isJwtUser = useMemo(() => {
    // If you logged in via Supabase, your token is supabase access token; booking history endpoint is JWT-based.
    // We'll still attempt; if it fails, show helpful empty state.
    return !!localStorage.getItem("token");
  }, []);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const res = await API.get("/user/bookings");
        const data = res.data?.data || [];
        if (!mounted) return;
        setRows(data);
      } catch (e) {
        if (!mounted) return;
        setRows([]);
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const getStatusStyle = (status) => {
    switch (status) {
      case "confirmed":
        return "bg-green-500/10 text-green-400 border-green-500/20";
      case "pending":
        return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      case "cancelled":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      case "completed":
        return "bg-sky-500/10 text-sky-300 border-sky-500/20";
      default:
        return "bg-white/5 text-white/50 border-white/10";
    }
  };

  const formatDate = (d) => {
    try {
      const date = new Date(d);
      return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
    } catch {
      return String(d || "");
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto pt-40 pb-24 px-6 space-y-8 text-white"
    >
      <div className="flex justify-between items-center">
        <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic">
          My <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-700">Bookings</span>
        </h1>
        <div className="flex gap-2">
          <span className="px-4 py-2 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm text-white/60">
            Total: {rows.length}
          </span>
        </div>
      </div>

      {/* Modern Table Container */}
      <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[40px] shadow-2xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10">
              <th className="p-6 md:p-8 text-[11px] font-black uppercase tracking-[0.2em] text-white/35">Booking</th>
              <th className="p-6 md:p-8 text-[11px] font-black uppercase tracking-[0.2em] text-white/35">Type</th>
              <th className="p-6 md:p-8 text-[11px] font-black uppercase tracking-[0.2em] text-white/35">Date</th>
              <th className="p-6 md:p-8 text-[11px] font-black uppercase tracking-[0.2em] text-white/35">Status</th>
              <th className="p-6 md:p-8 text-[11px] font-black uppercase tracking-[0.2em] text-white/35">Payment</th>
              <th className="p-8"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {loading ? (
              <tr>
                <td colSpan={6} className="p-10 text-center text-white/40 font-black tracking-widest uppercase text-[11px]">
                  Loading bookings…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-10 text-center text-white/30 space-y-3">
                  <div className="font-black tracking-[0.4em] uppercase text-[10px]">
                    No bookings yet
                  </div>
                  <div className="text-[11px] text-white/40">
                    {isJwtUser
                      ? "Book a stay or ride to see it here."
                      : "Tip: Booking history works with Customer (JWT) login. Partner (Supabase) login is for listing/admin."}
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((b) => (
                <tr key={b._id} className="group hover:bg-white/[0.03] transition-colors">
                  <td className="p-6 md:p-8">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-white font-black text-xs">
                        {(b.customerName || "U").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-black text-white text-sm tracking-tight">
                          {b.listingId?.hotelName || b.listingId?.vehicleType || "Booking"}
                        </p>
                        <p className="text-[10px] text-white/35 font-bold uppercase">{b._id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-6 md:p-8">
                    <p className="font-bold text-white/70 text-sm uppercase tracking-widest">
                      {b.bookingType}
                    </p>
                  </td>
                  <td className="p-6 md:p-8">
                    <p className="font-bold text-white/60 text-sm">
                      {formatDate(b.startDate || b.date)}
                      {b.endDate ? ` → ${formatDate(b.endDate)}` : ""}
                    </p>
                  </td>
                  <td className="p-6 md:p-8">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black border ${getStatusStyle(b.status)}`}>
                      {String(b.status || "").toUpperCase()}
                    </span>
                  </td>
                  <td className="p-6 md:p-8">
                    <p className="font-black text-white">
                      {b.paymentStatus === "paid" ? (
                        <span className="inline-flex items-center gap-2 text-green-400">
                          <CheckCircle2 size={16} /> PAID
                        </span>
                      ) : b.paymentStatus === "failed" ? (
                        <span className="inline-flex items-center gap-2 text-red-400">
                          <XCircle size={16} /> FAILED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2 text-orange-300">
                          <Clock size={16} /> PENDING
                        </span>
                      )}
                    </p>
                  </td>
                  <td className="p-6 md:p-8 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {b.status !== "cancelled" && b.status !== "completed" ? (
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          disabled={!isJwtUser || cancelingId === b._id}
                          onClick={async () => {
                            if (!isJwtUser) {
                              notify("Cancel is available for Customer (JWT) bookings.", "info");
                              return;
                            }
                            setCancelingId(b._id);
                            try {
                              const res = await API.patch(`/booking/cancel/${b._id}`);
                              const updated = res.data?.data;
                              setRows((prev) =>
                                prev.map((x) => (x._id === b._id ? { ...x, ...(updated || {}) } : x))
                              );
                              notify("Booking cancelled", "success");
                            } catch {
                              notify("Could not cancel booking", "error");
                            } finally {
                              setCancelingId(null);
                            }
                          }}
                          className="min-w-[130px]"
                        >
                          <Ban size={16} />
                          {cancelingId === b._id ? "CANCELING…" : "CANCEL"}
                        </Button>
                      ) : null}

                      <button
                        type="button"
                        onClick={() => notify("More actions coming soon (invoice / support)", "info")}
                        className="p-2 hover:bg-white/10 rounded-xl border border-transparent hover:border-white/10 transition-all"
                        aria-label="More actions"
                      >
                        <MoreVertical size={18} className="text-white/50" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default Bookings;