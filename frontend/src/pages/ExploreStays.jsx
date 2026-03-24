import API from "../utils/api";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Compass,
  Coffee,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Thermometer,
  Waves,
  Wifi,
  Wind,
  Zap,
  Car,
  X,
} from "lucide-react";
import { StaysGridSkeleton } from "../components/Skeletons";
import { useNotify } from "../context/NotificationContext";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/Button";
import { Container } from "../components/ui/Container";

const motionEase = [0.22, 1, 0.36, 1];

const amenityIcons = {
  wifi: <Wifi size={16} />,
  parking: <Car size={16} />,
  breakfast: <Coffee size={16} />,
  hotWater: <Thermometer size={16} />,
  mountainView: <Wind size={16} />,
  powerBackup: <Zap size={16} />,
  pool: <Waves size={16} />,
};

const quickFilters = ["Temple Access", "Mountain View", "Family Stay", "High Rated"];

const ExploreStays = () => {
  const { notify } = useNotify();
  const { user } = useAuth();
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ratingMap, setRatingMap] = useState({});
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [locationFilter, setLocationFilter] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("newest");
  const [checkInDate, setCheckInDate] = useState("");

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    document.body.style.overflow = selectedHotel ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedHotel]);

  useEffect(() => {
    if (selectedHotel) {
      setCurrentImgIndex(0);
    }
  }, [selectedHotel]);

  const fetchHotels = async () => {
    setLoading(true);
    try {
      const response = await API.get("/hotel/search", {
        params: {
          location: locationFilter.toLowerCase(),
          minPrice,
          maxPrice,
          sort,
          checkInDate,
        },
      });
      const list = response.data.data || response.data || [];
      setHotels(list);

      const ids = list.map((hotel) => hotel._id).join(",");
      if (ids) {
        const summary = await API.get("/review/summary", { params: { ids } });
        setRatingMap(summary.data?.data || {});
      } else {
        setRatingMap({});
      }
    } catch (error) {
      notify("Uplink Interrupted", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHotels();
  }, []);

  const handleApplyQuickFilter = (label) => {
    if (label === "Mountain View") {
      setLocationFilter("mountain");
    }
    if (label === "High Rated") {
      setSort("priceLowToHigh");
    }
  };

  const nextImage = () => {
    if (!selectedHotel?.images?.length) return;
    setCurrentImgIndex((prev) => (prev + 1) % selectedHotel.images.length);
  };

  const previousImage = () => {
    if (!selectedHotel?.images?.length) return;
    setCurrentImgIndex((prev) => (prev - 1 + selectedHotel.images.length) % selectedHotel.images.length);
  };

  const hotelAmenities = selectedHotel ? safeParseAmenities(selectedHotel.amenities) : [];

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#030303] text-white">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute left-[-8rem] top-24 h-[32rem] w-[32rem] rounded-full bg-orange-500/12 blur-[140px]" />
        <div className="absolute right-[5%] top-[18rem] h-[30rem] w-[30rem] rounded-full bg-amber-300/8 blur-[150px]" />
        <div className="absolute bottom-[-12rem] left-1/2 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-white/6 blur-[140px]" />
      </div>

      <Container className="relative z-10 px-6 pb-20 pt-32 sm:px-8 lg:px-12">
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, ease: motionEase }}
          className="mb-12 md:mb-16"
        >
          <div className="relative overflow-hidden rounded-[42px] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.09),rgba(255,255,255,0.02)),radial-gradient(circle_at_top,rgba(249,115,22,0.16),transparent_36%),rgba(8,8,8,0.94)] p-6 shadow-[0_38px_100px_rgba(0,0,0,0.45)] md:p-10">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-400/70 to-transparent" />
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
              <div>
                <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/6 px-4 py-2 backdrop-blur-xl">
                  <Sparkles size={13} className="text-orange-400" />
                  <span className="text-[9px] font-black uppercase tracking-[0.42em] text-white/60">Cinematic Stay Search</span>
                </div>
                <h1 className="text-5xl font-black uppercase italic tracking-[-0.06em] text-white md:text-7xl lg:text-[8.5rem] lg:leading-[0.82]">
                  Prime
                  <br />
                  <span className="bg-gradient-to-b from-white via-amber-100 to-orange-500 bg-clip-text text-transparent">
                    Estates.
                  </span>
                </h1>
                <p className="mt-6 max-w-2xl text-base leading-8 text-white/62 md:text-lg">
                  The stays experience now reads like a premium expedition catalog: cleaner search, stronger hierarchy, smoother card motion, and a richer details reveal.
                </p>
              </div>

              <div className="cinematic-surface rounded-[30px] p-6">
                <p className="text-[10px] font-black uppercase tracking-[0.38em] text-orange-300">Search Focus</p>
                <div className="mt-5 grid grid-cols-2 gap-4">
                  <Metric title="Verified stays" value={`${hotels.length}+`} />
                  <Metric title="Traveler signal" value={user ? "Signed In" : "Guest"} />
                </div>
              </div>
            </div>

            <div className="mt-10 grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.8fr)_180px_180px_auto]">
              <FilterField icon={<Search size={16} />} label="Location">
                <input
                  type="text"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  placeholder="Temple corridor, valley, ridge..."
                  className="w-full bg-transparent text-sm font-black uppercase tracking-[0.18em] text-white outline-none placeholder:text-white/24"
                />
              </FilterField>

              <FilterField icon={<Calendar size={16} />} label="Check In">
                <input
                  type="date"
                  min={today}
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                  className="w-full bg-transparent text-sm font-black uppercase tracking-[0.12em] text-white outline-none [color-scheme:dark]"
                />
              </FilterField>

              <FilterField icon={<ArrowRight size={16} />} label="Min">
                <input
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="1000"
                  className="w-full bg-transparent text-sm font-black uppercase tracking-[0.12em] text-white outline-none placeholder:text-white/24"
                />
              </FilterField>

              <FilterField icon={<ArrowRight size={16} />} label="Max">
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="6000"
                  className="w-full bg-transparent text-sm font-black uppercase tracking-[0.12em] text-white outline-none placeholder:text-white/24"
                />
              </FilterField>

              <Button size="lg" onClick={fetchHotels} className="rounded-[26px] text-[11px] tracking-[0.28em]">
                Secure Access <ArrowRight size={16} />
              </Button>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {quickFilters.map((item) => (
                <button
                  key={item}
                  onClick={() => handleApplyQuickFilter(item)}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em] text-white/62 hover:bg-white/10 hover:text-white"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </motion.section>

        {loading ? (
          <StaysGridSkeleton />
        ) : (
          <section className="space-y-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.42em] text-orange-300">Results Grid</p>
                <h2 className="mt-3 text-3xl font-black uppercase italic tracking-[-0.04em] text-white md:text-5xl">
                  Curated stays with sharper presence.
                </h2>
              </div>
              <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-xl">
                <Compass size={16} className="text-orange-400" />
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="bg-transparent text-[10px] font-black uppercase tracking-[0.28em] text-white outline-none"
                >
                  <option value="newest">Newest</option>
                  <option value="priceLowToHigh">Price Low</option>
                  <option value="priceHighToLow">Price High</option>
                </select>
              </div>
            </div>

            {hotels.length === 0 ? (
              <div className="cinematic-surface rounded-[34px] p-10 text-center">
                <p className="text-2xl font-black uppercase italic tracking-tight text-white">No stays found</p>
                <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-white/55">
                  Try widening the location or price range. The new layout is ready, but the current search returned an empty path.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {hotels.map((hotel, index) => {
                  const amenities = safeParseAmenities(hotel.amenities);
                  const rating = ratingMap?.[hotel._id]?.avgRating || "NEW";

                  return (
                    <motion.article
                      key={hotel._id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.7, delay: index * 0.06, ease: motionEase }}
                      whileHover={{ y: -8 }}
                      onClick={() => setSelectedHotel(hotel)}
                      className="group relative cursor-pointer overflow-hidden rounded-[34px] border border-white/10 bg-[#090909] shadow-[0_28px_80px_rgba(0,0,0,0.32)]"
                    >
                      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                      <div className="relative h-[380px] overflow-hidden">
                        <img
                          src={hotel.images?.[0]}
                          alt={hotel.hotelName}
                          className="h-full w-full object-cover opacity-80 transition-transform duration-700 ease-out group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.08),rgba(0,0,0,0.2)_36%,rgba(0,0,0,0.92)_100%)]" />
                        <div className="absolute left-6 right-6 top-6 flex items-center justify-between">
                          <div className="rounded-full border border-white/12 bg-black/35 px-4 py-2 backdrop-blur-xl">
                            <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-white">
                              <Star size={12} className="fill-orange-400 text-orange-400" />
                              {rating}
                            </span>
                          </div>
                          <div className="rounded-full bg-gradient-to-r from-orange-500 to-amber-400 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-white shadow-[0_14px_36px_rgba(249,115,22,0.28)]">
                            Rs {hotel.pricePerNight}
                          </div>
                        </div>
                      </div>

                      <div className="relative space-y-6 p-7">
                        <div>
                          <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-orange-300">
                            <MapPin size={12} />
                            {hotel.location}
                          </p>
                          <h3 className="mt-3 text-3xl font-black uppercase italic tracking-tight text-white transition-colors duration-500 group-hover:text-orange-300">
                            {hotel.hotelName}
                          </h3>
                        </div>

                        <div className="flex flex-wrap gap-3">
                          {amenities.slice(0, 4).map((amenity) => (
                            <div key={amenity} className="flex items-center gap-2 rounded-full border border-white/8 bg-white/5 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/58">
                              <span className="text-orange-300">{amenityIcons[amenity] || <ShieldCheck size={14} />}</span>
                              <span>{amenity}</span>
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center justify-between border-t border-white/8 pt-5">
                          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/36">Open Details</p>
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-black transition-all duration-500 group-hover:translate-x-1 group-hover:bg-orange-500 group-hover:text-white">
                            <ArrowRight size={18} />
                          </div>
                        </div>
                      </div>
                    </motion.article>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </Container>

      <AnimatePresence>
        {selectedHotel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] p-4 md:p-8"
          >
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedHotel(null)}
              className="absolute inset-0 h-full w-full bg-black/88 backdrop-blur-2xl"
              aria-label="Close stay details"
            />

            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.985 }}
              transition={{ duration: 0.45, ease: motionEase }}
              className="relative mx-auto flex h-full max-h-[92vh] w-full max-w-[1320px] overflow-hidden rounded-[38px] border border-white/10 bg-[#070707] shadow-[0_42px_140px_rgba(0,0,0,0.55)] lg:grid lg:grid-cols-[1.05fr_0.95fr]"
            >
              <div className="relative min-h-[320px] overflow-hidden border-b border-white/8 lg:border-b-0 lg:border-r">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={currentImgIndex}
                    src={selectedHotel.images?.[currentImgIndex]}
                    alt={selectedHotel.hotelName}
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.02 }}
                    transition={{ duration: 0.45, ease: motionEase }}
                    className="h-full w-full object-cover"
                  />
                </AnimatePresence>
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.12),rgba(0,0,0,0.18)_38%,rgba(0,0,0,0.76)_100%)]" />

                <div className="absolute left-6 right-6 top-6 flex items-center justify-between">
                  <div className="rounded-full border border-white/12 bg-black/35 px-4 py-2 backdrop-blur-xl">
                    <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-white">
                      <ShieldCheck size={12} className="text-orange-300" />
                      Vetted Sanctuary
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedHotel(null)}
                    className="flex h-12 w-12 items-center justify-center rounded-full border border-white/12 bg-black/40 text-white transition-colors hover:bg-red-500"
                  >
                    <X size={18} />
                  </button>
                </div>

                {selectedHotel.images?.length > 1 && (
                  <>
                    <button
                      onClick={previousImage}
                      className="absolute left-6 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/12 bg-black/40 text-white transition-colors hover:bg-white hover:text-black"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-6 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/12 bg-black/40 text-white transition-colors hover:bg-white hover:text-black"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </>
                )}

                <div className="absolute inset-x-0 bottom-0 p-6">
                  <div className="flex gap-3 overflow-x-auto no-scrollbar">
                    {selectedHotel.images?.map((image, index) => (
                      <button
                        key={image || index}
                        onClick={() => setCurrentImgIndex(index)}
                        className={`h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 transition-all duration-300 ${currentImgIndex === index ? "border-orange-400 scale-105" : "border-transparent opacity-55 hover:opacity-100"}`}
                      >
                        <img src={image} alt={`${selectedHotel.hotelName} ${index + 1}`} className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="no-scrollbar overflow-y-auto p-6 md:p-8 lg:p-10">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-orange-300">Stay Brief</p>
                    <h2 className="mt-4 text-4xl font-black uppercase italic tracking-[-0.05em] text-white md:text-5xl">
                      {selectedHotel.hotelName}
                    </h2>
                    <p className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-white/52">
                      <MapPin size={12} className="text-orange-300" />
                      {selectedHotel.location}
                    </p>
                  </div>
                  <div className="rounded-[24px] bg-gradient-to-r from-orange-500 to-amber-400 px-5 py-4 text-right text-white shadow-[0_16px_40px_rgba(249,115,22,0.25)]">
                    <p className="text-[10px] font-black uppercase tracking-[0.26em]">Per Night</p>
                    <p className="mt-2 text-3xl font-black italic">Rs {selectedHotel.pricePerNight}</p>
                  </div>
                </div>

                <div className="mt-8 grid gap-4 md:grid-cols-2">
                  <SummaryCard label="Guest Mode" value={user ? "Priority Access" : "Guest Session"} />
                  <SummaryCard label="Review Pulse" value={`${ratingMap?.[selectedHotel._id]?.avgRating || "NEW"} Rating`} />
                </div>

                <div className="mt-8 rounded-[28px] border border-white/8 bg-white/5 p-6">
                  <p className="text-[10px] font-black uppercase tracking-[0.35em] text-white/36">Intel Summary</p>
                  <p className="mt-4 text-sm leading-8 text-white/64">
                    {selectedHotel.description || "Mountain-grade habitat designed for explorers who want cleaner planning, stronger comfort, and a more dependable base during high-altitude travel."}
                  </p>
                </div>

                <div className="mt-8">
                  <p className="text-[10px] font-black uppercase tracking-[0.35em] text-orange-300">Inclusions</p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {hotelAmenities.map((amenity) => (
                      <div key={amenity} className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-white/62">
                        <span className="text-orange-300">{amenityIcons[amenity] || <Check size={14} />}</span>
                        <span>{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-10 grid gap-4 md:grid-cols-2">
                  <Button size="lg" className="rounded-[24px] text-[11px] tracking-[0.28em]">
                    Book Now <ArrowRight size={16} />
                  </Button>
                  <Button
                    size="lg"
                    variant="ghost"
                    onClick={() => setSelectedHotel(null)}
                    className="rounded-[24px] text-[11px] tracking-[0.28em]"
                  >
                    Close Panel
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

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

function SummaryCard({ label, value }) {
  return (
    <div className="rounded-[24px] border border-white/8 bg-white/5 p-5">
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/34">{label}</p>
      <p className="mt-3 text-xl font-black uppercase italic tracking-tight text-white">{value}</p>
    </div>
  );
}

function safeParseAmenities(rawValue) {
  try {
    const parsed = JSON.parse(rawValue || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default ExploreStays;
