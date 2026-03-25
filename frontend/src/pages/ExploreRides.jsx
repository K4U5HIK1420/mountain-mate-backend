import React, { useEffect, useState } from "react";
import socket from "../utils/socket";
import API from "../utils/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Car,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Compass,
  Fuel,
  Gauge,
  MapPin,
  Minus,
  Navigation,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  X,
} from "lucide-react";
import { useNotify } from "../context/NotificationContext";
import RoutePreview from "../components/RoutePreview";
import { RidesGridSkeleton } from "../components/Skeletons";
import { Button } from "../components/ui/Button";
import { Container } from "../components/ui/Container";

const ease = [0.22, 1, 0.36, 1];

const ExploreRides = () => {
  const { notify } = useNotify();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRide, setSelectedRide] = useState(null);
  const [currentModalImgIndex, setCurrentModalImgIndex] = useState(0);
  const [bookingSeats, setBookingSeats] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pickupFilter, setPickupFilter] = useState("");
  const [dropFilter, setDropFilter] = useState("");
  const [expandedRideId, setExpandedRideId] = useState(null);

  useEffect(() => {
    document.body.style.overflow = selectedRide ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedRide]);

  useEffect(() => {
    socket.on("seatsUpdated", (data) => {
      setRides((prev) =>
        prev.map((ride) =>
          ride._id === data.rideId
            ? { ...ride, seatsAvailable: data.seatsAvailable }
            : ride
        )
      );
    });
    return () => socket.off("seatsUpdated");
  }, []);

  const loadApprovedRides = async () => {
    setLoading(true);
    try {
      const res = await API.get("/transport/all");
      setRides(res.data.data || res.data || []);
    } catch {
      setRides([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApprovedRides();
  }, []);

  const fetchListings = async () => {
    if (!pickupFilter && !dropFilter) return loadApprovedRides();
    setLoading(true);
    try {
      const response = await API.get("/transport/search", {
        params: { from: pickupFilter, to: dropFilter },
      });
      setRides(response.data.data || response.data || []);
    } catch {
      setRides([]);
    } finally {
      setLoading(false);
    }
  };

  const bookRide = async () => {
    try {
      setIsProcessing(true);
      const token = localStorage.getItem("token");
      if (!token) {
        notify("Please log in before booking a ride.", "error");
        return;
      }

      const res = await API.post("/transport/book", {
        rideId: selectedRide._id,
        seats: bookingSeats,
      });

      if (res.data.success) {
        notify("Expedition secured.", "success");
        const message = `Namaste! I just booked ${bookingSeats} seat(s) in your ${selectedRide.vehicleType} via Mountain Mate.`;
        window.open(
          `https://wa.me/${selectedRide.contactNumber}?text=${encodeURIComponent(message)}`,
          "_blank"
        );
        setSelectedRide(null);
        loadApprovedRides();
      }
    } catch {
      notify("Logistics error.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const nextImage = () => {
    if (!selectedRide?.images?.length) return;
    setCurrentModalImgIndex(
      (prev) => (prev + 1) % selectedRide.images.length
    );
  };

  const previousImage = () => {
    if (!selectedRide?.images?.length) return;
    setCurrentModalImgIndex(
      (prev) => (prev - 1 + selectedRide.images.length) % selectedRide.images.length
    );
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#040404] text-white">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute right-[-8rem] top-10 h-[34rem] w-[34rem] rounded-full bg-orange-500/10 blur-[150px]" />
        <div className="absolute left-[5%] top-[30rem] h-[28rem] w-[28rem] rounded-full bg-amber-300/7 blur-[150px]" />
      </div>

      <Container className="relative z-10 pb-20 pt-32">
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, ease }}
          className="mb-14"
        >
          <div className="relative overflow-hidden rounded-[42px] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.09),rgba(255,255,255,0.02)),radial-gradient(circle_at_top,rgba(249,115,22,0.18),transparent_36%),rgba(8,8,8,0.94)] p-6 shadow-[0_38px_100px_rgba(0,0,0,0.45)] md:p-10">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-400/70 to-transparent" />
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
              <div>
                <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/6 px-4 py-2 backdrop-blur-xl">
                  <Sparkles size={13} className="text-orange-400" />
                  <span className="text-[9px] font-black uppercase tracking-[0.42em] text-white/60">Fleet Deployment Active</span>
                </div>
                <h1 className="text-5xl font-black uppercase italic tracking-[-0.06em] text-white md:text-7xl lg:text-[8.5rem] lg:leading-[0.82]">
                  Hire your
                  <br />
                  <span className="bg-gradient-to-b from-white via-amber-100 to-orange-500 bg-clip-text text-transparent">
                    Expedition.
                  </span>
                </h1>
                <p className="mt-6 max-w-2xl text-base leading-8 text-white/62 md:text-lg">
                  The rides flow now matches the rest of the app: stronger search framing, more premium vehicle cards, and a smoother booking panel.
                </p>
              </div>

              <div className="cinematic-surface rounded-[30px] p-6">
                <p className="text-[10px] font-black uppercase tracking-[0.38em] text-orange-300">Ride Signal</p>
                <div className="mt-5 grid grid-cols-2 gap-4">
                  <Metric title="Active fleets" value={`${rides.length}+`} />
                  <Metric title="Live state" value="Tracked" />
                </div>
              </div>
            </div>

            <div className="mt-10 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
              <FilterField icon={<MapPin size={16} />} label="Pickup">
                <input
                  onChange={(e) => setPickupFilter(e.target.value)}
                  placeholder="SOURCE"
                  className="w-full bg-transparent text-sm font-black uppercase tracking-[0.18em] text-white outline-none placeholder:text-white/24"
                />
              </FilterField>
              <FilterField icon={<Navigation size={16} />} label="Destination">
                <input
                  onChange={(e) => setDropFilter(e.target.value)}
                  placeholder="DESTINATION"
                  className="w-full bg-transparent text-sm font-black uppercase tracking-[0.18em] text-white outline-none placeholder:text-white/24"
                />
              </FilterField>
              <Button size="lg" onClick={fetchListings} className="rounded-[26px] text-[11px] tracking-[0.28em]">
                Scan Fleet <Search size={16} />
              </Button>
            </div>
          </div>
        </motion.section>

        {loading ? (
          <RidesGridSkeleton />
        ) : (
          <section className="space-y-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.42em] text-orange-300">Fleet Grid</p>
                <h2 className="mt-3 text-3xl font-black uppercase italic tracking-[-0.04em] text-white md:text-5xl">
                  Routes with cinematic weight.
                </h2>
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-4 py-3 text-[10px] font-black uppercase tracking-[0.28em] text-white/50 backdrop-blur-xl">
                {rides.length} ride options ready
              </div>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
              {rides.map((ride) => (
                <RideCard
                  key={ride._id}
                  ride={ride}
                  onSelect={() => {
                    setSelectedRide(ride);
                    setCurrentModalImgIndex(0);
                  }}
                  isExpanded={expandedRideId === ride._id}
                  onToggleExpand={() =>
                    setExpandedRideId(expandedRideId === ride._id ? null : ride._id)
                  }
                />
              ))}
            </div>
          </section>
        )}
      </Container>

      <AnimatePresence>
        {selectedRide && (
          <RideModal
            ride={selectedRide}
            onClose={() => setSelectedRide(null)}
            bookingSeats={bookingSeats}
            setBookingSeats={setBookingSeats}
            isProcessing={isProcessing}
            onConfirm={bookRide}
            currentImgIndex={currentModalImgIndex}
            setCurrentImgIndex={setCurrentModalImgIndex}
            onNextImage={nextImage}
            onPreviousImage={previousImage}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const RideCard = ({ ride, onSelect, isExpanded, onToggleExpand }) => (
  <motion.article
    whileHover={{ y: -8 }}
    className="group overflow-hidden rounded-[34px] border border-white/10 bg-[#090909] shadow-[0_28px_80px_rgba(0,0,0,0.32)]"
  >
    <div className="relative h-72 overflow-hidden bg-black/40">
      <img src={ride.images?.[0]} className="absolute inset-0 h-full w-full object-cover opacity-70 transition-transform duration-700 ease-out group-hover:scale-110" alt={ride.vehicleType} />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.05),rgba(0,0,0,0.2)_34%,rgba(0,0,0,0.92)_100%)]" />
      <div className="absolute left-6 right-6 top-6 flex items-center justify-between">
        <div className="rounded-full border border-white/12 bg-black/35 px-4 py-2 backdrop-blur-xl">
          <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-white">
            <Star size={12} className="fill-orange-400 text-orange-400" />
            Curated ride
          </span>
        </div>
        <div className="rounded-full bg-gradient-to-r from-orange-500 to-amber-400 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-white shadow-[0_14px_36px_rgba(249,115,22,0.28)]">
          Rs {ride.pricePerSeat}
        </div>
      </div>
    </div>

    <div className="space-y-6 p-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-3xl font-black uppercase italic tracking-tight text-white">{ride.vehicleType}</h3>
          <p className="mt-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-orange-300">
            <MapPin size={12} />
            {ride.routeFrom}
            <span className="h-px w-4 bg-orange-500/50" />
            {ride.routeTo}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-center">
          <p className="text-lg font-black italic text-orange-300">{ride.seatsAvailable}</p>
          <p className="text-[8px] font-black uppercase tracking-[0.28em] text-white/35">Open</p>
        </div>
      </div>

      <div className="rounded-[24px] border border-orange-500/12 bg-orange-500/6 p-4">
        <p className="flex items-start gap-3 text-[10px] font-black uppercase tracking-[0.18em] text-white/52">
          <Sparkles size={14} className="mt-0.5 text-orange-300" />
          Terrain nominal. Fast route availability and cleaner booking flow detected.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button onClick={onSelect} className="rounded-[20px] text-[10px] tracking-[0.22em]">
          Book <ArrowRight size={14} />
        </Button>
        <Button variant="ghost" onClick={onToggleExpand} className="rounded-[20px] text-[10px] tracking-[0.22em]">
          {isExpanded ? "Hide Map" : "Open Map"}
        </Button>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease }}
            className="overflow-hidden pt-2"
          >
            <div className="overflow-hidden rounded-[26px] border border-white/10 bg-black/40 p-1">
              <RoutePreview pickupCoords={ride.fromCoords} destinationCoords={ride.toCoords} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  </motion.article>
);

const RideModal = ({
  ride,
  onClose,
  bookingSeats,
  setBookingSeats,
  isProcessing,
  onConfirm,
  currentImgIndex,
  setCurrentImgIndex,
  onNextImage,
  onPreviousImage,
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-[5000] p-4 md:p-8"
  >
    <button onClick={onClose} className="absolute inset-0 h-full w-full bg-black/88 backdrop-blur-2xl" aria-label="Close ride modal" />

    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 24, scale: 0.985 }}
      transition={{ duration: 0.45, ease }}
      className="relative mx-auto flex h-full max-h-[92vh] w-full max-w-[1320px] overflow-hidden rounded-[38px] border border-white/10 bg-[#070707] shadow-[0_42px_140px_rgba(0,0,0,0.55)] lg:grid lg:grid-cols-[1.05fr_0.95fr]"
    >
      <div className="relative min-h-[320px] overflow-hidden border-b border-white/8 lg:border-b-0 lg:border-r">
        <AnimatePresence mode="wait">
          <motion.img
            key={currentImgIndex}
            src={ride.images?.[currentImgIndex]}
            alt={ride.vehicleType}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.45, ease }}
            className="h-full w-full object-cover"
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.12),rgba(0,0,0,0.18)_38%,rgba(0,0,0,0.76)_100%)]" />

        <div className="absolute left-6 right-6 top-6 flex items-center justify-between">
          <div className="rounded-full border border-white/12 bg-black/35 px-4 py-2 backdrop-blur-xl">
            <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-white">
              <ShieldCheck size={12} className="text-orange-300" />
              Vetted Fleet
            </span>
          </div>
          <button onClick={onClose} className="flex h-12 w-12 items-center justify-center rounded-full border border-white/12 bg-black/40 text-white transition-colors hover:bg-red-500">
            <X size={18} />
          </button>
        </div>

        {ride.images?.length > 1 && (
          <>
            <button onClick={onPreviousImage} className="absolute left-6 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/12 bg-black/40 text-white transition-colors hover:bg-white hover:text-black">
              <ChevronLeft size={18} />
            </button>
            <button onClick={onNextImage} className="absolute right-6 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/12 bg-black/40 text-white transition-colors hover:bg-white hover:text-black">
              <ChevronRight size={18} />
            </button>
          </>
        )}

        <div className="absolute inset-x-0 bottom-0 p-6">
          <div className="flex gap-3 overflow-x-auto no-scrollbar">
            {ride.images?.map((img, idx) => (
              <button
                key={img || idx}
                onClick={() => setCurrentImgIndex(idx)}
                className={`h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 transition-all duration-300 ${currentImgIndex === idx ? "border-orange-400 scale-105" : "border-transparent opacity-55 hover:opacity-100"}`}
              >
                <img src={img} alt={`${ride.vehicleType} ${idx + 1}`} className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="no-scrollbar overflow-y-auto p-6 md:p-8 lg:p-10">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-orange-300">Ride Brief</p>
            <h2 className="mt-4 text-4xl font-black uppercase italic tracking-[-0.05em] text-white md:text-5xl">
              {ride.vehicleType}
            </h2>
            <p className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-white/52">
              <Compass size={12} className="text-orange-300" />
              {ride.routeFrom} to {ride.routeTo}
            </p>
          </div>
          <div className="rounded-[24px] bg-gradient-to-r from-orange-500 to-amber-400 px-5 py-4 text-right text-white shadow-[0_16px_40px_rgba(249,115,22,0.25)]">
            <p className="text-[10px] font-black uppercase tracking-[0.26em]">Per Seat</p>
            <p className="mt-2 text-3xl font-black italic">Rs {ride.pricePerSeat}</p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <SpecBox icon={<Gauge size={16} />} label="Category" val={ride.carType || "SUV"} />
          <SpecBox icon={<Fuel size={16} />} label="Open Seats" val={`${ride.seatsAvailable} free`} />
        </div>

        <div className="mt-8 rounded-[28px] border border-white/8 bg-white/5 p-6">
          <div className="flex items-center justify-between border-b border-white/8 pb-5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.32em] text-white/35">Mission Fare</p>
              <p className="mt-3 text-4xl font-black italic text-white">Rs {ride.pricePerSeat}</p>
            </div>
            <TrendingUp size={24} className="text-orange-300/40" />
          </div>

          <div className="mt-6 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.32em] text-orange-300">Seat Assignment</p>
            <div className="mt-5 flex items-center justify-center gap-8">
              <button onClick={() => setBookingSeats((count) => Math.max(1, count - 1))} className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white">
                <Minus size={18} />
              </button>
              <span className="text-5xl font-black italic text-white">{bookingSeats}</span>
              <button onClick={() => setBookingSeats((count) => Math.max(1, Math.min(ride.seatsAvailable, count + 1)))} className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-r from-orange-500 to-amber-400 text-white">
                <Plus size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-[28px] border border-white/8 bg-white/5 p-6">
          <p className="flex items-start gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-white/56">
            <CheckCircle2 size={14} className="mt-0.5 text-orange-300" />
            Direct contact handoff is triggered after booking so you can coordinate with the driver immediately.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <Button size="lg" onClick={onConfirm} disabled={isProcessing} className="rounded-[24px] text-[11px] tracking-[0.28em]">
            {isProcessing ? "Processing..." : <><Phone size={16} /> Confirm Ride</>}
          </Button>
          <Button size="lg" variant="ghost" onClick={onClose} className="rounded-[24px] text-[11px] tracking-[0.28em]">
            Close Panel
          </Button>
        </div>
      </div>
    </motion.div>
  </motion.div>
);

function FilterField({ icon, label, children }) {
  return (
    <div className="rounded-[26px] border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-xl">
      <div className="mb-3 flex items-center gap-3 text-orange-300">
        {icon}
        <span className="text-[9px] font-black uppercase tracking-[0.35em] text-white/40">{label}</span>
      </div>
      {children}
    </div>
  );
}

function Metric({ title, value }) {
  return (
    <div className="rounded-[24px] border border-white/8 bg-white/5 px-4 py-5">
      <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/38">{title}</p>
      <p className="mt-3 text-2xl font-black uppercase italic tracking-tight text-white">{value}</p>
    </div>
  );
}

function SpecBox({ icon, label, val }) {
  return (
    <div className="rounded-[24px] border border-white/8 bg-white/5 p-5">
      <div className="flex items-center gap-3 text-orange-300">
        {icon}
        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/36">{label}</p>
      </div>
      <p className="mt-4 text-xl font-black uppercase italic tracking-tight text-white">{val}</p>
    </div>
  );
}

export default ExploreRides;
