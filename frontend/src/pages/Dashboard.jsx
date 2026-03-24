import React from "react";
import { motion } from "framer-motion";
import { Car, Hotel, TrendingUp, Users } from "lucide-react";
import { Container } from "../components/ui/Container";

const stats = [
  { icon: <Users className="text-sky-300" />, label: "Total Users", value: "1,284", tone: "from-sky-400/30 to-sky-500/5" },
  { icon: <TrendingUp className="text-emerald-300" />, label: "Revenue", value: "Rs 84,000", tone: "from-emerald-400/30 to-emerald-500/5" },
  { icon: <Hotel className="text-orange-300" />, label: "Hotels", value: "45", tone: "from-orange-400/30 to-orange-500/5" },
  { icon: <Car className="text-amber-200" />, label: "Vehicles", value: "12", tone: "from-amber-300/30 to-amber-500/5" },
];

const Dashboard = () => (
  <div className="min-h-screen bg-[#040404] text-white">
    <Container className="relative z-10 space-y-10 px-6 pb-20 pt-32 sm:px-8 lg:px-12">
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-[40px] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.09),rgba(255,255,255,0.02)),radial-gradient(circle_at_top,rgba(249,115,22,0.16),transparent_36%),rgba(8,8,8,0.94)] p-8 shadow-[0_38px_100px_rgba(0,0,0,0.45)] md:p-10"
      >
        <p className="text-[10px] font-black uppercase tracking-[0.42em] text-orange-300">Command Overview</p>
        <h1 className="mt-4 text-4xl font-black uppercase italic tracking-[-0.05em] text-white md:text-6xl">
          Dashboard,
          <span className="ml-3 bg-gradient-to-b from-white via-amber-100 to-orange-500 bg-clip-text text-transparent">
            upgraded.
          </span>
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-8 text-white/62">
          The analytics layer now matches the rest of the product with better depth, hierarchy, and surfaces that feel designed instead of placeholder.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[#090909] p-6 shadow-[0_28px_80px_rgba(0,0,0,0.32)]"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.tone} opacity-70`} />
            <div className="relative flex items-center gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/6 p-4 backdrop-blur-xl">
                {stat.icon}
              </div>
              <div>
                <p className="text-3xl font-black italic tracking-tight text-white">{stat.value}</p>
                <p className="mt-2 text-[10px] font-black uppercase tracking-[0.28em] text-white/36">{stat.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
        className="cinematic-surface spotlight-border rounded-[34px] p-8 md:p-10"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.42em] text-orange-300">Analytics</p>
            <h2 className="mt-4 text-3xl font-black uppercase italic tracking-[-0.04em] text-white md:text-5xl">
              Booking intelligence panel
            </h2>
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-4 py-3 text-[10px] font-black uppercase tracking-[0.28em] text-white/42">
            Live graph slot
          </div>
        </div>

        <div className="mt-8 flex h-[24rem] items-center justify-center rounded-[28px] border border-dashed border-white/12 bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.12),transparent_30%),rgba(255,255,255,0.02)] text-center">
          <div>
            <p className="text-2xl font-black uppercase italic tracking-tight text-white/88">Booking analytics graph</p>
            <p className="mt-4 text-sm uppercase tracking-[0.28em] text-white/34">
              Ready for charts, filters, and trend overlays
            </p>
          </div>
        </div>
      </motion.div>
    </Container>
  </div>
);

export default Dashboard;
