import React from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Activity,
  ArrowRight,
  BellRing,
  Clock,
  CloudRain,
  Compass,
  Eye,
  HeartPulse,
  Mountain,
  Navigation2,
  ShieldCheck,
  Sparkles,
  Sunrise,
  Sunset,
  Thermometer,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Container } from "../components/ui/Container";
import { Button } from "../components/ui/Button";

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
    name: "Kedarnath Trek",
    difficulty: "Moderate",
    time: "6-8 Hrs",
    img: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=1200",
    price: "Rs 2,500",
  },
  {
    name: "Chopta Chandrashila",
    difficulty: "Easy",
    time: "4 Hrs",
    img: "https://images.unsplash.com/photo-1596328330768-ae380299f187?q=80&w=1200",
    price: "Rs 1,800",
  },
  {
    name: "Valley Of Flowers",
    difficulty: "Hard",
    time: "3 Days",
    img: "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?q=80&w=1200",
    price: "Rs 5,200",
  },
];

const highlights = [
  {
    icon: <ShieldCheck size={28} />,
    title: "Tactical Vetting",
    desc: "Every fleet and stay is screened for terrain, trust, and reliability.",
  },
  {
    icon: <HeartPulse size={28} />,
    title: "Rapid Support",
    desc: "Assistance feels close at hand before, during, and after a mountain run.",
  },
  {
    icon: <Eye size={28} />,
    title: "Live Route Vision",
    desc: "Road, weather, and timing updates keep every plan responsive.",
  },
  {
    icon: <Compass size={28} />,
    title: "Local Intelligence",
    desc: "Decision-making backed by on-ground context, not guesswork.",
  },
];

const tickerItems = [
  { icon: <Thermometer size={12} />, text: "Kedarnath 4C", tone: "text-orange-400" },
  { icon: <CloudRain size={12} />, text: "Rishikesh Clear", tone: "text-amber-400" },
  { icon: <Activity size={12} />, text: "Route Grid Stable", tone: "text-emerald-400" },
  { icon: <Zap size={12} />, text: "High Demand Window", tone: "text-yellow-400" },
];

export default function Home() {
  const navigate = useNavigate();
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 700], [0, 180]);
  const hazeY = useTransform(scrollY, [0, 700], [0, -90]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#040404] text-white">
      <div className="pointer-events-none fixed inset-0 z-0">
        <motion.div style={{ y: hazeY }} className="absolute left-[10%] top-24 h-[32rem] w-[32rem] rounded-full bg-orange-600/14 blur-[130px]" />
        <div className="absolute right-[8%] top-[28rem] h-[26rem] w-[26rem] rounded-full bg-amber-400/10 blur-[130px]" />
        <div className="absolute bottom-[-8rem] left-1/2 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-white/5 blur-[150px]" />
      </div>

      <section className="relative z-10 overflow-hidden border-b border-white/8 pt-28">
        <div className="absolute inset-0">
          <motion.div style={{ y: heroY }} className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=2070"
              className="h-full w-full scale-110 object-cover opacity-30"
              alt="Mountain expedition"
            />
          </motion.div>
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,4,4,0.62),rgba(4,4,4,0.28)_32%,rgba(4,4,4,0.88)_80%,#040404_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.2),transparent_30%)]" />
        </div>

        <div className="relative z-20 overflow-hidden border-y border-white/8 bg-black/35 backdrop-blur-2xl">
          <div className="animate-marquee flex min-w-max gap-12 py-3">
            {[...tickerItems, ...tickerItems, ...tickerItems, ...tickerItems].map((item, index) => (
              <div key={`${item.text}-${index}`} className={`flex items-center gap-3 whitespace-nowrap text-[9px] font-black uppercase tracking-[0.45em] ${item.tone}`}>
                {item.icon}
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        <Container className="relative z-10 py-16 md:py-24 lg:py-28">
          <motion.div variants={stagger} initial="hidden" animate="show" className="max-w-6xl">
            <motion.div variants={fadeUp} className="mb-8 inline-flex items-center gap-3 rounded-full border border-orange-400/20 bg-orange-500/10 px-5 py-2 backdrop-blur-xl">
              <Sparkles size={14} className="text-amber-300" />
              <span className="text-[10px] font-black uppercase tracking-[0.45em] text-orange-200">Bold Mountain Command</span>
            </motion.div>

            <motion.h1 variants={fadeUp} className="text-balance text-5xl font-black uppercase italic tracking-[-0.06em] text-white sm:text-7xl lg:text-[10rem] lg:leading-[0.82]">
              Journeys
              <br />
              <span className="bg-gradient-to-r from-white via-amber-200 to-orange-500 bg-clip-text text-transparent">
                With Impact.
              </span>
            </motion.h1>

            <motion.div variants={fadeUp} className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
              <p className="max-w-2xl border-l border-orange-500/30 pl-6 text-base font-medium leading-8 text-white/68 md:text-lg">
                Mountain Mate already has the product flow. This pass is about making it feel unforgettable: cinematic depth, sharper motion, and a stronger sense of confidence in every interaction.
              </p>
              <div className="cinematic-surface spotlight-border rounded-[32px] p-6">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <StatCard value="4.9" label="Rider Score" />
                  <StatCard value="2K+" label="Peak Trips" />
                </div>
              </div>
            </motion.div>

            <motion.div variants={fadeUp} className="mt-10 cinematic-surface spotlight-border rounded-[34px] p-3 md:rounded-[42px] md:p-4">
              <div className="grid gap-3 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)_auto]">
                <div className="rounded-[28px] border border-white/8 bg-white/6 px-6 py-5 backdrop-blur-xl">
                  <div className="mb-3 flex items-center gap-3 text-orange-400">
                    <Navigation2 size={18} className="rotate-45" />
                    <span className="text-[9px] font-black uppercase tracking-[0.35em] text-white/45">Where To</span>
                  </div>
                  <input
                    placeholder="ENTER YOUR NEXT ASCENT..."
                    className="w-full bg-transparent text-sm font-black uppercase tracking-[0.25em] text-white outline-none placeholder:text-white/24 md:text-base"
                  />
                </div>
                <div className="rounded-[28px] border border-white/8 bg-white/6 px-6 py-5 backdrop-blur-xl">
                  <div className="mb-3 flex items-center gap-3 text-amber-300">
                    <BellRing size={18} />
                    <span className="text-[9px] font-black uppercase tracking-[0.35em] text-white/45">Journey Type</span>
                  </div>
                  <p className="text-sm font-black uppercase tracking-[0.25em] text-white/78 md:text-base">Stay, Ride, Or Both</p>
                </div>
                <Button size="lg" onClick={() => navigate("/explore-stays")} className="min-h-full rounded-[28px] px-8 text-[11px] tracking-[0.3em]">
                  Start Access <ArrowRight size={16} />
                </Button>
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
            <InfoStrip title="Route Precision" text="Cinematic booking flow with clearer momentum and hierarchy." />
            <InfoStrip title="Layered Motion" text="Softer transitions, smarter reveals, and premium hover behavior." />
            <InfoStrip title="Travel Command" text="The interface feels like a guided ascent, not just a list of screens." />
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
              <p className="text-[10px] font-black uppercase tracking-[0.45em] text-orange-300">Ritual Windows</p>
              <h2 className="mt-3 text-3xl font-black uppercase italic tracking-tight text-white md:text-5xl">Sacred timing, designed with atmosphere.</h2>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <TimingBox icon={<Sunrise size={16} />} time="04:00 AM" label="Abhishek" />
              <TimingBox icon={<BellRing size={16} />} time="06:30 PM" label="Aarti" />
              <TimingBox icon={<Sunset size={16} />} time="08:30 PM" label="Shayan" />
              <TimingBox icon={<Zap size={16} />} time="OPEN" label="Live Status" highlight />
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
            <p className="text-[10px] font-black uppercase tracking-[0.45em] text-orange-400">Expedition Edge</p>
            <h2 className="mt-4 text-4xl font-black uppercase italic tracking-[-0.04em] text-white md:text-7xl">A frontend that lands with authority.</h2>
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
              <p className="text-[10px] font-black uppercase tracking-[0.45em] text-orange-400">Featured Routes</p>
              <h2 className="mt-4 text-4xl font-black uppercase italic tracking-[-0.05em] text-white md:text-7xl lg:text-8xl">
                The elite
                <span className="ml-3 text-white/20">manifest.</span>
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-white/56 md:text-base">
              These cards now feel like destination panels instead of static tiles: stronger image drama, better motion depth, and cleaner visual rhythm.
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
                <img src={route.img} alt={route.name} className="absolute inset-0 h-full w-full object-cover opacity-65 transition-transform duration-700 ease-out group-hover:scale-110" />
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
                      <span className="text-[10px] font-black uppercase tracking-[0.32em] text-white/42">Deploy Plan</span>
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
              Ascend
              <br />
              <span className="bg-gradient-to-b from-amber-200 via-orange-400 to-orange-700 bg-clip-text text-transparent">Together.</span>
            </h2>
            <p className="mx-auto mt-8 max-w-2xl text-base leading-8 text-white/62 md:text-lg">
              The new direction makes the app feel high-end and intentional without losing the adventurous energy it already has.
            </p>
            <div className="mt-10 flex justify-center">
              <Button as="button" size="lg" variant="neutral" onClick={() => navigate("/register")} className="rounded-full px-10">
                Join The Fleet <ArrowRight size={16} />
              </Button>
            </div>
          </motion.div>
        </Container>
      </section>
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
