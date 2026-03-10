import React from 'react';
import { Users, TrendingUp, Hotel, Car } from 'lucide-react';

const Dashboard = () => (
  <div className="space-y-10">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
      <StatCard icon={<Users className="text-blue-500"/>} label="Total Users" val="1,284" />
      <StatCard icon={<TrendingUp className="text-green-500"/>} label="Revenue" val="₹84,000" />
      <StatCard icon={<Hotel className="text-orange-500"/>} label="Hotels" val="45" />
      <StatCard icon={<Car className="text-purple-500"/>} label="Vehicles" val="12" />
    </div>
    
    {/* Placeholder for Graph */}
    <div className="h-96 bg-white rounded-[50px] border border-dashed border-gray-200 flex items-center justify-center text-gray-300 font-black text-2xl uppercase tracking-widest">
      Booking Analytics Graph
    </div>
  </div>
);

const StatCard = ({ icon, label, val }) => (
  <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-50 flex items-center gap-6">
    <div className="p-4 bg-gray-50 rounded-2xl">{icon}</div>
    <div>
      <p className="text-3xl font-black">{val}</p>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
    </div>
  </div>
);

export default Dashboard;