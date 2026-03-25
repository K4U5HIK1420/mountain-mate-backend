<<<<<<< HEAD
import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, Hotel, Car, Activity, Loader2 } from 'lucide-react';
import { XAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { motion } from 'framer-motion';
// ✅ Named import use kar rahe hain jo humne api.js mein banaya
import { getDashboardStats } from '../utils/api'; 

const Dashboard = () => {
  const [stats, setStats] = useState({
    users: null,
    revenue: null,
    hotels: null,
    rides: null,
    chartData: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        console.log("📡 Establishing Secure Uplink via Interceptor...");
        
        // ✅ Headers ab Interceptor (api.js) khud handle kar lega
        const res = await getDashboardStats(); 
        
        if (res.data) {
          console.log("✅ Live Intelligence Received:", res.data);
          setStats(res.data);
        }
      } catch (err) {
        console.error("🚨 Uplink Failed. Status:", err.response?.status);
        
        // Fallback data agar backend se contact na ho paye
        setStats({
          users: 1420,
          revenue: 84000,
          hotels: 45,
          rides: 18,
          chartData: [
            { name: 'Mon', bookings: 400 },
            { name: 'Tue', bookings: 300 },
            { name: 'Wed', bookings: 600 },
            { name: 'Thu', bookings: 800 },
            { name: 'Fri', bookings: 500 },
            { name: 'Sat', bookings: 900 },
            { name: 'Sun', bookings: 1100 },
          ]
        });
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return (
    <div className="h-96 flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-orange-500" size={40} />
      <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20 italic animate-pulse">Establishing Central Link...</p>
    </div>
  );

  return (
    <div className="space-y-10">
      {/* STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={<Users size={20}/>} label="Total Explorers" val={stats.users} color="blue" />
        <StatCard icon={<TrendingUp size={20}/>} label="Total Revenue" val={stats.revenue !== null ? `₹${stats.revenue.toLocaleString()}` : null} color="green" />
        <StatCard icon={<Hotel size={20}/>} label="Active Stays" val={stats.hotels} color="orange" />
        <StatCard icon={<Car size={20}/>} label="Fleet Deployments" val={stats.rides} color="purple" />
      </div>
      
      {/* ANALYTICS GRAPH */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/[0.03] border border-white/5 p-6 md:p-12 rounded-[40px] md:rounded-[60px] backdrop-blur-3xl shadow-3xl relative overflow-hidden"
      >
        <div className="flex justify-between items-center mb-10 relative z-10">
          <div>
            <h3 className="text-xl md:text-2xl font-black italic uppercase tracking-tighter text-white flex items-center gap-3">
              <Activity className="text-orange-500" size={20}/> Booking Pulse
            </h3>
            <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mt-1 italic">Real-time engagement analysis</p>
          </div>
          <div className="bg-orange-600/10 border border-orange-600/20 px-4 py-2 rounded-full hidden sm:block">
             <span className="text-orange-500 text-[8px] font-black uppercase tracking-widest animate-pulse">Live Tracking Active</span>
          </div>
        </div>

        <div className="h-[300px] w-full relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.chartData}>
              <defs>
                <linearGradient id="colorPulse" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F97316" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#F97316" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: 'rgba(255,255,255,0.2)', fontSize: 10, fontWeight: 900}} 
                dy={10} 
              />
              <Tooltip 
                contentStyle={{backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '15px', color: '#fff'}}
                itemStyle={{color: '#F97316', fontWeight: '900', textTransform: 'uppercase', fontSize: '10px'}}
                cursor={{ stroke: 'rgba(249, 115, 22, 0.2)', strokeWidth: 2 }}
              />
              <Area 
                type="monotone" 
                dataKey="bookings" 
                stroke="#F97316" 
                strokeWidth={4} 
                fillOpacity={1} 
                fill="url(#colorPulse)" 
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        {/* Subtle Background Glow for Graph */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-orange-600/5 blur-[120px] rounded-full pointer-events-none" />
      </motion.div>
    </div>
  );
};

const StatCard = ({ icon, label, val, color }) => {
  const colors = {
    blue: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    green: "text-green-500 bg-green-500/10 border-green-500/20",
    orange: "text-orange-500 bg-orange-500/10 border-orange-500/20",
    purple: "text-purple-500 bg-purple-500/10 border-purple-500/20"
  };

  return (
    <motion.div 
      whileHover={{ y: -5, scale: 1.02 }} 
      className="bg-white/[0.02] p-8 rounded-[40px] border border-white/5 flex flex-col gap-6 relative group overflow-hidden transition-all duration-300"
    >
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-lg ${colors[color]}`}>
        {icon}
      </div>
      <div className="relative z-10">
        <p className="text-4xl font-black italic tracking-tighter text-white mb-1 leading-none">
          {val !== null ? val : "---"}
        </p>
        <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] italic">{label}</p>
      </div>
      
      {/* Decorative Glow */}
      <div className={`absolute -bottom-10 -right-10 w-24 h-24 blur-[60px] opacity-10 bg-orange-600 transition-opacity group-hover:opacity-30`} />
    </motion.div>
  );
};

export default Dashboard;
=======
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
>>>>>>> ecba56dc3f1fbc82455d9d3df5bbaf61fbd37fe4
import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, Hotel, Car, Activity, Loader2 } from 'lucide-react';
import { XAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { motion } from 'framer-motion';
import { Container } from "../components/ui/Container";
import { getDashboardStats } from '../utils/api'; 

const Dashboard = () => {
  const [stats, setStats] = useState({
    users: null,
    revenue: null,
    hotels: null,
    rides: null,
    chartData: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await getDashboardStats(); 
        if (res.data) {
          setStats(res.data);
        }
      } catch (err) {
        console.error("🚨 API Error:", err);
        // Fallback data
        setStats({
          users: 1420,
          revenue: 84000,
          hotels: 45,
          rides: 18,
          chartData: [
            { name: 'Mon', bookings: 400 }, { name: 'Tue', bookings: 300 },
            { name: 'Wed', bookings: 600 }, { name: 'Thu', bookings: 800 },
            { name: 'Fri', bookings: 500 }, { name: 'Sat', bookings: 900 },
            { name: 'Sun', bookings: 1100 },
          ]
        });
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return (
    <div className="h-screen bg-[#040404] flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-orange-500" size={40} />
      <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20 italic animate-pulse">Establishing Link...</p>
    </div>
  );

  const statConfig = [
    { icon: <Users size={20}/>, label: "Total Explorers", val: stats.users, tone: "from-sky-400/30 to-sky-500/5", color: "text-sky-300" },
    { icon: <TrendingUp size={20}/>, label: "Total Revenue", val: stats.revenue ? `₹${stats.revenue.toLocaleString()}` : "0", tone: "from-emerald-400/30 to-emerald-500/5", color: "text-emerald-300" },
    { icon: <Hotel size={20}/>, label: "Active Stays", val: stats.hotels, tone: "from-orange-400/30 to-orange-500/5", color: "text-orange-300" },
    { icon: <Car size={20}/>, label: "Fleet Deployments", val: stats.rides, tone: "from-amber-300/30 to-amber-500/5", color: "text-amber-200" },
  ];

  return (
    <div className="min-h-screen bg-[#040404] text-white">
      <Container className="relative z-10 space-y-10 px-6 pb-20 pt-32 sm:px-8 lg:px-12">
        
        {/* Header Section (Dost ka naya design) */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-[40px] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.09),rgba(255,255,255,0.02)),radial-gradient(circle_at_top,rgba(249,115,22,0.16),transparent_36%),rgba(8,8,8,0.94)] p-8 shadow-[0_38px_100px_rgba(0,0,0,0.45)] md:p-10"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.42em] text-orange-300">Command Overview</p>
          <h1 className="mt-4 text-4xl font-black uppercase italic tracking-[-0.05em] text-white md:text-6xl">
            Dashboard, <span className="bg-gradient-to-b from-white via-amber-100 to-orange-500 bg-clip-text text-transparent">upgraded.</span>
          </h1>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {statConfig.map((stat, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -5 }}
              className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[#090909] p-6"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.tone} opacity-70`} />
              <div className="relative flex items-center gap-4">
                <div className="rounded-2xl border border-white/10 bg-white/6 p-4 backdrop-blur-xl">
                  {React.cloneElement(stat.icon, { className: stat.color })}
                </div>
                <div>
                  <p className="text-3xl font-black italic tracking-tight text-white">{stat.val ?? "---"}</p>
                  <p className="mt-2 text-[10px] font-black uppercase tracking-[0.28em] text-white/36">{stat.label}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Graph Section (Tera functionality + Dost ka Container) */}
        <motion.div className="bg-white/[0.03] border border-white/10 p-8 rounded-[40px] backdrop-blur-3xl relative overflow-hidden">
            <div className="flex justify-between items-center mb-10">
                <h3 className="text-2xl font-black italic uppercase text-white flex items-center gap-3">
                    <Activity className="text-orange-500" /> Booking Pulse
                </h3>
            </div>
            <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.chartData}>
                        <defs>
                            <linearGradient id="colorPulse" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#F97316" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#F97316" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'rgba(255,255,255,0.2)', fontSize: 10}} />
                        <Tooltip contentStyle={{backgroundColor: '#0a0a0a', border: 'none', borderRadius: '15px'}} />
                        <Area type="monotone" dataKey="bookings" stroke="#F97316" strokeWidth={4} fill="url(#colorPulse)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
      </Container>
    </div>
  );
};

export default Dashboard;