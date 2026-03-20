import React, { useState, useEffect } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Sparkles, MapPin, ShieldCheck,
  Users, Star, Zap, Mountain, Clock,
  CloudRain, Wind, Thermometer, Navigation2, Activity,
  Sunrise, Sunset, BellRing, Compass, Eye, HeartPulse
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Container } from "../components/ui/Container";

export default function Home() {
  const navigate = useNavigate();
  const [location, setLocation] = useState("");
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 150]);

  const featuredRoutes = [
    { name: "Kedarnath Trek", difficulty: "Moderate", time: "6-8 hrs", img: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=600", price: "₹2,500" },
    { name: "Chopta-Chandrashila", difficulty: "Easy", time: "4 hrs", img: "https://images.unsplash.com/photo-1596328330768-ae380299f187?q=80&w=600", price: "₹1,800" },
    { name: "Valley of Flowers", difficulty: "Hard", time: "3 Days", img: "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?q=80&w=600", price: "₹5,200" }
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-orange-600 font-sans relative overflow-x-hidden">
      
      {/* --- BACKGROUND AURA --- */}
      <div className="fixed top-0 left-1/4 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-orange-900/10 blur-[100px] md:blur-[150px] rounded-full pointer-events-none z-0" />
      <div className="fixed bottom-0 right-1/4 w-[200px] md:w-[400px] h-[200px] md:h-[400px] bg-yellow-700/10 blur-[80px] md:blur-[120px] rounded-full pointer-events-none z-0" />

      {/* 1. WEATHER TICKER */}
      <div className="fixed top-[60px] md:top-[72px] left-0 w-full z-[40] bg-[#050505]/60 backdrop-blur-xl border-y border-white/5 py-2 md:py-3 overflow-hidden">
        <motion.div 
          animate={{ x: [0, -1500] }} 
          transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
          className="flex gap-16 md:gap-24 whitespace-nowrap items-center"
        >
          {[...Array(10)].map((_, i) => (
            <div key={i} className="flex items-center gap-6 md:gap-8 text-[8px] md:text-[9px] font-black uppercase tracking-[0.4em]">
              <span className="flex items-center gap-2 text-orange-400"><Thermometer size={12}/> KEDARNATH: 4°C</span>
              <span className="flex items-center gap-2 text-yellow-500"><CloudRain size={12}/> RISHIKESH: CLEAR</span>
              <span className="text-green-500 flex items-center gap-2 italic">
                <Activity size={10} className="animate-pulse"/> SYSTEMS NOMINAL
              </span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* --- HERO SECTION --- */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-[100px] md:pt-[140px] z-10 px-4">
        <motion.div style={{ y: y1 }} className="absolute inset-0 z-0">
          <img src="https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=2070" className="w-full h-full object-cover opacity-25 scale-110" alt="Hero" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-transparent to-[#050505]" />
        </motion.div>

        <Container className="relative z-10">
          <div className="max-w-6xl">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="inline-flex items-center gap-2 md:gap-3 px-4 md:px-6 py-2 rounded-full border border-orange-500/30 bg-orange-950/20 backdrop-blur-xl mb-8 md:mb-12">
              <Sparkles className="text-yellow-400 animate-pulse" size={12} />
              <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] md:tracking-[0.5em] italic text-orange-400">Fleet Operations Active</span>
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} className="text-5xl md:text-8xl lg:text-[11rem] font-black italic uppercase tracking-tighter leading-[0.85] md:leading-[0.75] mb-8 md:mb-14">
              UNLEASH THE <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-yellow-500 to-white">MOUNTAIN.</span>
            </motion.h1>

            <div className="flex flex-col md:flex-row items-start gap-6 md:gap-10 mb-12 md:mb-20">
                <p className="text-base md:text-lg text-white/50 max-w-lg font-medium leading-relaxed italic border-l-2 border-orange-700/50 pl-6 md:pl-8">
                  Precisely mapped logistics for the sacred peaks. Whether it's a stay or a tactical ride, we are your co-pilot.
                </p>
                <div className="bg-white/[0.03] backdrop-blur-3xl p-4 md:p-6 rounded-[25px] md:rounded-[35px] border border-orange-900/20 flex gap-6 md:gap-8 shadow-xl shadow-orange-950/10 w-full md:w-auto justify-center">
                    <div className="text-center">
                        <p className="text-2xl md:text-3xl font-black italic text-orange-400">4.9</p>
                        <p className="text-[7px] md:text-[8px] text-white/20 font-black uppercase tracking-widest">Rating</p>
                    </div>
                    <div className="w-px h-8 md:h-10 bg-orange-900/30" />
                    <div className="text-center">
                        <p className="text-2xl md:text-3xl font-black italic text-yellow-600">2k+</p>
                        <p className="text-[7px] md:text-[8px] text-white/20 font-black uppercase tracking-widest">Fleets</p>
                    </div>
                </div>
            </div>

            {/* SEARCH BAR (RESPONSIVE) */}
            <div className="relative max-w-4xl group">
              <div className="absolute -inset-1 bg-gradient-to-r from-orange-600/60 to-yellow-600/30 blur-2xl opacity-40 group-hover:opacity-60 transition-all" />
              <div className="relative bg-white/5 backdrop-blur-3xl p-2 md:p-3 rounded-[30px] md:rounded-[45px] border border-orange-900/30 flex flex-col md:flex-row gap-3">
                <div className="flex-1 flex items-center px-6 md:px-10 py-4 md:py-5 gap-3 md:gap-5 bg-white/[0.03] rounded-[20px] md:rounded-[35px] border border-white/5">
                  <Navigation2 className="text-orange-500 rotate-45" size={18} />
                  <input placeholder="ENTER LOCATION..." className="bg-transparent w-full text-white font-black uppercase text-[10px] md:text-[12px] tracking-widest outline-none placeholder:text-white/20" />
                </div>
                <button onClick={() => navigate("/explore-stays")} className="bg-orange-600 hover:bg-white hover:text-black text-white px-8 md:px-14 py-4 md:py-6 rounded-[20px] md:rounded-[35px] font-black uppercase text-[10px] md:text-[12px] tracking-[0.2em] transition-all flex items-center justify-center gap-3">
                  START <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* --- RITUALS SECTION --- */}
      <section className="py-12 md:py-24 relative z-10 border-y border-orange-900/20 px-4">
          <Container>
              <div className="bg-orange-950/10 border border-orange-500/20 rounded-[30px] md:rounded-[50px] p-6 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-10 shadow-2xl">
                  <div className="flex items-center gap-4 md:gap-6 w-full md:w-auto">
                      <div className="w-14 h-14 md:w-20 md:h-20 rounded-2xl md:rounded-3xl bg-gradient-to-br from-orange-600 to-orange-800 flex items-center justify-center text-white shadow-xl">
                          <BellRing size={24} md:size={40} />
                      </div>
                      <div>
                          <h3 className="text-xl md:text-2xl font-black italic uppercase tracking-tighter text-white">Sacred Rituals</h3>
                          <p className="text-orange-300 text-[8px] md:text-[10px] font-black uppercase tracking-widest mt-1">Kedarnath Sector</p>
                      </div>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-12 text-center w-full md:w-auto">
                      <TimingBox icon={<Sunrise size={16}/>} time="04:00 AM" label="Abhishek" />
                      <TimingBox icon={<BellRing size={16}/>} time="06:30 PM" label="Aarti" />
                      <TimingBox icon={<Sunset size={16}/>} time="08:30 PM" label="Shayan" />
                      <div className="flex flex-col items-center justify-center bg-white/5 p-3 rounded-xl border border-orange-900/20">
                          <p className="text-green-400 font-black text-lg md:text-2xl italic animate-pulse tracking-tighter">OPEN</p>
                          <p className="text-[7px] text-white/30 font-black uppercase tracking-widest">STATUS</p>
                      </div>
                  </div>
              </div>
          </Container>
      </section>

      {/* --- THE EDGE (WHY CHOOSE US) --- */}
      <section className="py-20 md:py-40 relative z-10 px-4">
        <Container>
          <div className="text-center mb-12 md:mb-24">
            <p className="text-orange-500 font-black tracking-[0.4em] text-[8px] md:text-[10px] uppercase mb-4 italic">Expedition Protocol</p>
            <h2 className="text-4xl md:text-8xl font-black italic uppercase tracking-tighter">THE <span className="text-orange-600">EDGE.</span></h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <EdgeCard icon={<ShieldCheck size={28} />} title="Tactical Vetting" desc="Physical verification of every fleet and stay." />
            <EdgeCard icon={<HeartPulse size={28} />} title="Survivor Support" desc="24/7 high-altitude ground support." />
            <EdgeCard icon={<Eye size={28} />} title="Live Telemetry" desc="Real-time road and weather alerts." />
            <EdgeCard icon={<Compass size={28} />} title="Sacred Access" desc="Local-grade temple intelligence." />
          </div>
        </Container>
      </section>

      {/* PEAK LIST (Featured Cards) */}
      <section className="py-20 md:py-40 relative z-10 px-4">
        <Container>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 md:mb-24 gap-6">
            <div>
              <p className="text-orange-500 font-black tracking-[0.4em] text-[8px] md:text-[10px] uppercase mb-3 italic">Himalayan Manifest</p>
              <h2 className="text-4xl md:text-8xl lg:text-9xl font-black italic uppercase tracking-tighter leading-none text-white">THE <span className="text-white/20">ELITE</span> LIST.</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
            {featuredRoutes.map((route, i) => (
              <motion.div key={i} whileHover={{ y: -15 }} className="group relative h-[400px] md:h-[650px] rounded-[35px] md:rounded-[60px] overflow-hidden border border-orange-950/10 shadow-3xl">
                <img src={route.img} className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-110 transition-transform duration-1000" alt={route.name} />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                <div className="absolute top-6 right-6 md:top-10 md:right-10 bg-orange-600 px-4 py-1.5 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest">Starts {route.price}</div>
                <div className="absolute bottom-8 left-8 md:bottom-12 md:left-12 right-8">
                  <h3 className="text-2xl md:text-4xl font-black italic uppercase tracking-tighter text-white mb-4 leading-none">{route.name}</h3>
                  <div className="flex items-center justify-between border-t border-orange-900/30 pt-4 md:pt-6">
                    <span className="text-[8px] md:text-[10px] font-black text-white/30 uppercase flex items-center gap-2"><Clock size={12}/> {route.time}</span>
                    <button className="w-10 h-10 md:w-14 md:h-14 rounded-2xl bg-white text-black flex items-center justify-center"><ArrowRight size={20}/></button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* FINAL CTA */}
      <section className="py-32 md:py-60 relative overflow-hidden text-center z-10 px-4">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none text-orange-600"><Mountain size={500} md:size={900} /></div>
        <Container className="relative z-10">
          <h2 className="text-5xl md:text-9xl lg:text-[14rem] font-black italic uppercase tracking-tighter mb-10 md:mb-16 leading-[0.85] md:leading-[0.75]">ASCEND <br/><span className="text-transparent bg-clip-text bg-gradient-to-b from-yellow-400 to-orange-900">TOGETHER.</span></h2>
          <button onClick={() => navigate("/register")} className="bg-white text-black px-12 md:px-24 py-5 md:py-8 rounded-full font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-[10px] md:text-sm shadow-3xl hover:bg-orange-600 hover:text-white transition-all active:scale-95">JOIN THE FLEET</button>
        </Container>
      </section>

    </div>
  );
}

// --- SUB-COMPONENTS (RESPONSIVE FIXED) ---

const TimingBox = ({ icon, time, label }) => (
    <div className="flex flex-col items-center">
        <div className="text-orange-500 mb-1 md:mb-2">{icon}</div>
        <p className="text-yellow-500 font-black text-sm md:text-xl italic">{time}</p>
        <p className="text-[6px] md:text-[8px] text-white/30 font-black uppercase tracking-widest mt-1">{label}</p>
    </div>
);

const EdgeCard = ({ icon, title, desc }) => (
    <div className="p-8 md:p-12 rounded-[30px] md:rounded-[50px] bg-white/[0.02] border border-orange-950/20 hover:border-orange-600/30 transition-all group overflow-hidden relative">
        <div className="mb-6 md:mb-8 text-orange-500 group-hover:scale-110 transition-transform">{icon}</div>
        <h4 className="text-lg md:text-xl font-black italic uppercase mb-2 md:mb-4 tracking-tighter text-orange-400">{title}</h4>
        <p className="text-white/30 text-[11px] md:text-[13px] leading-relaxed italic font-medium">{desc}</p>
        <div className="absolute -bottom-10 -right-10 w-32 md:w-40 h-32 md:h-40 bg-orange-600/5 blur-[40px] md:blur-[50px] rounded-full group-hover:bg-orange-600/10 transition-colors" />
    </div>
);