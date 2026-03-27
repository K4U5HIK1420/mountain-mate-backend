import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, CreditCard, Loader2, ArrowRight, XCircle } from "lucide-react";
import API from "../utils/api";
import { Button } from "../components/ui/Button";

export default function BookingConfirm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(location.state?.booking || null);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (location.state?.booking && String(location.state.booking._id) === String(id)) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        // Prefer direct endpoint (faster + reliable)
        const direct = await API.get(`/booking/me/${id}`);
        const b = direct.data?.data || null;
        if (mounted) setBooking(b);
      } catch {
        try {
          // Fallback: older method (full list)
          const res = await API.get("/user/bookings");
          const all = res.data?.data || [];
          const b = all.find((x) => String(x._id) === String(id));
          if (mounted) setBooking(b || null);
        } catch {
          if (mounted) setBooking(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [id, location.state]);

  const payNow = async () => {
    if (!booking) return;
    setPaying(true);
    try {
      const amount = booking.amount || booking.listingId?.pricePerNight || booking.listingId?.pricePerSeat || 1;
      const order = await API.post("/payment/create-order", { amount, bookingId: booking._id });
      // Mock verify (backend currently marks paid without signature verification)
      await API.post("/payment/verify", {
        bookingId: booking._id,
        paymentId: `mock_pay_${Date.now()}`,
        orderId: order.data?.id || booking.orderId,
      });
      navigate("/payment/success", { replace: true });
    } catch {
      navigate("/payment/failure", { replace: true });
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="min-h-screen pt-40 pb-24 px-6 text-white">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
        <div className="bg-white/[0.03] border border-white/10 rounded-[46px] p-8 md:p-12 backdrop-blur-2xl shadow-2xl">
          <p className="text-orange-500 font-black tracking-[0.6em] text-[10px] uppercase italic">
            Booking Confirmation
          </p>
          <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter mt-3">
            Confirm <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-700">Payment</span>
          </h1>

          {loading ? (
            <div className="mt-10 text-white/40 font-black tracking-widest uppercase text-[10px] flex items-center gap-3">
              <Loader2 className="animate-spin" /> Loading booking…
            </div>
          ) : !booking ? (
            <div className="mt-10 space-y-5">
              <div className="flex items-center gap-3 text-red-300 font-black uppercase tracking-widest text-[10px]">
                <XCircle size={18} /> Booking not found for this account
              </div>
              <Button as={Link} to="/login" variant="ghost" size="lg" className="w-full">
                Go to Login <ArrowRight size={16} />
              </Button>
            </div>
          ) : (
            <div className="mt-10 space-y-8">
              <div className="bg-white/5 border border-white/10 rounded-[32px] p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-white/35 font-black uppercase tracking-[0.3em] text-[10px]">
                      Booking
                    </p>
                    <p className="text-white font-black text-xl italic tracking-tight mt-2">
                      {booking.listingId?.hotelName || booking.listingId?.vehicleType || "Booking"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-white/35 font-black uppercase tracking-[0.3em] text-[10px]">Amount</p>
                    <p className="text-3xl font-black italic mt-2">₹{booking.amount || booking.listingId?.pricePerNight || booking.listingId?.pricePerSeat}</p>
                  </div>
                </div>
                <div className="mt-5 pt-5 border-t border-white/10 flex items-center justify-between text-white/55 text-sm">
                  <span>Status: <span className="text-white font-black uppercase">{booking.status}</span></span>
                  <span>Payment: <span className="text-white font-black uppercase">{booking.paymentStatus}</span></span>
                </div>
              </div>

              <Button disabled={paying} onClick={payNow} size="lg" className="w-full">
                {paying ? <Loader2 className="animate-spin" /> : <CreditCard size={18} />}
                {paying ? "PROCESSING…" : "PAY NOW (MOCK)"} <ArrowRight size={16} />
              </Button>

              <div className="flex items-center gap-3 text-white/30 text-[10px] font-black uppercase tracking-widest">
                <CheckCircle2 size={16} className="text-orange-400" /> Payment verification is mocked for now.
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
