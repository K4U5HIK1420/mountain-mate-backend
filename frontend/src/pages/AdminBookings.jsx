import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Loader2, Save } from "lucide-react";
import API from "../utils/api";
import { useNotify } from "../context/NotificationContext";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/Button";

export default function AdminBookings() {
  const { notify } = useNotify();
  const { user, role } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [savingId, setSavingId] = useState(null);

  const isJwtAdmin = useMemo(() => role === "admin" && !!localStorage.getItem("token"), [role]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await API.get("/admin/bookings");
      setRows(res.data?.data || []);
    } catch (e) {
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!user || !isJwtAdmin) {
    return (
      <div className="min-h-screen pt-40 pb-24 px-6 text-white">
        <div className="max-w-xl mx-auto bg-white/[0.03] border border-white/10 rounded-[40px] p-10 backdrop-blur-2xl shadow-2xl">
          <div className="flex items-center gap-3 text-orange-400 font-black uppercase tracking-widest text-[10px]">
            <ShieldCheck size={18} /> Admin access required (JWT admin)
          </div>
          <p className="text-white/40 mt-4 text-sm">
            Login with a JWT admin account to manage bookings here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-40 pb-24 px-6 text-white">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between gap-6 mb-10">
          <div>
            <p className="text-orange-500 font-black tracking-[0.6em] text-[10px] uppercase italic">
              Admin
            </p>
            <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter">
              Booking <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-700">Control</span>
            </h1>
          </div>
          <Button onClick={load} variant="ghost" size="lg">
            Refresh
          </Button>
        </div>

        <div className="bg-white/[0.03] border border-white/10 rounded-[40px] overflow-hidden shadow-2xl backdrop-blur-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10">
                <th className="p-6 text-[11px] font-black uppercase tracking-[0.2em] text-white/35">Customer</th>
                <th className="p-6 text-[11px] font-black uppercase tracking-[0.2em] text-white/35">Item</th>
                <th className="p-6 text-[11px] font-black uppercase tracking-[0.2em] text-white/35">Status</th>
                <th className="p-6 text-[11px] font-black uppercase tracking-[0.2em] text-white/35">Payment</th>
                <th className="p-6"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-white/40 font-black tracking-widest uppercase text-[10px]">
                    <Loader2 className="inline-block animate-spin mr-2" />
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-white/35 font-black tracking-widest uppercase text-[10px]">
                    No bookings
                  </td>
                </tr>
              ) : (
                rows.map((b) => (
                  <AdminRow key={b._id} b={b} savingId={savingId} setSavingId={setSavingId} notify={notify} setRows={setRows} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}

function AdminRow({ b, savingId, setSavingId, notify, setRows }) {
  const [status, setStatus] = useState(b.status);
  const [paymentStatus, setPaymentStatus] = useState(b.paymentStatus);

  const save = async () => {
    setSavingId(b._id);
    try {
      const res = await API.patch(`/admin/bookings/${b._id}`, { status, paymentStatus });
      const updated = res.data?.data;
      setRows((prev) => prev.map((x) => (x._id === b._id ? updated : x)));
      notify("Updated", "success");
    } catch (e) {
      notify("Update failed", "error");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <tr className="hover:bg-white/[0.03] transition-colors">
      <td className="p-6">
        <div className="text-white font-black text-sm">{b.user?.name || b.customerName || "Customer"}</div>
        <div className="text-white/35 text-[10px] font-bold uppercase">{b.user?.email || ""}</div>
      </td>
      <td className="p-6">
        <div className="text-white font-black text-sm">{b.listingId?.hotelName || b.listingId?.vehicleType || "Booking"}</div>
        <div className="text-white/35 text-[10px] font-bold uppercase">{b.bookingType}</div>
      </td>
      <td className="p-6">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-white font-black uppercase tracking-widest text-[10px]">
          {["pending", "confirmed", "completed", "cancelled"].map((s) => (
            <option key={s} className="bg-black" value={s}>{s}</option>
          ))}
        </select>
      </td>
      <td className="p-6">
        <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} className="bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-white font-black uppercase tracking-widest text-[10px]">
          {["pending", "paid", "failed"].map((s) => (
            <option key={s} className="bg-black" value={s}>{s}</option>
          ))}
        </select>
      </td>
      <td className="p-6 text-right">
        <Button onClick={save} disabled={savingId === b._id} size="sm">
          <Save size={16} /> {savingId === b._id ? "SAVING…" : "SAVE"}
        </Button>
      </td>
    </tr>
  );
}

