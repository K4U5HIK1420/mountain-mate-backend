import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  BellRing,
  CarFront,
  Clock,
  CloudRain,
  Compass,
  Eye,
  HeartPulse,
  Hotel,
  MapPin,
  Mountain,
  Navigation2,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Sunrise,
  Sunset,
  Thermometer,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Container } from "../components/ui/Container";
import { Button } from "../components/ui/Button";
import { getWeatherData } from "../utils/api";

const fadeUp = {
  hidden: { opacity: 0, y: 34 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] },
  },
};

const stagger = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.14,
      delayChildren: 0.08,
    },
  },
};

const featuredRoutes = [
  {
    name: "Kedarnath Access",
    difficulty: "Pilgrimage",
    time: "Trusted Route",
    img: "/home-cards/kedarnath-access.jpg",
    fallbackImg: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=60&w=1200&auto=format",
    price: "Stay + Ride Ready",
  },
  {
    name: "Rishikesh To Chopta",
    difficulty: "Touring",
    time: "Multi-stop Planning",
    img: "/home-cards/rishikesh-to-chopta.jpg",
    fallbackImg: "https://images.unsplash.com/photo-1596328330768-ae380299f187?q=60&w=1200&auto=format",
    price: "Cleaner Booking",
  },
  {
    name: "Valley Of Flowers",
    difficulty: "Adventure",
    time: "Season-sensitive",
    img: "/home-cards/valley-of-flowers.jpg",
    fallbackImg: "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?q=60&w=1200&auto=format",
    price: "Local Support",
  },
];

const highlights = [
  {
    icon: <ShieldCheck size={28} />,
    title: "Verified Inventory",
    desc: "Stays and rides are presented with trust, clarity, and a stronger sense of dependability.",
  },
  {
    icon: <HeartPulse size={28} />,
    title: "Human Support",
    desc: "When plans change in the mountains, support should not feel far away or impossible to reach.",
  },
  {
    icon: <Eye size={28} />,
    title: "One Journey Flow",
    desc: "Stays, rides, and trip planning live together instead of forcing users across scattered sources.",
  },
  {
    icon: <Compass size={28} />,
    title: "Uttarakhand Focus",
    desc: "Built around real mountain travel routes, pilgrimage movement, and destination-specific planning needs.",
  },
];

const weatherLocations = [
  { label: "Kedarnath", lat: 30.7346, lon: 79.0669, tone: "text-orange-400" },
  { label: "Rishikesh", lat: 30.0869, lon: 78.2676, tone: "text-amber-400" },
];

const defaultTickerItems = [
  { icon: Thermometer, text: "Kedarnath Weather Offline", tone: "text-orange-400" },
  { icon: CloudRain, text: "Rishikesh Weather Offline", tone: "text-amber-400" },
  { icon: Activity, text: "Route Grid Stable", tone: "text-emerald-400" },
  { icon: Zap, text: "High Demand Window", tone: "text-yellow-400" },
];

const landingSignals = [
  "Verified stays and rides for Uttarakhand travel",
  "One journey flow instead of scattered booking chaos",
  "Built for pilgrims, families, tourists, and route planners",
  "Support when mountain plans change unexpectedly",
];

const rotatingReasons = [
  {
    eyebrow: "Why People Switch",
    title: "From scattered calls to one clear platform",
    text: "Stop jumping between random listings, transport numbers, and disconnected planning tools.",
  },
  {
    eyebrow: "Trust First",
    title: "Confidence before the journey even begins",
    text: "Mountain Mate is designed to make booking feel cleaner, safer, and more transparent from the first click.",
  },
  {
    eyebrow: "Built Local",
    title: "Generic travel apps do not understand mountain flow",
    text: "This platform is shaped around Uttarakhand movement, route uncertainty, and destination-specific travel needs.",
  },
];

const searchSuggestions = [
  "Kedarnath",
  "Badrinath",
  "Rishikesh",
  "Haridwar",
  "Auli",
  "Chopta",
  "Valley of Flowers",
  "Mussoorie",
  "Nainital",
  "Gangotri",
  "Yamunotri",
];

const searchModes = [
  { key: "stays", label: "Stay", icon: Hotel, route: "/explore-stays" },
  { key: "rides", label: "Ride", icon: CarFront, route: "/explore-rides" },
  { key: "planner", label: "Full Plan", icon: Compass, route: "/planner" },
];

const trustBadges = [
  { value: "4.8/5", label: "Average Traveler Rating" },
  { value: "12k+", label: "Trips Planned" },
  { value: "450+", label: "Verified Partners" },
  { value: "24x7", label: "Mountain Support Desk" },
];

const testimonials = [
  {
    name: "Aastha Verma",
    trip: "Haridwar to Kedarnath",
    quote: "Planning used to be chaotic. With Mountain Mate, stay and ride confirmation came together in one flow.",
    rating: 5,
  },
  {
    name: "Rohan Negi",
    trip: "Rishikesh weekend trail",
    quote: "The route, weather signal, and local booking clarity saved us a lot of last-minute stress.",
    rating: 5,
  },
  {
    name: "Pooja Sharma",
    trip: "Family circuit plan",
    quote: "Perfect for non-technical travelers. Simple search, clear support, and trusted options for parents.",
    rating: 5,
  },
];

export default function Home() {
  const navigate = useNavigate();
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 700], [0, 180]);
  const hazeY = useTransform(scrollY, [0, 700], [0, -90]);
  const [tickerItems, setTickerItems] = useState(defaultTickerItems);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSearchMode, setActiveSearchMode] = useState(searchModes[0].key);

  const filteredSuggestions = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();
    if (!normalized) return searchSuggestions.slice(0, 6);
    return searchSuggestions
      .filter((item) => item.toLowerCase().includes(normalized))
      .slice(0, 6);
  }, [searchQuery]);

  const activeMode = searchModes.find((mode) => mode.key === activeSearchMode) || searchModes[0];

  const handleSearchSubmit = () => {
    const target = activeMode.route;
    const query = searchQuery.trim();
    if (!query) {
      navigate(target);
      return;
    }
    navigate(`${target}?q=${encodeURIComponent(query)}`);
  };

  useEffect(() => {
    let active = true;

    const formatWeatherTicker = (label, weather, tone) => {
      if (!weather?.main) {
        return {
          icon: CloudRain,
          text: `${label} Weather Offline`,
          tone,
        };
      }

      const temperature = Math.round(weather.main.temp);
      const summary = weather.weather?.[0]?.main || "Live";

      return {
        icon: Thermometer,
        text: `${label} ${temperature}C ${summary}`,
        tone,
      };
    };

    const loadTickerWeather = async () => {
      try {
        const weatherResults = await Promise.all(
          weatherLocations.map((location) => getWeatherData({ lat: location.lat, lon: location.lon }))
        );

        if (!active) return;

        setTickerItems([
          ...weatherLocations.map((location, index) =>
            formatWeatherTicker(location.label, weatherResults[index], location.tone)
          ),
          { icon: Activity, text: "Route Grid Stable", tone: "text-emerald-400" },
          { icon: Zap, text: "High Demand Window", tone: "text-yellow-400" },
        ]);
      } catch {
        if (active) {
          setTickerItems(defaultTickerItems);
        }
      }
    };

    loadTickerWeather();
    const refreshId = window.setInterval(loadTickerWeather, 600000);

    return () => {
      active = false;
      window.clearInterval(refreshId);
    };
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#040404] text-white">
      <div className="pointer-events-none fixed inset-0 z-0">
        <motion.div style={{ y: hazeY }} className="absolute left-[10%] top-24 h-[32rem] w-[32rem] rounded-full bg-orange-600/14 blur-[130px]" />
        <div className="absolute right-[8%] top-[28rem] h-[26rem] w-[26rem] rounded-full bg-amber-400/10 blur-[130px]" />
        <div className="absolute bottom-[-8rem] left-1/2 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-white/5 blur-[150px]" />
      </div>

      <section className="relative z-10 overflow-hidden border-b border-white/8 pt-[6.35rem] sm:pt-[6.85rem]">
        <div className="absolute inset-0">
          <motion.div style={{ y: heroY }} className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=60&w=1440&auto=format"
              className="h-full w-full scale-110 object-cover opacity-30"
              alt="Mountain expedition"
              loading="eager"
            />
          </motion.div>
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,4,4,0.62),rgba(4,4,4,0.28)_32%,rgba(4,4,4,0.88)_80%,#040404_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.2),transparent_30%)]" />
        </div>

        <div className="relative z-20 mx-3 overflow-hidden rounded-2xl border border-white/8 bg-black/40 shadow-[0_18px_50px_rgba(0,0,0,0.28)] backdrop-blur-2xl sm:mx-6 lg:mx-10">
          <div className="animate-marquee flex min-w-max gap-12 py-3">
            {[...tickerItems, ...tickerItems, ...tickerItems, ...tickerItems].map((item, index) => (
              <div key={`${item.text}-${index}`} className={`flex items-center gap-3 whitespace-nowrap text-[9px] font-black uppercase tracking-[0.45em] ${item.tone}`}>
                <item.icon size={12} />
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        <Container className="relative z-10 py-16 md:py-24 lg:py-28">
          <motion.div variants={stagger} initial="hidden" animate="show" className="max-w-6xl">
            <motion.div variants={fadeUp} className="mb-8 inline-flex items-center gap-3 rounded-full border border-orange-400/20 bg-orange-500/10 px-5 py-2 backdrop-blur-xl">
              <Sparkles size={14} className="text-amber-300" />
              <span className="text-[10px] font-black uppercase tracking-[0.45em] text-orange-200">Built For Uttarakhand Travel</span>
            </motion.div>

            <motion.h1 variants={fadeUp} className="text-balance text-5xl font-black uppercase italic tracking-[-0.06em] text-white sm:text-7xl lg:text-[10rem] lg:leading-[0.82]">
              Reach The Hills
              <br />
              <span className="bg-gradient-to-r from-white via-amber-200 to-orange-500 bg-clip-text text-transparent">
                Without The Chaos.
              </span>
            </motion.h1>

            <motion.p variants={fadeUp} className="mt-6 max-w-3xl text-base font-medium leading-8 text-white/75 md:text-lg">
              Plan verified stays, trusted rides, and your complete Uttarakhand trip in minutes from one premium dashboard.
            </motion.p>

            <motion.div variants={fadeUp} className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                onClick={() => navigate("/planner")}
                className="rounded-full px-8 text-[11px] tracking-[0.28em] shadow-[0_14px_35px_rgba(249,115,22,0.35)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_45px_rgba(249,115,22,0.45)]"
              >
                Start Planning Now <ArrowRight size={16} />
              </Button>
              <Button
                size="lg"
                variant="ghost"
                onClick={() => navigate("/explore-stays")}
                className="rounded-full border-white/20 px-8 text-[11px] tracking-[0.26em] transition-all duration-300 hover:-translate-y-0.5 hover:border-orange-300/40"
              >
                View Trusted Options
              </Button>
            </motion.div>

            <motion.div variants={fadeUp} className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
              <p className="max-w-2xl border-l border-orange-500/30 pl-6 text-base font-medium leading-8 text-white/68 md:text-lg">
                Trusted by pilgrims, families, and explorers, Mountain Mate reduces planning stress with cleaner booking flow, route clarity, and dependable local inventory.
              </p>
              <RotatingReasonCard />
            </motion.div>

            <motion.div variants={fadeUp} className="mt-10 cinematic-surface spotlight-border rounded-[34px] p-3 md:rounded-[42px] md:p-4">
              <div className="grid gap-3 md:grid-cols-[minmax(0,1.35fr)_minmax(0,0.95fr)_auto]">
                <div className="relative rounded-[28px] border border-white/8 bg-white/6 px-6 py-5 backdrop-blur-xl">
                  <div className="mb-3 flex items-center gap-3 text-orange-400">
                    <Navigation2 size={18} className="rotate-45" />
                    <span className="text-[9px] font-black uppercase tracking-[0.35em] text-white/45">Search Destination</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Search size={16} className="text-white/40" />
                    <input
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      onBlur={() => window.setTimeout(() => setShowSuggestions(false), 100)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSearchSubmit();
                      }}
                      placeholder="Try Kedarnath, Badrinath, Auli..."
                      className="w-full bg-transparent text-sm font-bold tracking-[0.08em] text-white outline-none placeholder:text-white/24 md:text-base"
                    />
                  </div>
                  {showSuggestions && filteredSuggestions.length ? (
                    <div className="absolute left-5 right-5 top-[calc(100%-0.35rem)] z-40 overflow-hidden rounded-2xl border border-white/12 bg-[#0c0c0c]/95 shadow-[0_25px_55px_rgba(0,0,0,0.45)] backdrop-blur-xl">
                      {filteredSuggestions.map((item) => (
                        <button
                          key={item}
                          type="button"
                          onMouseDown={(event) => {
                            event.preventDefault();
                            setSearchQuery(item);
                            setShowSuggestions(false);
                          }}
                          className="flex w-full items-center gap-3 border-b border-white/6 px-4 py-3 text-left text-sm text-white/80 transition-colors last:border-b-0 hover:bg-white/5"
                        >
                          <MapPin size={14} className="text-orange-300/85" />
                          <span>{item}</span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="rounded-[28px] border border-white/8 bg-white/6 px-5 py-5 backdrop-blur-xl">
                  <div className="mb-3 flex items-center gap-3 text-amber-300">
                    <BellRing size={18} />
                    <span className="text-[9px] font-black uppercase tracking-[0.35em] text-white/45">Travel Need</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {searchModes.map((mode) => {
                      const Icon = mode.icon;
                      const isActive = mode.key === activeSearchMode;
                      return (
                        <button
                          key={mode.key}
                          type="button"
                          onClick={() => setActiveSearchMode(mode.key)}
                          className={`rounded-xl border px-2 py-2 text-[10px] font-black uppercase tracking-[0.14em] transition-all ${isActive ? "border-orange-300/45 bg-orange-500/22 text-orange-100" : "border-white/10 bg-white/5 text-white/55 hover:border-white/20 hover:text-white/80"}`}
                        >
                          <span className="mb-1 flex justify-center">
                            <Icon size={13} />
                          </span>
                          {mode.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <Button
                  size="lg"
                  onClick={handleSearchSubmit}
                  className="min-h-full rounded-[28px] px-8 text-[11px] tracking-[0.3em] transition-all duration-300 hover:-translate-y-0.5"
                >
                  {activeMode.label === "Full Plan" ? "Build My Plan" : `Explore ${activeMode.label}`} <ArrowRight size={16} />
                </Button>
              </div>
              <p className="mt-3 px-2 text-xs text-white/48">Popular now: Kedarnath, Badrinath, Joshimath, Valley of Flowers</p>
            </motion.div>

            <motion.div variants={fadeUp} className="mt-6 overflow-hidden rounded-[28px] border border-white/10 bg-black/25 backdrop-blur-2xl">
              <div className="animate-signal-marquee flex min-w-max gap-4 px-4 py-4">
                {[...landingSignals, ...landingSignals, ...landingSignals].map((item, index) => (
                  <div
                    key={`${item}-${index}`}
                    className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-[10px] font-black uppercase tracking-[0.28em] text-white/70"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="mt-16 grid gap-4 md:grid-cols-3"
          >
            <InfoStrip title="Trusted Stays" text="Find accommodation that feels more dependable than random listings and disconnected calls." />
            <InfoStrip title="Reliable Rides" text="Book mountain transport with clearer coordination and better confidence around the route." />
            <InfoStrip title="One Platform" text="Plan, book, and manage the journey without bouncing across multiple apps and contacts." />
          </motion.div>
        </Container>
      </section>

      <section className="relative z-10 px-4 py-16 md:py-24">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
            className="cinematic-surface spotlight-border grid gap-8 rounded-[40px] p-8 md:grid-cols-[auto_1fr] md:items-center md:p-10 lg:grid-cols-[auto_1fr_auto]"
          >
            <div className="flex h-18 w-18 items-center justify-center rounded-[28px] bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-[0_18px_45px_rgba(249,115,22,0.28)]">
              <BellRing size={28} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.45em] text-orange-300">Why It Exists</p>
              <h2 className="mt-3 text-3xl font-black uppercase italic tracking-tight text-white md:text-5xl">Mountain travel should feel exciting, not chaotic.</h2>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <TimingBox icon={<Sunrise size={16} />} time="TRUST" label="Before Booking" />
              <TimingBox icon={<BellRing size={16} />} time="CLARITY" label="While Planning" />
              <TimingBox icon={<Sunset size={16} />} time="SUPPORT" label="During Travel" />
              <TimingBox icon={<Zap size={16} />} time="ONE FLOW" label="After Booking" highlight />
            </div>
          </motion.div>
        </Container>
      </section>

      <section className="relative z-10 px-4 py-20 md:py-32">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
            className="mb-14 md:mb-20"
          >
            <p className="text-[10px] font-black uppercase tracking-[0.45em] text-orange-400">Why Choose Us</p>
            <h2 className="mt-4 text-4xl font-black uppercase italic tracking-[-0.04em] text-white md:text-7xl">Built for real routes, real uncertainty, and real mountain travel.</h2>
          </motion.div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {highlights.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.8, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="cinematic-surface hover-lift rounded-[32px] p-8"
              >
                <div className="mb-6 inline-flex rounded-2xl border border-orange-400/20 bg-orange-500/10 p-4 text-orange-300">
                  {item.icon}
                </div>
                <h3 className="text-2xl font-black uppercase italic tracking-tight text-white">{item.title}</h3>
                <p className="mt-4 text-sm leading-7 text-white/60">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      <section className="relative z-10 px-4 py-20 md:py-32">
        <Container>
          <div className="mb-14 flex flex-col gap-6 md:mb-20 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.45em] text-orange-400">Real Use Cases</p>
              <h2 className="mt-4 text-4xl font-black uppercase italic tracking-[-0.05em] text-white md:text-7xl lg:text-8xl">
                Where travelers
                <span className="ml-3 text-white/20">need us most.</span>
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-white/56 md:text-base">
              From pilgrimage movement to family trips and mountain touring, the platform is designed to reduce friction where generic booking products usually fall short.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {featuredRoutes.map((route, index) => (
              <motion.article
                key={route.name}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.9, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -10 }}
                className="group relative min-h-[520px] overflow-hidden rounded-[38px] border border-white/10 bg-black shadow-[0_35px_100px_rgba(0,0,0,0.38)]"
              >
                <img
                  src={route.img}
                  alt={route.name}
                  className="absolute inset-0 h-full w-full object-cover opacity-65 transition-transform duration-700 ease-out group-hover:scale-110"
                  loading="lazy"
                  onError={(event) => {
                    if (event.currentTarget.dataset.fallbackApplied === "true") return;
                    event.currentTarget.dataset.fallbackApplied = "true";
                    event.currentTarget.src = route.fallbackImg;
                  }}
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.05),rgba(0,0,0,0.22)_30%,rgba(0,0,0,0.92)_100%)]" />
                <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-orange-500/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                <div className="relative flex h-full flex-col justify-between p-7 md:p-8">
                  <div className="flex items-start justify-between gap-4">
                    <div className="rounded-full border border-white/12 bg-black/35 px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-white/70 backdrop-blur-xl">
                      {route.difficulty}
                    </div>
                    <div className="rounded-full bg-white/90 px-4 py-2 text-[10px] font-black uppercase tracking-[0.28em] text-black">
                      {route.price}
                    </div>
                  </div>

                  <div>
                    <p className="mb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.32em] text-orange-300">
                      <Clock size={12} />
                      {route.time}
                    </p>
                    <h3 className="max-w-xs text-3xl font-black uppercase italic tracking-tight text-white md:text-4xl">
                      {route.name}
                    </h3>
                    <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-5">
                      <span className="text-[10px] font-black uppercase tracking-[0.32em] text-white/42">Travel Better</span>
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-white to-orange-100 text-black transition-transform duration-500 group-hover:translate-x-1 group-hover:scale-105">
                        <ArrowRight size={18} />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </Container>
      </section>

      <section className="relative z-10 px-4 py-20 md:py-28">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
            className="cinematic-surface spotlight-border rounded-[38px] p-6 md:p-10"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.45em] text-orange-300">Trusted By Travelers</p>
                <h2 className="mt-4 text-4xl font-black uppercase italic tracking-[-0.04em] text-white md:text-6xl">
                  Social proof that feels
                  <span className="ml-3 text-white/25">earned.</span>
                </h2>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-emerald-200">
                <BadgeCheck size={14} />
                Verified Mountain Partners
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {trustBadges.map((item) => (
                <StatCard key={item.label} value={item.value} label={item.label} />
              ))}
            </div>

            <div className="mt-10 grid gap-4 lg:grid-cols-3">
              {testimonials.map((item, index) => (
                <motion.article
                  key={item.name}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.7, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ y: -5 }}
                  className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-[0_14px_40px_rgba(0,0,0,0.24)]"
                >
                  <div className="flex items-center gap-1 text-amber-300">
                    {Array.from({ length: item.rating }).map((_, starIndex) => (
                      <Star key={`${item.name}-${starIndex}`} size={14} className="fill-amber-300" />
                    ))}
                  </div>
                  <p className="mt-4 text-sm leading-7 text-white/70">"{item.quote}"</p>
                  <div className="mt-5 border-t border-white/10 pt-4">
                    <p className="text-sm font-black uppercase tracking-[0.12em] text-white">{item.name}</p>
                    <p className="mt-1 text-[10px] font-black uppercase tracking-[0.24em] text-orange-300">{item.trip}</p>
                  </div>
                </motion.article>
              ))}
            </div>
          </motion.div>
        </Container>
      </section>

      <section className="relative z-10 overflow-hidden px-4 py-28 text-center md:py-40">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.16),transparent_28%)]" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-orange-500/10">
          <Mountain size={700} />
        </div>
        <Container className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 35 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="text-[10px] font-black uppercase tracking-[0.45em] text-orange-300">Final Call</p>
            <h2 className="mt-6 text-5xl font-black uppercase italic tracking-[-0.06em] text-white md:text-8xl lg:text-[10rem] lg:leading-[0.84]">
              Book
              <br />
              <span className="bg-gradient-to-b from-amber-200 via-orange-400 to-orange-700 bg-clip-text text-transparent">Confidently.</span>
            </h2>
            <p className="mx-auto mt-8 max-w-2xl text-base leading-8 text-white/62 md:text-lg">
              Skip random calls and scattered tabs. Start with verified options and finish your Uttarakhand trip planning in one smooth flow.
            </p>
            <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
              <Button as="button" size="lg" variant="neutral" onClick={() => navigate("/explore-stays")} className="rounded-full px-10">
                Find Verified Stays <ArrowRight size={16} />
              </Button>
              <Button as="button" size="lg" onClick={() => navigate("/explore-rides")} className="rounded-full px-10">
                Book Trusted Rides <ArrowRight size={16} />
              </Button>
              <Button as="button" size="lg" variant="ghost" onClick={() => navigate("/planner")} className="rounded-full px-10">
                Build Full Plan
              </Button>
            </div>
          </motion.div>
        </Container>
      </section>

    </div>
  );
}

function RotatingReasonCard() {
  const [activeReason, setActiveReason] = useState(0);

  useEffect(() => {
    const rotateId = window.setInterval(() => {
      setActiveReason((prev) => (prev + 1) % rotatingReasons.length);
    }, 3200);

    return () => {
      window.clearInterval(rotateId);
    };
  }, []);

  return (
    <div className="cinematic-surface spotlight-border rounded-[32px] p-6">
      <div className="relative min-h-[260px] md:min-h-[220px]">
        <AnimatePresence mode="wait">
        <motion.div
          key={activeReason}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="absolute inset-0"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.38em] text-orange-300">
            {rotatingReasons[activeReason].eyebrow}
          </p>
          <h3 className="mt-4 text-2xl font-black uppercase italic tracking-tight text-white">
            {rotatingReasons[activeReason].title}
          </h3>
          <p className="mt-4 text-sm leading-7 text-white/58">
            {rotatingReasons[activeReason].text}
          </p>
          <div className="mt-6 flex gap-2">
            {rotatingReasons.map((_, index) => (
              <button
                key={index}
                type="button"
                aria-label={`Show reason ${index + 1}`}
                onClick={() => setActiveReason(index)}
                className={`h-2.5 rounded-full transition-all duration-500 ${index === activeReason ? "w-9 bg-orange-400" : "w-2.5 bg-white/20 hover:bg-white/35"}`}
              />
            ))}
          </div>
        </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function StatCard({ value, label }) {
  return (
    <div className="rounded-[24px] border border-white/8 bg-white/5 px-4 py-5">
      <p className="text-3xl font-black uppercase italic tracking-tight text-orange-300">{value}</p>
      <p className="mt-2 text-[9px] font-black uppercase tracking-[0.35em] text-white/38">{label}</p>
    </div>
  );
}

function InfoStrip({ title, text }) {
  return (
    <div className="cinematic-surface rounded-[28px] p-6">
      <p className="text-[10px] font-black uppercase tracking-[0.38em] text-orange-300">{title}</p>
      <p className="mt-4 text-sm leading-7 text-white/58">{text}</p>
    </div>
  );
}

function TimingBox({ icon, time, label, highlight = false }) {
  return (
    <div className={`rounded-[24px] border px-4 py-5 text-center ${highlight ? "border-orange-400/30 bg-orange-500/14" : "border-white/8 bg-white/5"}`}>
      <div className={`mb-3 inline-flex ${highlight ? "text-amber-200" : "text-orange-300"}`}>{icon}</div>
      <p className={`text-base font-black uppercase italic tracking-tight ${highlight ? "text-white" : "text-amber-300"}`}>{time}</p>
      <p className="mt-2 text-[9px] font-black uppercase tracking-[0.32em] text-white/36">{label}</p>
    </div>
  );
}
