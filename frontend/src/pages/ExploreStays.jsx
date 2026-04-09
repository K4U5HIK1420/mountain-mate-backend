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
  ChevronLeft,
  ChevronRight,
  Coffee,
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
import { StaysGridSkeleton } from "../components/Skeletons";
import { useNotify } from "../context/NotificationContext";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/Button";
import { Container } from "../components/ui/Container";
import { cleanValue, isValidPhone, normalizePhone } from "../utils/validation";
import { trackEvent } from "../utils/analytics";
import UserInventoryCalendar from "../components/inventory/UserInventoryCalendar";

const motionEase = [0.22, 1, 0.36, 1];
const locationSuggestions = ["Kedarnath", "Guptkashi", "Sonprayag", "Rudraprayag", "Joshimath", "Auli", "Badrinath"];
const amenityIcons = {
  wifi: <Wifi size={14} />,
  parking: <Car size={14} />,
  breakfast: <Coffee size={14} />,
  hotWater: <Thermometer size={14} />,
  mountainView: <Mountain size={14} />,
  powerBackup: <Zap size={14} />,
  pool: <Waves size={14} />,
};

const getDatePlusDays = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
};

const addDaysToIso = (isoDate, days) => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return getDatePlusDays(days);
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
};

const getNightCount = (checkIn, checkOut) => {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  const diff = Math.round((end.getTime() - start.getTime()) / 86400000);
  return Math.max(0, diff);
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

const normalizeHotel = (hotel) => ({
  ...hotel,
  parsedAmenities: safeParseAmenities(hotel.amenities),
  previewImage: hotel.images?.[0] || "",
});

export default function ExploreStays() {
  const { notify } = useNotify();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [hotels, setHotels] = useState([]);
  const [ratingMap, setRatingMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [sort, setSort] = useState("rating");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [pricingQuote, setPricingQuote] = useState({
    loading: false,
    error: "",
    totalAmount: 0,
    unitPrice: 0,
    totalNights: 0,
  });
  const [filters, setFilters] = useState({
    location: "",
    checkIn: getDatePlusDays(0),
    checkOut: getDatePlusDays(1),
      wifi: false,
      parking: false,
      mountainView: false,
      familyStay: false,
      minRating: 0,
    });

  const [bookingForm, setBookingForm] = useState({
    name: "",
    phone: "",
    checkIn: getDatePlusDays(0),
    checkOut: getDatePlusDays(1),
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
        checkOut: filters.checkOut || getDatePlusDays(1),
        guests: 1,
        rooms: 1,
      }));
      setPricingQuote({
        loading: false,
        error: "",
        totalAmount: 0,
        unitPrice: Number(selectedHotel.pricePerNight || 0),
        totalNights: getNightCount(filters.checkIn || getDatePlusDays(0), filters.checkOut || getDatePlusDays(1)),
      });
    }
  }, [selectedHotel, filters.checkIn, filters.checkOut]);

  useEffect(() => {
    if (!selectedHotel?._id || !bookingForm.checkIn) return;
    if (!bookingForm.checkOut || bookingForm.checkOut <= bookingForm.checkIn) {
      setBookingForm((prev) => ({
        ...prev,
        checkOut: addDaysToIso(prev.checkIn || getDatePlusDays(0), 1),
      }));
      return;
    }

    let active = true;
    const loadPricingQuote = async () => {
      setPricingQuote((prev) => ({ ...prev, loading: true, error: "" }));
      try {
        const inventoryEndDate = addDaysToIso(bookingForm.checkOut, -1);
        const res = await API.get(`/inventory/${selectedHotel._id}`, {
          params: {
            startDate: bookingForm.checkIn,
            endDate: inventoryEndDate,
          },
        });
        const rows = res.data?.data || [];
        const totalNights = rows.length;
        const unitPrice = totalNights
          ? Math.round(rows.reduce((sum, row) => sum + Number(row.price || 0), 0) / totalNights)
          : Number(selectedHotel.pricePerNight || 0);
        const totalAmount = rows.reduce((sum, row) => sum + Number(row.price || 0), 0) * Number(bookingForm.rooms || 1);

        if (!active) return;
        setPricingQuote({
          loading: false,
          error: "",
          totalAmount,
          unitPrice,
          totalNights,
        });
      } catch (_err) {
        if (!active) return;
        setPricingQuote({
          loading: false,
          error: "Live pricing unavailable for the selected dates.",
          totalAmount: 0,
          unitPrice: Number(selectedHotel.pricePerNight || 0),
          totalNights: getNightCount(bookingForm.checkIn, bookingForm.checkOut),
        });
      }
    };

    loadPricingQuote();
    return () => {
      active = false;
    };
  }, [selectedHotel, bookingForm.checkIn, bookingForm.checkOut, bookingForm.rooms]);

  const fetchHotels = async () => {
    setIsSearching(true);
    try {
      const response = await API.get("/hotel/search", {
        params: {
          location: filters.location.trim().toLowerCase(),
          checkInDate: filters.checkIn,
        },
      });

      const list = (response.data?.data || response.data || []).map(normalizeHotel);
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
      const amenities = hotel.parsedAmenities || [];
      const rating = Number(ratingMap?.[hotel._id]?.avgRating || 0);
      const location = String(hotel.location || "").toLowerCase();

      if (filters.location && !location.includes(filters.location.toLowerCase())) return false;
      if (filters.wifi && !amenities.includes("wifi")) return false;
      if (filters.parking && !amenities.includes("parking")) return false;
      if (filters.mountainView && !amenities.includes("mountainView")) return false;
      if (filters.familyStay && !amenities.some((a) => a === "roomService" || a === "powerBackup")) return false;
      if (filters.minRating > 0 && rating < filters.minRating) return false;
      return true;
    });

    return sortHotels(list, sort, ratingMap);
  }, [filters, hotels, ratingMap, sort]);

  const resetFilters = () => {
    setFilters((prev) => ({
      ...prev,
      location: "",
      checkIn: getDatePlusDays(0),
      checkOut: getDatePlusDays(1),
      wifi: false,
      parking: false,
      mountainView: false,
      familyStay: false,
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
    if (!cleanValue(bookingForm.name) || !isValidPhone(bookingForm.phone) || !bookingForm.checkIn) {
      notify("Add your name, phone, and check-in date.", "error");
      return;
    }
    if (!bookingForm.checkOut || bookingForm.checkOut <= bookingForm.checkIn) {
      notify("Choose a check-out date after check-in.", "error");
      return;
    }

    setBookingLoading(true);
    try {
      const amount = Number(pricingQuote.totalAmount || 0);
      const res = await API.post("/booking/create", {
        customerName: bookingForm.name.trim(),
        phoneNumber: normalizePhone(bookingForm.phone),
        bookingType: "Hotel",
        listingId: selectedHotel._id,
        date: bookingForm.checkIn,
        startDate: bookingForm.checkIn,
        endDate: bookingForm.checkOut || bookingForm.checkIn,
        guests: Number(bookingForm.guests || 1),
        rooms: Number(bookingForm.rooms || 1),
        amount,
      });
      const createdBooking = res.data?.data || res.data;
      const bookingId = createdBooking?._id;
      if (!bookingId) throw new Error("Missing booking id");
      trackEvent("stay_booking_started", {
        listing_id: selectedHotel._id,
        rooms: Number(bookingForm.rooms || 1),
        guests: Number(bookingForm.guests || 1),
        amount,
      });
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

      <Container className="relative z-10 px-4 pb-12 pt-24 sm:px-8">
        <section className="mb-5 rounded-[28px] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02)),rgba(8,8,8,0.93)] p-4 backdrop-blur-2xl md:p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-300/30 bg-orange-500/12 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-orange-200">
                <Sparkles size={12} />
                Prime Estates
              </div>
              <h1 className="mt-3 text-2xl font-black uppercase italic tracking-[-0.03em] text-white md:text-4xl">
                BOOK
                <span className="block">PREMIUM STAYS</span>
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/62 md:text-sm">
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
          onSearch={fetchHotels}
          searching={isSearching}
        />

        <SortFilterBar filters={filters} setFilters={setFilters} sort={sort} setSort={setSort} />

        {(loading || isSearching) ? (
          <StaysGridSkeleton />
        ) : filteredHotels.length === 0 ? (
          <EmptyState onReset={resetFilters} />
        ) : (
          <div className="mt-5">
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
          pricingQuote={pricingQuote}
        />
      )}
      </AnimatePresence>
    </div>
  );
}

function SearchBar({
  filters,
  setFilters,
  onSearch,
  searching,
}) {
  return (
    <section className="sticky top-[92px] z-30 rounded-[28px] border border-white/10 bg-black/65 p-4 backdrop-blur-2xl md:p-5">
      <div className="grid gap-3 xl:grid-cols-[1.2fr_0.95fr_auto]">
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

        <Button
          size="lg"
          onClick={onSearch}
          className="h-full min-h-[96px] rounded-2xl px-8 text-[11px] tracking-[0.24em] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_18px_42px_rgba(249,115,22,0.4)]"
        >
          {searching ? "Searching..." : "Search Stays"}
          <Search size={15} />
        </Button>
      </div>
    </section>
  );
}

function SortFilterBar({ filters, setFilters, sort, setSort }) {
  return (
    <section className="mt-5 rounded-[22px] border border-white/10 bg-black/30 p-3">
      <div className="flex flex-wrap items-center gap-3">
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
      </div>
    </section>
  );
}

function StayCard({ hotel, rating, onOpen, index }) {
  const amenities = hotel.parsedAmenities || [];
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
          decoding="async"
          src={hotel.previewImage}
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
  pricingQuote,
}) {
  const today = getDatePlusDays(0);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[2147483000] overflow-y-auto p-3 pt-24 sm:p-4 sm:pt-28 md:p-8 md:pt-32"
    >
      <button onClick={onClose} className="absolute inset-0 h-full w-full bg-black/95 backdrop-blur-2xl" />
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.985 }}
        transition={{ duration: 0.35, ease: motionEase }}
        className="relative mx-auto flex min-h-[calc(100vh-7rem)] w-full max-w-[1280px] flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[#070707] sm:rounded-[34px] lg:min-h-0 lg:max-h-[92vh] lg:grid lg:grid-cols-[1.05fr_0.95fr]"
      >
        <div className="relative min-h-[300px] overflow-hidden border-b border-white/8 lg:border-b-0 lg:border-r">
          <img src={hotel.images?.[currentImgIndex]} alt={hotel.hotelName} loading="eager" decoding="async" className="h-full w-full object-cover" />
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
                <img src={img} alt={`${idx + 1}`} loading="lazy" decoding="async" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-start overflow-y-auto p-4 md:p-6">
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
              <UserInventoryCalendar
                hotelId={hotel._id}
                selectedDate={bookingForm.checkIn}
                onSelectDate={(date) =>
                  setBookingForm((p) => ({
                    ...p,
                    checkIn: date,
                    checkOut: !p.checkOut || p.checkOut <= date ? addDaysToIso(date, 1) : p.checkOut,
                  }))
                }
              />

              <div className="rounded-2xl border border-white/10 bg-black/25 p-3 text-[11px] text-white/72">
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-orange-300">Property Identity</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <p>Property Name: {hotel.hotelName || "Not provided"}</p>
                  <p>Property Type: {hotel.propertyType || "Hotel"}</p>
                  <p>Location: {hotel.location || "Not provided"}</p>
                  <p>Landmark: {hotel.landmark || "Not provided"}</p>
                  <p>Availability Status: {hotel.availabilityStatus || "Available now"}</p>
                  <p>Contact Number: {hotel.contactNumber || "Not provided"}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/25 p-3 text-[11px] text-white/72">
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-orange-300">Facility Infrastructure</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <p>Rooms Available: {hotel.roomsAvailable ?? "N/A"}</p>
                  <p>Guests per Room: {hotel.guestsPerRoom ?? "N/A"}</p>
                  <p>Price Per Night: Rs {hotel.pricePerNight ?? "N/A"}</p>
                  <p>Distance: {hotel.distance || "Not specified"}</p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedAmenities.length ? selectedAmenities.map((amenity) => (
                    <div key={amenity} className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] text-white/70">
                      <span className="text-orange-300">{amenityIcons[amenity] || <Check size={13} />}</span>
                      {amenity}
                    </div>
                  )) : <p className="text-[11px] text-white/60">No amenities listed.</p>}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/25 p-3 text-[11px] text-white/72">
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-orange-300">Property Narrative</p>
                <p className="text-white/70">{hotel.description || "No description provided by owner."}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <LabelInput icon={<User size={14} />} placeholder="Full Name" value={bookingForm.name} onChange={(value) => setBookingForm((p) => ({ ...p, name: value }))} />
                <LabelInput icon={<Phone size={14} />} placeholder="Phone Number" value={bookingForm.phone} onChange={(value) => setBookingForm((p) => ({ ...p, phone: value }))} />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <DateInput value={bookingForm.checkIn} onChange={(value) => setBookingForm((p) => ({ ...p, checkIn: value }))} min={today} label="Check-in" />
                <DateInput value={bookingForm.checkOut} onChange={(value) => setBookingForm((p) => ({ ...p, checkOut: value }))} min={addDaysToIso(bookingForm.checkIn || today, 1)} label="Check-out" />
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
              {bookingLoading
                ? "Starting Payment..."
                : pricingQuote.totalNights > 0
                  ? `Reserve Now - Rs ${pricingQuote.totalAmount || 0} total for ${pricingQuote.totalNights} night${pricingQuote.totalNights > 1 ? "s" : ""}`
                  : `Reserve Now - Rs ${pricingQuote.unitPrice || hotel.pricePerNight}/night`}
              <ArrowRight size={14} />
            </Button>

            {pricingQuote.error ? (
              <p className="mt-3 text-xs text-rose-300">{pricingQuote.error}</p>
            ) : (
              <p className="mt-3 text-xs text-orange-200">
                {pricingQuote.loading
                  ? "Refreshing live pricing..."
                  : `Estimated total: Rs ${pricingQuote.totalAmount || 0} for ${pricingQuote.totalNights || getNightCount(bookingForm.checkIn, bookingForm.checkOut)} night${(pricingQuote.totalNights || getNightCount(bookingForm.checkIn, bookingForm.checkOut)) > 1 ? "s" : ""} and ${bookingForm.rooms} room${Number(bookingForm.rooms || 1) > 1 ? "s" : ""}.`}
              </p>
            )}

            <div className="mt-4 grid gap-2 rounded-2xl border border-white/10 bg-black/25 p-3 text-[11px] text-white/72">
              <p className="inline-flex items-center gap-2"><Check size={13} className="text-emerald-300" /> Free cancellation</p>
              <p className="inline-flex items-center gap-2"><Check size={13} className="text-emerald-300" /> Instant booking confirmation</p>
              <p className="inline-flex items-center gap-2"><Check size={13} className="text-emerald-300" /> Secure payment</p>
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










