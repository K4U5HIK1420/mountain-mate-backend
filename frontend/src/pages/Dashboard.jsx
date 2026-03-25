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