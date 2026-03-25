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
        
        {/* Header Section */}
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
              className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[#090909] p-6 shadow-lg"
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

        {/* Graph Section */}
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