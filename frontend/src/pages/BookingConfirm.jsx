import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Copy, Loader2, Upload, XCircle } from "lucide-react";
import API from "../utils/api";
import { Button } from "../components/ui/Button";

const MANUAL_UPI_ID = "anantkaushik2447-1@oksbi";
const MANUAL_PAYEE_NAME = "Anant Kaushik (MountainMateAdmin)";

export default function BookingConfirm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(location.state?.booking || null);
  const [paying, setPaying] = useState(false);
  const [transactionId, setTransactionId] = useState("");
  const [note, setNote] = useState("");
  const [paymentProof, setPaymentProof] = useState(null);
  const [copied, setCopied] = useState(false);
  const [listingSnapshot, setListingSnapshot] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (location.state?.booking && String(location.state.booking._id) === String(id)) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const direct = await API.get(`/booking/me/${id}`);
        const b = direct.data?.data || null;
        if (mounted) setBooking(b);
      } catch {
        try {
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

  useEffect(() => {
    let active = true;

    async function hydrateListingFallback() {
      if (!booking || resolveBookingAmount(booking) > 0 || !booking.listingId) {
        if (active) setListingSnapshot(null);
        return;
      }

      try {
        const endpoint = booking.bookingType === "Hotel" ? "/hotels/all" : "/transport/all";
        const res = await API.get(endpoint);
        const rows = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
        const match = rows.find((item) => String(item?._id || item?.id || "") === String(booking.listingId));
        if (active) setListingSnapshot(match || null);
      } catch {
        if (active) setListingSnapshot(null);
      }
    }

    hydrateListingFallback();
    return () => {
      active = false;
    };
  }, [booking]);

  const copyUpiId = async () => {
    try {
      await navigator.clipboard.writeText(MANUAL_UPI_ID);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const submitManualPayment = async () => {
    if (!booking || !paymentProof) return;

    setPaying(true);
    try {
      const formData = new FormData();
      formData.append("paymentProof", paymentProof);
      if (transactionId.trim()) formData.append("transactionId", transactionId.trim());
      if (note.trim()) formData.append("note", note.trim());

      const res = await API.post(`/booking/${booking._id}/manual-payment`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setBooking(res.data?.data || booking);
      navigate("/bookings", { replace: true });
    } catch {
      navigate("/payment/failure", { replace: true });
    } finally {
      setPaying(false);
    }
  };

  const amount = resolveBookingAmount(booking, listingSnapshot);
  const upiUrl = buildUpiPaymentUrl({
    upiId: MANUAL_UPI_ID,
    payeeName: MANUAL_PAYEE_NAME,
    amount,
    bookingId: booking?._id,
  });
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=720x720&data=${encodeURIComponent(upiUrl)}`;

  return (
    <div className="min-h-screen pt-40 pb-24 px-6 text-white">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto">
        <div className="bg-white/[0.03] border border-white/10 rounded-[46px] p-8 md:p-12 backdrop-blur-2xl shadow-2xl">
          <p className="text-orange-500 font-black tracking-[0.6em] text-[10px] uppercase italic">
            Booking Confirmation
          </p>
          <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter mt-3">
            Confirm <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-700">Payment</span>
          </h1>

          {loading ? (
            <div className="mt-10 text-white/40 font-black tracking-widest uppercase text-[10px] flex items-center gap-3">
              <Loader2 className="animate-spin" /> Loading booking...
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
                    <p className="text-white/35 font-black uppercase tracking-[0.3em] text-[10px]">Booking</p>
                    <p className="text-white font-black text-xl italic tracking-tight mt-2">
                      {booking.listingLabel || booking.listingId?.hotelName || booking.listingId?.vehicleType || "Booking"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-white/35 font-black uppercase tracking-[0.3em] text-[10px]">Amount</p>
                    <p className="text-3xl font-black italic mt-2">Rs {amount}</p>
                  </div>
                </div>
                <div className="mt-5 pt-5 border-t border-white/10 flex items-center justify-between text-white/55 text-sm">
                  <span>Status: <span className="text-white font-black uppercase">{booking.status}</span></span>
                  <span>Payment: <span className="text-white font-black uppercase">{booking.paymentStatus}</span></span>
                </div>
                </div>

              <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
                <div className="rounded-[32px] border border-white/10 bg-white/5 p-5">
                  <img src={qrImageUrl} alt="Mountain Mate UPI QR" className="w-full rounded-[24px] border border-white/10 bg-white object-cover" />
                </div>

                <div className="space-y-5 rounded-[32px] border border-white/10 bg-white/5 p-6">
                  <div>
                    <p className="text-orange-500 font-black tracking-[0.4em] text-[10px] uppercase italic">Manual UPI Payment</p>
                    <h2 className="mt-3 text-2xl font-black italic uppercase tracking-tight">Scan, pay, then upload proof.</h2>
                    <p className="mt-3 text-sm leading-7 text-white/55">
                      Use Google Pay, PhonePe, Paytm, or any UPI app. Once you pay, upload the screenshot and optional UTR so admin can approve it.
                    </p>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <InfoRow label="Payee" value={MANUAL_PAYEE_NAME} />
                    <InfoRow label="UPI ID" value={MANUAL_UPI_ID} />
                    <InfoRow label="Amount" value={`Rs ${amount}`} />
                    <InfoRow label="Review" value={booking.paymentStatus === "under_review" ? "Under admin review" : booking.paymentStatus} />
                  </div>

                  <Button type="button" variant="ghost" onClick={copyUpiId} className="w-full">
                    <Copy size={16} /> {copied ? "UPI ID COPIED" : "COPY UPI ID"}
                  </Button>

                  {booking.paymentStatus === "under_review" || booking.paymentStatus === "paid" ? (
                    <div className="rounded-[24px] border border-orange-500/20 bg-orange-500/10 px-5 py-4 text-sm leading-7 text-white/70">
                      {booking.paymentStatus === "paid"
                        ? "Payment has already been approved. The booking can now move through the normal confirmation flow."
                        : "Your payment screenshot has already been submitted. Admin approval is pending."}
                    </div>
                  ) : (
                    <>
                      <label className="block text-[10px] font-black uppercase tracking-[0.28em] text-white/35">
                        Transaction / UTR ID
                        <input
                          value={transactionId}
                          onChange={(e) => setTransactionId(e.target.value)}
                          placeholder="Optional but recommended"
                          className="mt-3 w-full rounded-[24px] border border-white/10 bg-black/20 px-5 py-4 text-sm font-bold text-white outline-none"
                        />
                      </label>

                      <label className="block text-[10px] font-black uppercase tracking-[0.28em] text-white/35">
                        Note
                        <textarea
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          rows={3}
                          placeholder="Any note for admin review"
                          className="mt-3 w-full rounded-[24px] border border-white/10 bg-black/20 px-5 py-4 text-sm text-white outline-none resize-none"
                        />
                      </label>

                      <label className="block text-[10px] font-black uppercase tracking-[0.28em] text-white/35">
                        Payment Screenshot
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setPaymentProof(e.target.files?.[0] || null)}
                          className="mt-3 block w-full rounded-[24px] border border-white/10 bg-black/20 px-5 py-4 text-sm text-white outline-none file:mr-4 file:rounded-full file:border-0 file:bg-orange-500 file:px-4 file:py-2 file:text-[10px] file:font-black file:uppercase file:tracking-[0.2em] file:text-white"
                        />
                      </label>

                      <Button disabled={paying || !paymentProof} onClick={submitManualPayment} size="lg" className="w-full">
                        {paying ? <Loader2 className="animate-spin" /> : <Upload size={18} />}
                        {paying ? "SUBMITTING..." : "SUBMIT PAYMENT PROOF"} <ArrowRight size={16} />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 text-white/30 text-[10px] font-black uppercase tracking-widest">
                <CheckCircle2 size={16} className="text-orange-400" /> Admin approves payment proof before final confirmation.
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="rounded-[20px] border border-white/10 bg-black/20 px-4 py-4">
      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/35">{label}</p>
      <p className="mt-2 text-sm font-bold text-white break-all">{value}</p>
    </div>
  );
}

function resolveBookingAmount(booking, listingSnapshot = null) {
  if (!booking) return 0;

  const storedAmount = Number(booking.amount || 0);
  if (storedAmount > 0) return storedAmount;

  const trackedAmount = Number(booking?.liveTracking?.pricing?.totalAmount || 0);
  if (trackedAmount > 0) return trackedAmount;

  const quantity = booking.bookingType === "Hotel"
    ? Math.max(1, Number(booking.rooms || 1))
    : Math.max(1, Number(booking.guests || 1));

  const basePrice = Number(
    booking?.liveTracking?.pricing?.unitPrice ||
    booking?.listingId?.pricePerNight ||
    booking?.listingId?.pricePerSeat ||
    listingSnapshot?.pricePerNight ||
    listingSnapshot?.pricePerSeat ||
    0
  );

  if (basePrice > 0) return basePrice * quantity;
  return 0;
}

function buildUpiPaymentUrl({ upiId, payeeName, amount, bookingId }) {
  const params = new URLSearchParams({
    pa: upiId,
    pn: payeeName,
    cu: "INR",
  });

  if (Number(amount) > 0) params.set("am", Number(amount).toFixed(2));
  if (bookingId) params.set("tn", `Booking ${bookingId}`);

  return `upi://pay?${params.toString()}`;
}
