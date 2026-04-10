import React, { useCallback, useEffect, useMemo, useState } from "react";
import API from "../utils/api";
import socket from "../utils/socket";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Calendar, Car, CarFront, CheckCircle2, Clock3, Loader2, MapPin, Navigation, Search, ShieldCheck, Sparkles, Users, X } from "lucide-react";
import { useNotify } from "../context/NotificationContext";
import { useAuth } from "../context/AuthContext";
import { RidesGridSkeleton } from "../components/Skeletons";
import { Button } from "../components/ui/Button";
import { Container } from "../components/ui/Container";
import { cleanValue, isValidPhone, normalizePhone } from "../utils/validation";
import { geocodePlace } from "../utils/location";
import { trackEvent } from "../utils/analytics";

const MODES = [
  { id: "car_pooling", label: "Car Pooling", icon: Car, blurb: "Reserve seats in published partner rides." },
  { id: "taxi_booking", label: "Taxi Booking", icon: CarFront, blurb: "Request a private cab with fare estimate." },
  { id: "shared_taxi", label: "Shared Taxi", icon: Users, blurb: "Book shared taxi seats with live availability." },
];

const fmtDate = (value) => {
  if (!value) return "Flexible";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Flexible" : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

export default function ExploreRides() {
  const { notify } = useNotify();
  const { user } = useAuth();
  const navigate = useNavigate();
  const today = new Date().toISOString().split("T")[0];

  const [mode, setMode] = useState("car_pooling");
  const [carPools, setCarPools] = useState([]);
  const [sharedTaxis, setSharedTaxis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pickup, setPickup] = useState("");
  const [drop, setDrop] = useState("");
  const [date, setDate] = useState("");
  const [selectedRide, setSelectedRide] = useState(null);
  const [rideSeats, setRideSeats] = useState(1);
  const [sharedSeats, setSharedSeats] = useState(1);
  const [busy, setBusy] = useState(false);
  const [contact, setContact] = useState({ name: "", phone: "", travelDate: "" });
  const [taxi, setTaxi] = useState({ pickupLocation: "", dropLocation: "", scheduledFor: "", customerName: "", customerPhone: "" });
  const [taxiQuote, setTaxiQuote] = useState(null);
  const [taxiBooking, setTaxiBooking] = useState(null);

  useEffect(() => {
    const name = user?.fullName || user?.user_metadata?.full_name || user?.displayName || user?.email?.split("@")[0] || "";
    const phone = user?.phone || user?.user_metadata?.phone || "";
    setContact((prev) => ({ ...prev, name: name || prev.name, phone: phone || prev.phone }));
    setTaxi((prev) => ({ ...prev, customerName: name || prev.customerName, customerPhone: phone || prev.customerPhone }));
  }, [user]);

  useEffect(() => {
    const handleSeatsUpdated = (data) => {
      setCarPools((prev) => prev.map((ride) => (ride._id === data.rideId ? { ...ride, seatsAvailable: data.seatsAvailable } : ride)));
    };
    socket.on("seatsUpdated", handleSeatsUpdated);
    return () => socket.off("seatsUpdated", handleSeatsUpdated);
  }, []);

  const loadRides = useCallback(async (filters = {}) => {
    setLoading(true);
    try {
      const params = { from: filters.from || undefined, to: filters.to || undefined, date: filters.date || undefined };
      const [carPoolRes, sharedTaxiRes] = await Promise.all([
        (filters.from || filters.to ? API.get("/transport/search", { params }) : API.get("/transport/all", { params: { date: params.date } })),
        (filters.from || filters.to ? API.get("/transport/shared/search", { params }) : API.get("/transport/shared/all", { params: { date: params.date } })).catch(() => ({ data: { data: [] } })),
      ]);
      setCarPools(carPoolRes.data?.data || carPoolRes.data || []);
      setSharedTaxis(sharedTaxiRes.data?.data || []);
    } catch {
      setCarPools([]);
      setSharedTaxis([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRides({ date });
  }, [date, loadRides]);

  useEffect(() => {
    document.body.style.overflow = selectedRide ? "hidden" : "auto";
    document.documentElement.style.overflow = selectedRide ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
      document.documentElement.style.overflow = "auto";
    };
  }, [selectedRide]);

  const displayRides = mode === "shared_taxi" ? sharedTaxis : carPools;
  const modeMeta = useMemo(() => MODES.find((item) => item.id === mode) || MODES[0], [mode]);

  const ensureAuth = () => {
    if (user) return true;
    notify("Please log in to continue.", "error");
    navigate("/login", { state: { from: { pathname: "/explore-rides" } } });
    return false;
  };

  const searchRides = () => loadRides({ from: pickup, to: drop, date });

  const startCarPoolBooking = async () => {
    try {
      if (!selectedRide || !ensureAuth()) return;
      if (!cleanValue(contact.name) || !isValidPhone(contact.phone) || !contact.travelDate) return notify("Add your name, phone, and travel date.", "error");
      setBusy(true);
      const res = await API.post("/booking/create", {
        customerName: contact.name.trim(),
        phoneNumber: normalizePhone(contact.phone),
        bookingType: "Transport",
        listingId: selectedRide._id,
        date: contact.travelDate,
        guests: rideSeats,
        amount: Number(selectedRide.pricePerSeat || 0) * Number(rideSeats || 1),
      });
      const booking = res.data?.data || res.data;
      trackEvent("ride_booking_started", { mode: "car_pooling", listing_id: selectedRide._id, seats: rideSeats });
      setSelectedRide(null);
      navigate(`/booking/${booking._id}/confirm`, { state: { booking } });
    } catch {
      notify("Unable to start booking right now.", "error");
    } finally {
      setBusy(false);
    }
  };

  const reserveSharedTaxi = async () => {
    try {
      if (!selectedRide || !ensureAuth()) return;
      if (!cleanValue(contact.name) || !isValidPhone(contact.phone)) return notify("Add your name and phone number.", "error");
      setBusy(true);
      const res = await API.post("/transport/shared/book", {
        rideId: selectedRide._id,
        seats: sharedSeats,
        customerName: contact.name.trim(),
        customerPhone: normalizePhone(contact.phone),
      });
      const updatedRide = res.data?.data?.ride;
      if (updatedRide) {
        setSharedTaxis((prev) => prev.map((ride) => (ride._id === updatedRide._id ? updatedRide : ride)));
        setSelectedRide(updatedRide);
      }
      trackEvent("shared_taxi_booked", { listing_id: selectedRide._id, seats: sharedSeats });
      notify("Shared taxi seats reserved.", "success");
    } catch (err) {
      notify(err?.response?.data?.message || "Unable to reserve seats.", "error");
    } finally {
      setBusy(false);
    }
  };

  const getTaxiQuote = async () => {
    try {
      if (!cleanValue(taxi.pickupLocation) || !cleanValue(taxi.dropLocation) || !taxi.scheduledFor) return notify("Add pickup, drop, and schedule first.", "warning");
      setBusy(true);
      setTaxiBooking(null);
      const [pickupCoords, dropCoords] = await Promise.all([geocodePlace(taxi.pickupLocation), geocodePlace(taxi.dropLocation)]);
      if (!pickupCoords || !dropCoords) return notify("Could not map that route.", "error");
      const res = await API.post("/transport/taxi/quote", { pickupLocation: taxi.pickupLocation, dropLocation: taxi.dropLocation, scheduledFor: taxi.scheduledFor, pickupCoords, dropCoords });
      setTaxiQuote({ ...(res.data?.data || {}), pickupCoords, dropCoords });
    } catch (err) {
      notify(err?.response?.data?.message || "Unable to estimate fare.", "error");
    } finally {
      setBusy(false);
    }
  };

  const bookTaxi = async () => {
    try {
      if (!ensureAuth()) return;
      if (!taxiQuote) return notify("Generate fare estimate first.", "warning");
      if (!cleanValue(taxi.customerName) || !isValidPhone(taxi.customerPhone)) return notify("Add a valid name and phone number.", "error");
      setBusy(true);
      const res = await API.post("/transport/taxi/book", {
        pickupLocation: taxi.pickupLocation,
        dropLocation: taxi.dropLocation,
        scheduledFor: taxi.scheduledFor,
        customerName: taxi.customerName.trim(),
        customerPhone: normalizePhone(taxi.customerPhone),
        pickupCoords: taxiQuote.pickupCoords,
        dropCoords: taxiQuote.dropCoords,
      });
      setTaxiBooking(res.data?.data || null);
      setSelectedRide(null);
      trackEvent("taxi_booking_created", { estimated_fare: taxiQuote.estimatedFare, distance_km: taxiQuote.distanceKm });
      notify("Taxi request submitted.", "success");
    } catch (err) {
      notify(err?.response?.data?.message || "Taxi booking failed.", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#040404] text-white">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute right-[-8rem] top-10 h-[34rem] w-[34rem] rounded-full bg-orange-500/10 blur-[150px]" />
        <div className="absolute left-[5%] top-[30rem] h-[28rem] w-[28rem] rounded-full bg-amber-300/7 blur-[150px]" />
      </div>
      <Container className="relative z-10 pb-16 pt-24">
        <section className="mb-10 rounded-[34px] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.09),rgba(255,255,255,0.02)),radial-gradient(circle_at_top,rgba(249,115,22,0.18),transparent_36%),rgba(8,8,8,0.94)] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.42)] md:p-7">
          <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/6 px-4 py-2 backdrop-blur-xl">
            <Sparkles size={13} className="text-orange-400" />
            <span className="text-[9px] font-black uppercase tracking-[0.42em] text-white/60">Ride Command Layer</span>
          </div>
          <h1 className="text-3xl font-black uppercase italic tracking-[-0.04em] text-white md:text-5xl lg:text-[5rem] lg:leading-[0.92]">Move Through Uttarakhand Smarter.</h1>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-white/62 md:text-base">Car pooling, private taxi booking, and shared taxi seats now live inside one premium rides surface built for mountain travel.</p>
          <div className="mt-7 grid gap-4 md:grid-cols-3">
            {MODES.map((item) => {
              const Icon = item.icon;
              const active = item.id === mode;
              return (
                <button key={item.id} type="button" onClick={() => setMode(item.id)} className={`rounded-[28px] border p-5 text-left transition ${active ? "border-orange-500/40 bg-orange-500/12" : "border-white/10 bg-white/[0.03]"}`}>
                  <div className="flex items-center justify-between"><div className={`rounded-2xl border p-3 ${active ? "border-orange-500/30 bg-orange-500/12 text-orange-200" : "border-white/10 bg-black/20 text-white/70"}`}><Icon size={20} /></div><ArrowRight size={16} className={active ? "text-orange-300" : "text-white/25"} /></div>
                  <h3 className="mt-5 text-xl font-black uppercase italic tracking-tight text-white">{item.label}</h3>
                  <p className="mt-3 text-sm leading-7 text-white/55">{item.blurb}</p>
                </button>
              );
            })}
          </div>
        </section>

        <section className="mb-8 grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.82fr)_auto]">
          <Field label="Pickup" icon={<MapPin size={16} />}><input value={pickup} onChange={(e) => setPickup(e.target.value)} placeholder="SOURCE" className="w-full bg-transparent text-sm font-black uppercase tracking-[0.18em] text-white outline-none placeholder:text-white/24" /></Field>
          <Field label="Destination" icon={<Navigation size={16} />}><input value={drop} onChange={(e) => setDrop(e.target.value)} placeholder="DESTINATION" className="w-full bg-transparent text-sm font-black uppercase tracking-[0.18em] text-white outline-none placeholder:text-white/24" /></Field>
          <Field label="Travel date" icon={<Calendar size={16} />}><input type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-transparent text-sm font-black uppercase tracking-[0.18em] text-white outline-none [color-scheme:dark]" /></Field>
          <Button size="lg" onClick={searchRides} className="rounded-[26px] text-[11px] tracking-[0.28em]">Search Rides <Search size={16} /></Button>
        </section>

        {mode === "taxi_booking" ? (
          <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02)),rgba(8,8,8,0.92)] p-6 shadow-[0_22px_60px_rgba(0,0,0,0.28)]">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Pickup location" icon={<MapPin size={16} />}><input value={taxi.pickupLocation} onChange={(e) => setTaxi((prev) => ({ ...prev, pickupLocation: e.target.value }))} placeholder="Haridwar Railway Station" className="w-full bg-transparent text-sm font-semibold text-white outline-none placeholder:text-white/25" /></Field>
                <Field label="Drop location" icon={<Navigation size={16} />}><input value={taxi.dropLocation} onChange={(e) => setTaxi((prev) => ({ ...prev, dropLocation: e.target.value }))} placeholder="Guptkashi" className="w-full bg-transparent text-sm font-semibold text-white outline-none placeholder:text-white/25" /></Field>
                <Field label="Pickup date & time" icon={<Clock3 size={16} />}><input type="datetime-local" min={`${today}T00:00`} value={taxi.scheduledFor} onChange={(e) => setTaxi((prev) => ({ ...prev, scheduledFor: e.target.value }))} className="w-full bg-transparent text-sm font-semibold text-white outline-none [color-scheme:dark]" /></Field>
                <Field label="Your name" icon={<ShieldCheck size={16} />}><input value={taxi.customerName} onChange={(e) => setTaxi((prev) => ({ ...prev, customerName: e.target.value }))} placeholder="Traveler name" className="w-full bg-transparent text-sm font-semibold text-white outline-none placeholder:text-white/25" /></Field>
                <div className="md:col-span-2"><Field label="Phone number" icon={<Users size={16} />}><input value={taxi.customerPhone} onChange={(e) => setTaxi((prev) => ({ ...prev, customerPhone: e.target.value }))} placeholder="10-digit number" className="w-full bg-transparent text-sm font-semibold text-white outline-none placeholder:text-white/25" /></Field></div>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button onClick={getTaxiQuote} disabled={busy} className="rounded-[22px] px-6 py-3 text-[10px] tracking-[0.2em]">{busy ? <Loader2 size={15} className="animate-spin" /> : <CarFront size={15} />}Get Fare Estimate</Button>
                <Button variant="ghost" onClick={bookTaxi} disabled={busy || !taxiQuote} className="rounded-[22px] px-6 py-3 text-[10px] tracking-[0.2em]">{busy ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}Book Private Taxi</Button>
              </div>
            </div>
            <div className="space-y-5">
              <InfoCard title="Fare Snapshot">{taxiQuote ? <><InfoRow label="Estimated fare" value={`Rs ${taxiQuote.estimatedFare}`} /><InfoRow label="Distance" value={`${taxiQuote.distanceKm} km`} /><InfoRow label="Travel time" value={`${taxiQuote.durationMinutes} min`} /><InfoRow label="Route engine" value={taxiQuote.source === "google_maps" ? "Google Maps" : "Distance fallback"} /></> : <p className="mt-4 text-sm leading-7 text-white/55">Generate a quote to see distance-based pricing.</p>}</InfoCard>
              <InfoCard title="Assigned Driver">{taxiBooking?.assignmentMeta?.driverName ? <><InfoRow label="Driver" value={taxiBooking.assignmentMeta.driverName} /><InfoRow label="Phone" value={taxiBooking.assignmentMeta.driverPhone || "--"} /><InfoRow label="Vehicle" value={`${taxiBooking.assignmentMeta.vehicleType || ""} ${taxiBooking.assignmentMeta.vehicleModel || ""}`.trim() || "--"} /><InfoRow label="Plate" value={taxiBooking.assignmentMeta.plateNumber || "--"} /><InfoRow label="Status" value={taxiBooking.status || "confirmed"} /></> : taxiBooking ? <p className="mt-4 text-sm leading-7 text-white/55">Your request was created. A driver will be assigned shortly.</p> : <p className="mt-4 text-sm leading-7 text-white/55">Driver details appear here right after booking.</p>}</InfoCard>
              {taxiBooking ? (
                <div className="rounded-[30px] border border-green-500/20 bg-green-500/10 p-6 shadow-[0_22px_60px_rgba(0,0,0,0.28)]">
                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-green-300">Taxi Request Created</p>
                  <p className="mt-3 text-xl font-black uppercase italic tracking-tight text-white">
                    {taxi.pickupLocation} to {taxi.dropLocation}
                  </p>
                  <div className="mt-4 space-y-3 text-sm text-white/70">
                    <p>Reference: {String(taxiBooking._id || "").slice(-6).toUpperCase()}</p>
                    <p>Pickup: {fmtDate(taxiBooking.scheduledFor)}</p>
                    <p>Fare: Rs {taxiBooking.estimatedFare || taxiQuote?.estimatedFare || 0}</p>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <Button onClick={() => navigate("/bookings")} className="rounded-[20px] text-[10px] tracking-[0.22em]">
                      View In My Bookings <ArrowRight size={14} />
                    </Button>
                    <Button variant="ghost" onClick={() => setTaxiBooking(null)} className="rounded-[20px] text-[10px] tracking-[0.22em]">
                      Close Summary
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        ) : loading ? (
          <RidesGridSkeleton />
        ) : displayRides.length ? (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
            {displayRides.map((ride) => {
              const seatsLeft = Number(mode === "shared_taxi" ? ride.seatsLeft : ride.seatsAvailable) || 0;
              const onlyFew = seatsLeft > 0 && seatsLeft <= 3;
              const image = Array.isArray(ride.images) ? ride.images.find(Boolean) : "";
              return (
                <motion.article key={ride._id} whileHover={{ y: -6 }} className="group overflow-hidden rounded-[28px] border border-white/10 bg-[#090909] shadow-[0_22px_60px_rgba(0,0,0,0.3)]">
                  <div className="relative h-[250px] overflow-hidden">{image ? <img src={image} alt={ride.vehicleType} className="h-full w-full object-cover opacity-85 transition-transform duration-700 group-hover:scale-110" /> : <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.22),transparent_45%),linear-gradient(180deg,#181818,#090909)]">{mode === "shared_taxi" ? <Users size={52} className="text-orange-300/75" /> : <Car size={52} className="text-orange-300/75" />}</div>}<div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.08),rgba(0,0,0,0.2)_35%,rgba(0,0,0,0.88)_100%)]" /><div className="absolute left-4 right-4 top-4 flex items-center justify-between"><div className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/40 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white"><ShieldCheck size={11} className="text-amber-300" />{mode === "shared_taxi" ? "Shared Taxi" : "Car Pooling"}</div><div className="rounded-full bg-gradient-to-r from-[#ff7a18] to-[#ffb347] px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white">Rs {ride.pricePerSeat}/seat</div></div></div>
                  <div className="space-y-4 p-5">
                    <div><h3 className="text-2xl font-black uppercase italic tracking-tight text-white">{ride.vehicleType || ride.serviceLabel}</h3><p className="mt-2 inline-flex items-center gap-2 text-[11px] text-white/58"><MapPin size={13} className="text-orange-300" />{ride.routeFrom} to {ride.routeTo}</p></div>
                    <div className="flex flex-wrap gap-2"><Chip text={fmtDate(ride.availableDate)} /><Chip text={`${seatsLeft} seats left`} />{onlyFew ? <span className="inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-red-300">Only {seatsLeft} seats left</span> : null}</div>
                    <Button onClick={() => { setSelectedRide(ride); setRideSeats(1); setSharedSeats(1); setContact((prev) => ({ ...prev, travelDate: ride.availableDate ? String(ride.availableDate).split("T")[0] : prev.travelDate || today })); }} size="sm" className="w-full rounded-xl py-3 text-[10px] tracking-[0.16em]">View Details <ArrowRight size={14} /></Button>
                  </div>
                </motion.article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-[34px] border border-dashed border-white/15 bg-white/[0.03] px-6 py-12 text-center"><div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-orange-500/20 bg-orange-500/10 text-orange-300"><Search size={30} /></div><p className="mt-6 text-[10px] font-black uppercase tracking-[0.42em] text-orange-300">{modeMeta.label}</p><h3 className="mt-3 text-2xl font-black uppercase italic tracking-tight text-white">No options right now.</h3><p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/55">Try another date or widen the route search.</p></div>
        )}
      </Container>

      <AnimatePresence>{selectedRide ? <RideModal ride={selectedRide} mode={mode} contact={contact} setContact={setContact} rideSeats={rideSeats} setRideSeats={setRideSeats} sharedSeats={sharedSeats} setSharedSeats={setSharedSeats} busy={busy} onClose={() => setSelectedRide(null)} onCarPoolBook={startCarPoolBooking} onSharedBook={reserveSharedTaxi} /> : null}</AnimatePresence>
    </div>
  );
}

function Field({ label, icon, children }) {
  return <label className="rounded-[26px] border border-white/10 bg-white/[0.03] px-4 py-3 backdrop-blur-xl"><div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-white/38"><span className="text-orange-300">{icon}</span>{label}</div>{children}</label>;
}

function Chip({ text }) {
  return <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1.5 text-[10px] text-white/70">{text}</div>;
}

function InfoCard({ title, children }) {
  return <div className="rounded-[30px] border border-white/10 bg-white/[0.03] p-6 shadow-[0_22px_60px_rgba(0,0,0,0.28)]"><p className="text-[10px] font-black uppercase tracking-[0.28em] text-orange-300">{title}</p>{children}</div>;
}

function InfoRow({ label, value }) {
  return <div className="mt-4 flex items-center justify-between gap-4 rounded-[20px] border border-white/10 bg-black/20 px-4 py-3"><p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/38">{label}</p><p className="text-sm font-bold text-white">{value}</p></div>;
}

function RideModal({ ride, mode, contact, setContact, rideSeats, setRideSeats, sharedSeats, setSharedSeats, busy, onClose, onCarPoolBook, onSharedBook }) {
  const isShared = mode === "shared_taxi";
  const seatsLeft = Number(isShared ? ride.seatsLeft : ride.seatsAvailable) || 0;
  const activeSeats = isShared ? sharedSeats : rideSeats;
  const setSeats = isShared ? setSharedSeats : setRideSeats;
  const total = Number(ride.pricePerSeat || 0) * Number(activeSeats || 1);
  const image = Array.isArray(ride.images) ? ride.images.find(Boolean) : "";

  return (
    <motion.div className="fixed inset-0 z-[90] overflow-y-auto px-4 py-6">
      <button onClick={onClose} className="absolute inset-0 h-full w-full bg-black/92 backdrop-blur-2xl" aria-label="Close ride modal" />
      <motion.div initial={{ opacity: 0, y: 32, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.98 }} transition={{ duration: 0.28 }} className="relative z-10 mx-auto grid max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-[34px] border border-white/10 bg-[#060606] shadow-[0_32px_90px_rgba(0,0,0,0.55)] lg:grid-cols-[1fr_0.95fr]">
        <div className="relative min-h-[260px] bg-black">{image ? <img src={image} alt={ride.vehicleType} className="h-full w-full object-cover opacity-90" /> : <div className="flex h-full min-h-[320px] items-center justify-center bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.22),transparent_45%),linear-gradient(180deg,#181818,#090909)]">{isShared ? <Users size={68} className="text-orange-300/75" /> : <Car size={68} className="text-orange-300/75" />}</div>}<div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.12),rgba(0,0,0,0.78))]" /><button onClick={onClose} className="absolute right-5 top-5 rounded-full border border-white/20 bg-black/55 px-4 py-2 text-sm text-white/90"><X size={16} /></button></div>
        <div className="overflow-y-auto p-6 md:p-7">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-orange-300">{isShared ? "Shared Taxi" : "Car Pooling"}</p>
          <h3 className="mt-2 text-3xl font-black uppercase italic tracking-tight text-white">{ride.vehicleType || ride.serviceLabel}</h3>
          <p className="mt-3 inline-flex items-center gap-2 text-sm text-white/65"><MapPin size={15} className="text-orange-300" />{ride.routeFrom} to {ride.routeTo}</p>
          <div className="mt-6 grid gap-3 md:grid-cols-3"><InfoRow label="Travel date" value={fmtDate(ride.availableDate)} /><InfoRow label="Seats left" value={`${seatsLeft}`} /><InfoRow label="Driver" value={ride.driverOnline === false ? "Offline" : "Online"} /></div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Field label="Traveler Name" icon={<Users size={16} />}><input value={contact.name} onChange={(e) => setContact((prev) => ({ ...prev, name: e.target.value }))} className="w-full bg-transparent text-sm font-semibold text-white outline-none" /></Field>
            <Field label="Phone Number" icon={<ShieldCheck size={16} />}><input value={contact.phone} onChange={(e) => setContact((prev) => ({ ...prev, phone: e.target.value }))} className="w-full bg-transparent text-sm font-semibold text-white outline-none" /></Field>
            {!isShared ? <Field label="Travel Date" icon={<Calendar size={16} />}><input type="date" value={contact.travelDate} onChange={(e) => setContact((prev) => ({ ...prev, travelDate: e.target.value }))} className="w-full bg-transparent text-sm font-semibold text-white outline-none [color-scheme:dark]" /></Field> : null}
          </div>
          <div className="mt-6 rounded-[26px] border border-white/10 bg-white/[0.03] p-5"><div className="flex items-center justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[0.24em] text-orange-300">{isShared ? "Seats to reserve" : "Seats to request"}</p><p className="mt-2 text-sm text-white/55">{isShared ? "Shared taxis confirm immediately if seats are still open." : "Car pooling continues through the existing booking flow."}</p></div><div className="flex items-center gap-3 rounded-full border border-white/10 bg-black/30 px-3 py-2"><button type="button" onClick={() => setSeats((count) => Math.max(1, count - 1))} className="h-10 w-10 rounded-full border border-white/10 bg-white/5 text-lg text-white">-</button><span className="min-w-[2ch] text-center text-xl font-black italic text-white">{activeSeats}</span><button type="button" onClick={() => setSeats((count) => Math.min(seatsLeft, count + 1))} className="h-10 w-10 rounded-full border border-orange-500/30 bg-orange-500/15 text-lg text-orange-200">+</button></div></div></div>
          <div className="mt-6 flex items-center justify-between gap-4 rounded-[26px] border border-white/10 bg-white/[0.03] p-5"><div><p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/40">Estimated total</p><p className="mt-2 text-3xl font-black italic text-white">Rs {total}</p></div><Button onClick={isShared ? onSharedBook : onCarPoolBook} disabled={busy} className="rounded-[22px] px-6 py-3 text-[10px] tracking-[0.22em]">{busy ? <Loader2 size={15} className="animate-spin" /> : isShared ? <CheckCircle2 size={15} /> : <ArrowRight size={15} />}{isShared ? "Reserve Seats" : "Continue Booking"}</Button></div>
        </div>
      </motion.div>
    </motion.div>
  );
}
