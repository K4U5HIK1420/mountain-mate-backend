import API from "../utils/api";
import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BedDouble,
  Calendar,
  Car,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Filter,
  MapPin,
  Mountain,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  Thermometer,
  Phone,
  User,
  Users,
  Waves,
  Wifi,
  Wind,
  Zap,
} from "lucide-react";
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";
import { StaysGridSkeleton } from "../components/Skeletons";
import { useNotify } from "../context/NotificationContext";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/Button";
import { Container } from "../components/ui/Container";

const motionEase = [0.22, 1, 0.36, 1];
const locationSuggestions = ["Kedarnath", "Guptkashi", "Sonprayag", "Rudraprayag", "Joshimath", "Auli", "Badrinath"];
const defaultMinPrice = 1000;
const defaultMaxPrice = 5000;

const amenityIcons = {
  wifi: <Wifi size={14} />,
  parking: <Car size={14} />,
  breakfast: <Coffee size={14} />,
  hotWater: <Thermometer size={14} />,
  mountainView: <Mountain size={14} />,
  powerBackup: <Zap size={14} />,
  pool: <Waves size={14} />,
};

const mapStyles = [
  { elementType: "geometry", stylers: [{ color: "#1d2b3a" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8ea2bb" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#2f3b4a" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#7a5c43" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#10263d" }] },
];

const getDatePlusDays = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
};

const sortHotels = (list, sort, ratingMap) => {
  const arr = [...list];
  if (sort === "priceLowToHigh") {
    return arr.sort((a, b) => Number(a.pricePerNight || 0) - Number(b.pricePerNight || 0));
  }
  if (sort === "priceHighToLow") {
    return arr.sort((a, b) => Number(b.pricePerNight || 0) - Number(a.pricePerNight || 0));
  }
  if (sort === "rating") {
    return arr.sort(
      (a, b) =>
        Number(ratingMap?.[b._id]?.avgRating || 0) - Number(ratingMap?.[a._id]?.avgRating || 0)
    );
  }
  return arr;
};

const extractCoords = (hotel) => {
  const lat = Number(hotel?.coords?.lat ?? hotel?.latitude ?? hotel?.lat);
  const lng = Number(hotel?.coords?.lng ?? hotel?.longitude ?? hotel?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
};

export default function ExploreStays() {
  const { notify } = useNotify();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  const [hotels, setHotels] = useState([]);
  const [ratingMap, setRatingMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [sort, setSort] = useState("rating");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [filters, setFilters] = useState({
    location: "",
    checkIn: getDatePlusDays(0),
    checkOut: getDatePlusDays(1),
    minPrice: defaultMinPrice,
    maxPrice: defaultMaxPrice,
    wifi: false,
    parking: false,
    mountainView: false,
    familyStay: false,
    highRatedOnly: false,
    budgetOnly: false,
    mountainOnly: false,
    minRating: 0,
  });

  const [bookingForm, setBookingForm] = useState({
    name: "",
    phone: "",
    checkIn: getDatePlusDays(0),
    guests: 1,
    rooms: 1,
  });

  useEffect(() => {
    setBookingForm((prev) => ({
      ...prev,
      name:
        user?.fullName ||
        user?.user_metadata?.full_name ||
        user?.displayName ||
        user?.email?.split("@")[0] ||
        "",
      phone: user?.phone || user?.user_metadata?.phone || prev.phone || "",
    }));
  }, [user]);

  useEffect(() => {
    document.body.style.overflow = selectedHotel ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedHotel]);

  useEffect(() => {
    if (selectedHotel) {
      setCurrentImgIndex(0);
      setBookingForm((prev) => ({
        ...prev,
        checkIn: filters.checkIn || getDatePlusDays(0),
        guests: 1,
        rooms: 1,
      }));
    }
  }, [selectedHotel, filters.checkIn]);

  const fetchHotels = async () => {
    setIsSearching(true);
    try {
      const response = await API.get("/hotel/search", {
        params: {
          location: filters.location.trim().toLowerCase(),
          minPrice: filters.minPrice,
          maxPrice: filters.maxPrice,
          checkInDate: filters.checkIn,
        },
      });

      const list = response.data?.data || response.data || [];
      setHotels(list);

      const ids = list.map((hotel) => hotel._id).join(",");
      if (ids) {
        const summary = await API.get("/review/summary", { params: { ids } });
        setRatingMap(summary.data?.data || {});
      } else {
        setRatingMap({});
      }
    } catch {
      notify("Could not load stays right now", "error");
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };

  useEffect(() => {
    fetchHotels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredHotels = useMemo(() => {
    let list = [...hotels];

    list = list.filter((hotel) => {
      const amenities = safeParseAmenities(hotel.amenities);
      const rating = Number(ratingMap?.[hotel._id]?.avgRating || 0);
      const price = Number(hotel.pricePerNight || 0);
      const location = String(hotel.location || "").toLowerCase();

      if (filters.location && !location.includes(filters.location.toLowerCase())) return false;
      if (price < filters.minPrice || price > filters.maxPrice) return false;
      if (filters.wifi && !amenities.includes("wifi")) return false;
      if (filters.parking && !amenities.includes("parking")) return false;
      if (filters.mountainView && !amenities.includes("mountainView")) return false;
      if (filters.familyStay && !amenities.some((a) => a === "roomService" || a === "powerBackup")) return false;
      if (filters.highRatedOnly && rating < 4.2) return false;
      if (filters.minRating > 0 && rating < filters.minRating) return false;
      if (filters.budgetOnly && price > 3000) return false;
      if (filters.mountainOnly && !location.includes("mountain") && !amenities.includes("mountainView")) return false;
      return true;
    });

    return sortHotels(list, sort, ratingMap);
  }, [filters, hotels, ratingMap, sort]);

  const mapHotels = useMemo(
    () => filteredHotels.map((hotel) => ({ ...hotel, coords: extractCoords(hotel) })).filter((h) => h.coords),
    [filteredHotels]
  );

  const handlePriceMin = (value) => {
    const next = Number(value);
    setFilters((prev) => ({
      ...prev,
      minPrice: Math.min(next, prev.maxPrice - 500),
    }));
  };

  const handlePriceMax = (value) => {
    const next = Number(value);
    setFilters((prev) => ({
      ...prev,
      maxPrice: Math.max(next, prev.minPrice + 500),
    }));
  };

  const resetFilters = () => {
    setFilters((prev) => ({
      ...prev,
      location: "",
      checkIn: getDatePlusDays(0),
      checkOut: getDatePlusDays(1),
      minPrice: defaultMinPrice,
      maxPrice: defaultMaxPrice,
      wifi: false,
      parking: false,
      mountainView: false,
      familyStay: false,
      highRatedOnly: false,
      budgetOnly: false,
      mountainOnly: false,
      minRating: 0,
    }));
    setSort("rating");
    fetchHotels();
  };

  const nextImage = () => {
    if (!selectedHotel?.images?.length) return;
    setCurrentImgIndex((prev) => (prev + 1) % selectedHotel.images.length);
  };

  const previousImage = () => {
    if (!selectedHotel?.images?.length) return;
    setCurrentImgIndex((prev) => (prev - 1 + selectedHotel.images.length) % selectedHotel.images.length);
  };

  const selectedAmenities = selectedHotel ? safeParseAmenities(selectedHotel.amenities) : [];

  const handleStayBooking = async () => {
    if (!selectedHotel) return;
    if (!user) {
      notify("Log in to continue to payment.", "error");
      navigate("/login", { state: { from: { pathname: "/explore-stays" } } });
      return;
    }
    if (!bookingForm.name.trim() || bookingForm.phone.trim().length < 10 || !bookingForm.checkIn) {
      notify("Add your name, phone, and check-in date.", "error");
      return;
    }

    setBookingLoading(true);
    try {
      const amount = Number(selectedHotel.pricePerNight || 0) * Number(bookingForm.rooms || 1);
      const res = await API.post("/booking/create", {
        customerName: bookingForm.name.trim(),
        phoneNumber: bookingForm.phone.trim(),
        bookingType: "Hotel",
        listingId: selectedHotel._id,
        date: bookingForm.checkIn,
        startDate: bookingForm.checkIn,
        endDate: bookingForm.checkIn,
        guests: Number(bookingForm.guests || 1),
        rooms: Number(bookingForm.rooms || 1),
        amount,
      });
      const createdBooking = res.data?.data || res.data;
      const bookingId = createdBooking?._id;
      if (!bookingId) throw new Error("Missing booking id");
      setSelectedHotel(null);
      navigate(`/booking/${bookingId}/confirm`, { state: { booking: createdBooking } });
    } catch {
      notify("Unable to create stay booking right now.", "error");
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#040404] text-white">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute left-[-8rem] top-20 h-[30rem] w-[30rem] rounded-full bg-orange-500/12 blur-[140px]" />
        <div className="absolute right-[4%] top-[18rem] h-[28rem] w-[28rem] rounded-full bg-amber-300/8 blur-[140px]" />
      </div>

      <Container className="relative z-10 px-4 pb-20 pt-32 sm:px-8">
        <section className="mb-6 rounded-[34px] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02)),rgba(8,8,8,0.93)] p-5 backdrop-blur-2xl md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-300/30 bg-orange-500/12 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-orange-200">
                <Sparkles size={12} />
                Prime Estates
              </div>
              <h1 className="mt-4 text-4xl font-black uppercase italic tracking-[-0.05em] text-white md:text-7xl">
                BOOK STAYS
                <span className="ml-2 bg-gradient-to-r from-[#ff7a18] to-[#ffb347] bg-clip-text text-transparent">PREMIUM</span>
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/62 md:text-base">
                Search verified mountain stays with cleaner defaults, faster filters, and cinematic booking cards.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Metric title="Active stays" value={`${filteredHotels.length}`} />
              <Metric title="Search mode" value={isSearching ? "Scanning" : "Ready"} />
            </div>
          </div>
        </section>

        <SearchBar
          filters={filters}
          setFilters={setFilters}
          showAdvanced={showAdvanced}
          setShowAdvanced={setShowAdvanced}
          onPriceMin={handlePriceMin}
          onPriceMax={handlePriceMax}
          onSearch={fetchHotels}
          onToggleMap={() => setShowMap((prev) => !prev)}
          showMap={showMap}
          searching={isSearching}
        />

        <SortFilterBar filters={filters} setFilters={setFilters} sort={sort} setSort={setSort} />

        {(loading || isSearching) ? (
          <StaysGridSkeleton />
        ) : filteredHotels.length === 0 ? (
          <EmptyState onReset={resetFilters} />
        ) : (
          <div className={`mt-5 grid gap-4 ${showMap ? "xl:grid-cols-[minmax(0,1fr)_430px]" : ""}`}>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredHotels.map((hotel, index) => (
                <StayCard
                  key={hotel._id}
                  hotel={hotel}
                  index={index}
                  rating={ratingMap?.[hotel._id]?.avgRating}
                  onOpen={() => setSelectedHotel(hotel)}
                />
              ))}
            </div>
            {showMap ? (
              <div className="sticky top-32 h-[620px] overflow-hidden rounded-[28px] border border-white/10 bg-black/30">
                {isLoaded ? (
                  <GoogleMap
                    mapContainerStyle={{ width: "100%", height: "100%" }}
                    center={mapHotels[0]?.coords || { lat: 30.3165, lng: 78.0322 }}
                    zoom={8}
                    options={{ styles: mapStyles, disableDefaultUI: true }}
                  >
                    {mapHotels.map((item) => (
                      <Marker key={item._id} position={item.coords} title={item.hotelName} />
                    ))}
                  </GoogleMap>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-white/60">Loading map...</div>
                )}
              </div>
            ) : null}
          </div>
        )}
      </Container>

      <AnimatePresence>
        {selectedHotel && (
          <StayDetailsModal
            hotel={selectedHotel}
            rating={ratingMap?.[selectedHotel._id]?.avgRating}
            bookingForm={bookingForm}
            setBookingForm={setBookingForm}
            currentImgIndex={currentImgIndex}
            setCurrentImgIndex={setCurrentImgIndex}
            selectedAmenities={selectedAmenities}
            onClose={() => setSelectedHotel(null)}
            onNext={nextImage}
            onPrev={previousImage}
            onBook={handleStayBooking}
            bookingLoading={bookingLoading}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function SearchBar({
  filters,
  setFilters,
  showAdvanced,
  setShowAdvanced,
  onPriceMin,
  onPriceMax,
  onSearch,
  onToggleMap,
  showMap,
  searching,
}) {
  return (
    <section className="sticky top-[92px] z-30 rounded-[28px] border border-white/10 bg-black/65 p-4 backdrop-blur-2xl md:p-5">
      <div className="grid gap-3 xl:grid-cols-[1.1fr_0.8fr_0.85fr_auto]">
        <GlassField icon={<MapPin size={15} />} label="Location">
          <input
            value={filters.location}
            onChange={(e) => setFilters((prev) => ({ ...prev, location: e.target.value }))}
            placeholder="Kedarnath / Guptkashi / Sonprayag"
            list="stays-location-suggestions"
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/30"
          />
          <datalist id="stays-location-suggestions">
            {locationSuggestions.map((item) => (
              <option key={item} value={item} />
            ))}
          </datalist>
        </GlassField>

        <GlassField icon={<Calendar size={15} />} label="Check-in / Check-out">
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={filters.checkIn}
              onChange={(e) => setFilters((prev) => ({ ...prev, checkIn: e.target.value }))}
              className="w-full bg-transparent text-xs text-white outline-none [color-scheme:dark]"
            />
            <input
              type="date"
              min={filters.checkIn}
              value={filters.checkOut}
              onChange={(e) => setFilters((prev) => ({ ...prev, checkOut: e.target.value }))}
              className="w-full bg-transparent text-xs text-white outline-none [color-scheme:dark]"
            />
          </div>
        </GlassField>

        <GlassField icon={<SlidersHorizontal size={15} />} label={`Price: Rs ${filters.minPrice} - Rs ${filters.maxPrice}`}>
          <div className="space-y-2">
            <input type="range" min={500} max={12000} step={100} value={filters.minPrice} onChange={(e) => onPriceMin(e.target.value)} className="w-full accent-orange-400" />
            <input type="range" min={500} max={12000} step={100} value={filters.maxPrice} onChange={(e) => onPriceMax(e.target.value)} className="w-full accent-orange-300" />
          </div>
        </GlassField>

        <Button
          size="lg"
          onClick={onSearch}
          className="rounded-2xl px-6 text-[11px] tracking-[0.2em] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_18px_42px_rgba(249,115,22,0.4)]"
        >
          {searching ? "Searching..." : "Search Stays"}
          <Search size={15} />
        </Button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setShowAdvanced((prev) => !prev)}
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-white/75 transition hover:border-orange-300/35 hover:text-orange-200"
        >
          <Filter size={13} />
          Advanced Filters
          <ChevronDown size={13} className={`transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
        </button>
        <button
          type="button"
          onClick={onToggleMap}
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-white/75 transition hover:border-orange-300/35 hover:text-orange-200"
        >
          <MapPin size={13} />
          {showMap ? "Hide Map" : "Show Map"}
        </button>
      </div>

      <AnimatePresence>
        {showAdvanced ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 grid gap-2 rounded-2xl border border-white/10 bg-white/5 p-3 sm:grid-cols-2 xl:grid-cols-4">
              <ToggleFilter label="WiFi" checked={filters.wifi} onChange={(v) => setFilters((p) => ({ ...p, wifi: v }))} />
              <ToggleFilter label="Parking" checked={filters.parking} onChange={(v) => setFilters((p) => ({ ...p, parking: v }))} />
              <ToggleFilter label="Mountain View" checked={filters.mountainView} onChange={(v) => setFilters((p) => ({ ...p, mountainView: v }))} />
              <ToggleFilter label="Family Stay" checked={filters.familyStay} onChange={(v) => setFilters((p) => ({ ...p, familyStay: v }))} />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}

function SortFilterBar({ filters, setFilters, sort, setSort }) {
  const chips = [
    { key: "highRatedOnly", label: "High Rated Stays" },
    { key: "budgetOnly", label: "Budget Stays" },
    { key: "mountainOnly", label: "Mountain View" },
  ];

  return (
    <section className="mt-5 rounded-[22px] border border-white/10 bg-black/30 p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/5 px-3 py-2">
          <SlidersHorizontal size={14} className="text-orange-300" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="bg-transparent text-[11px] font-black uppercase tracking-[0.15em] text-white outline-none"
          >
            <option value="priceLowToHigh">Price low to high</option>
            <option value="rating">Rating</option>
            <option value="priceHighToLow">Distance</option>
          </select>
        </div>
        <div className="inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/5 px-3 py-2">
          <Star size={14} className="text-orange-300" />
          <select
            value={filters.minRating}
            onChange={(e) => setFilters((prev) => ({ ...prev, minRating: Number(e.target.value) }))}
            className="bg-transparent text-[11px] font-black uppercase tracking-[0.15em] text-white outline-none"
          >
            <option value={0}>Rating</option>
            <option value={4}>4.0+ / 5</option>
            <option value={4.5}>4.5+ / 5</option>
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => setFilters((prev) => ({ ...prev, [chip.key]: !prev[chip.key] }))}
              className={`rounded-full border px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] transition ${
                filters[chip.key]
                  ? "border-orange-400/40 bg-orange-500/20 text-orange-100"
                  : "border-white/12 bg-white/5 text-white/60 hover:text-white"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function StayCard({ hotel, rating, onOpen, index }) {
  const amenities = safeParseAmenities(hotel.amenities);
  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.03 }}
      whileHover={{ y: -6 }}
      className="group overflow-hidden rounded-[28px] border border-white/10 bg-[#090909] shadow-[0_22px_60px_rgba(0,0,0,0.3)]"
    >
      <div className="relative h-[260px] overflow-hidden">
        <img
          loading="lazy"
          src={hotel.images?.[0]}
          alt={hotel.hotelName}
          className="h-full w-full object-cover opacity-85 transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.08),rgba(0,0,0,0.2)_35%,rgba(0,0,0,0.88)_100%)]" />
        <div className="absolute left-4 right-4 top-4 flex items-center justify-between">
          <div className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/40 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white">
            <Star size={11} className="text-amber-300" />
            {rating ? Number(rating).toFixed(1) : "4.5"}/5
          </div>
          <div className="rounded-full bg-gradient-to-r from-[#ff7a18] to-[#ffb347] px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white">
            Rs {hotel.pricePerNight}/night
          </div>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div>
          <h3 className="text-2xl font-black uppercase italic tracking-tight text-white">{hotel.hotelName}</h3>
          <p className="mt-2 inline-flex items-center gap-2 text-[11px] text-white/58">
            <MapPin size={13} className="text-orange-300" />
            {hotel.location}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {amenities.slice(0, 4).map((amenity) => (
            <div key={amenity} className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1.5 text-[10px] text-white/70">
              <span className="text-orange-300">{amenityIcons[amenity] || <ShieldCheck size={13} />}</span>
              {amenity}
            </div>
          ))}
        </div>

        <Button onClick={onOpen} size="sm" className="w-full rounded-xl py-3 text-[10px] tracking-[0.16em]">
          View Details
          <ArrowRight size={14} />
        </Button>
      </div>
    </motion.article>
  );
}

function StayDetailsModal({
  hotel,
  rating,
  bookingForm,
  setBookingForm,
  currentImgIndex,
  setCurrentImgIndex,
  selectedAmenities,
  onClose,
  onNext,
  onPrev,
  onBook,
  bookingLoading,
}) {
  const today = getDatePlusDays(0);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[2147483000] p-4 pt-28 md:p-8 md:pt-32"
    >
      <button onClick={onClose} className="absolute inset-0 h-full w-full bg-black/95 backdrop-blur-2xl" />
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.985 }}
        transition={{ duration: 0.35, ease: motionEase }}
        className="relative mx-auto flex h-full max-h-[92vh] w-full max-w-[1280px] overflow-hidden rounded-[34px] border border-white/10 bg-[#070707] lg:grid lg:grid-cols-[1.05fr_0.95fr]"
      >
        <div className="relative min-h-[320px] overflow-hidden border-b border-white/8 lg:border-b-0 lg:border-r">
          <img src={hotel.images?.[currentImgIndex]} alt={hotel.hotelName} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.1),rgba(0,0,0,0.76))]" />
          <div className="absolute left-4 right-4 top-4 flex items-center justify-between">
            <div className="inline-flex items-center gap-1 rounded-full border border-white/12 bg-black/40 px-3 py-2 text-[10px] font-black uppercase tracking-[0.15em] text-white">
              <Star size={11} className="text-amber-300" />
              {rating ? Number(rating).toFixed(1) : "4.5"}/5
            </div>
            <button onClick={onClose} className="rounded-full border border-white/12 bg-black/40 px-3 py-2 text-xs text-white">
              Close
            </button>
          </div>
          {hotel.images?.length > 1 ? (
            <>
              <button onClick={onPrev} className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full border border-white/12 bg-black/45 p-2 text-white"><ChevronLeft size={16} /></button>
              <button onClick={onNext} className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full border border-white/12 bg-black/45 p-2 text-white"><ChevronRight size={16} /></button>
            </>
          ) : null}
          <div className="absolute inset-x-0 bottom-0 flex gap-2 overflow-x-auto p-4">
            {hotel.images?.map((img, idx) => (
              <button key={img || idx} onClick={() => setCurrentImgIndex(idx)} className={`h-14 w-14 overflow-hidden rounded-xl border-2 ${currentImgIndex === idx ? "border-orange-300" : "border-transparent opacity-65"}`}>
                <img src={img} alt={`${idx + 1}`} className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center overflow-y-auto p-4 md:p-6">
          <div className="w-full rounded-[30px] border border-white/15 bg-[linear-gradient(150deg,rgba(255,255,255,0.09),rgba(255,255,255,0.02)),rgba(8,8,8,0.88)] p-5 shadow-[0_28px_70px_rgba(0,0,0,0.42)] backdrop-blur-2xl md:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-300">Premium Reservation</p>
                <h3 className="mt-2 text-2xl font-black uppercase italic tracking-tight text-white md:text-3xl">{hotel.hotelName}</h3>
                <p className="mt-2 inline-flex items-center gap-2 text-sm text-white/65">
                  <MapPin size={14} className="text-orange-300" />
                  {hotel.location}
                </p>
              </div>
              <div className="rounded-2xl border border-orange-300/30 bg-orange-500/15 px-3 py-2 text-right">
                <p className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.14em] text-orange-100"><Star size={11} className="text-amber-300" /> {rating ? Number(rating).toFixed(1) : "4.5"}/5</p>
                <p className="mt-1 text-lg font-black italic text-white">Rs {hotel.pricePerNight}</p>
                <p className="text-[10px] text-white/60">per night</p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <LabelInput icon={<User size={14} />} placeholder="Full Name" value={bookingForm.name} onChange={(value) => setBookingForm((p) => ({ ...p, name: value }))} />
                <LabelInput icon={<Phone size={14} />} placeholder="Phone Number" value={bookingForm.phone} onChange={(value) => setBookingForm((p) => ({ ...p, phone: value }))} />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <DateInput value={bookingForm.checkIn} onChange={(value) => setBookingForm((p) => ({ ...p, checkIn: value }))} min={today} label="Check-in" />
                <DateInput value={bookingForm.checkIn} onChange={(value) => setBookingForm((p) => ({ ...p, checkIn: value }))} min={bookingForm.checkIn || today} label="Check-out" />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <NumberInput icon={<Users size={14} />} value={bookingForm.guests} onChange={(value) => setBookingForm((p) => ({ ...p, guests: Math.max(1, Number(value) || 1) }))} label="Guests" />
                <NumberInput icon={<BedDouble size={14} />} value={bookingForm.rooms} onChange={(value) => setBookingForm((p) => ({ ...p, rooms: Math.max(1, Number(value) || 1) }))} label="Rooms" />
              </div>
            </div>

            <Button
              onClick={onBook}
              disabled={bookingLoading}
              className="mt-5 w-full rounded-2xl py-3 text-[10px] tracking-[0.16em] shadow-[0_18px_42px_rgba(249,115,22,0.42)] transition-all duration-300 hover:scale-[1.01]"
            >
              {bookingLoading ? "Starting Payment..." : `Reserve Now - Rs ${hotel.pricePerNight}/night`}
              <ArrowRight size={14} />
            </Button>

            <div className="mt-4 grid gap-2 rounded-2xl border border-white/10 bg-black/25 p-3 text-[11px] text-white/72">
              <p className="inline-flex items-center gap-2"><Check size={13} className="text-emerald-300" /> Free cancellation</p>
              <p className="inline-flex items-center gap-2"><Check size={13} className="text-emerald-300" /> Instant booking confirmation</p>
              <p className="inline-flex items-center gap-2"><Check size={13} className="text-emerald-300" /> Secure payment</p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {selectedAmenities.slice(0, 4).map((amenity) => (
                <div key={amenity} className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] text-white/70">
                  <span className="text-orange-300">{amenityIcons[amenity] || <Check size={13} />}</span>
                  {amenity}
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function LabelInput({ icon, placeholder, value, onChange }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-white/12 bg-black/35 px-3 py-2.5">
      <span className="text-orange-300">{icon}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/30" />
    </div>
  );
}

function DateInput({ value, onChange, min, label }) {
  return (
    <div className="rounded-xl border border-white/12 bg-black/35 px-3 py-2.5">
      <p className="mb-1 text-[10px] uppercase tracking-[0.14em] text-white/45">{label}</p>
      <div className="flex items-center gap-2">
        <Calendar size={14} className="text-orange-300" />
        <input type="date" min={min} value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-transparent text-sm text-white outline-none [color-scheme:dark]" />
      </div>
    </div>
  );
}

function NumberInput({ icon, value, onChange, label }) {
  return (
    <div className="rounded-xl border border-white/12 bg-black/35 px-3 py-2.5">
      <p className="mb-1 text-[10px] uppercase tracking-[0.14em] text-white/45">{label}</p>
      <div className="flex items-center gap-2">
        <span className="text-orange-300">{icon}</span>
        <input type="number" min="1" value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-transparent text-sm text-white outline-none" />
      </div>
    </div>
  );
}

function GlassField({ icon, label, children }) {
  return (
    <div className="rounded-2xl border border-white/12 bg-white/6 px-4 py-3 backdrop-blur-xl">
      <div className="mb-2 flex items-center gap-2 text-orange-300">
        {icon}
        <span className="text-[9px] font-black uppercase tracking-[0.16em] text-white/45">{label}</span>
      </div>
      {children}
    </div>
  );
}

function ToggleFilter({ label, checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`rounded-xl border px-3 py-2 text-[11px] transition ${
        checked ? "border-orange-400/40 bg-orange-500/20 text-orange-100" : "border-white/12 bg-black/30 text-white/65"
      }`}
    >
      {label}
    </button>
  );
}

function Metric({ title, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/45">{title}</p>
      <p className="mt-1 text-xl font-black italic text-white">{value}</p>
    </div>
  );
}

function EmptyState({ onReset }) {
  return (
    <div className="mt-6 rounded-[30px] border border-white/10 bg-white/5 p-10 text-center">
      <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-orange-300/35 bg-orange-500/10">
        <Mountain size={28} className="text-orange-300" />
      </div>
      <h3 className="text-2xl font-black uppercase italic text-white">No stays found. Try adjusting filters.</h3>
      <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-white/55">
        Expand your price range, change destination, or clear advanced filters.
      </p>
      <Button onClick={onReset} size="sm" className="mt-6 rounded-xl px-5 py-3 text-[10px] tracking-[0.16em]">
        Reset Filters
      </Button>
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










