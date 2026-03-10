import React from 'react';
import { motion } from 'framer-motion';
import { MoreVertical, CheckCircle2, Clock, XCircle, MapPin } from 'lucide-react';

const Bookings = () => {
  // Mock Data: Baad mein API se replace karenge
  const bookingData = [
    { id: "BK-9021", user: "Rahul Sharma", service: "Hotel Kedarnath", date: "12 March 2026", status: "Confirmed", amount: "₹4,500" },
    { id: "BK-9022", user: "Amit Negi", service: "Bolero (Fleet)", date: "13 March 2026", status: "Pending", amount: "₹3,200" },
    { id: "BK-9023", user: "Sanjay Bisht", service: "Pauri Homestay", date: "15 March 2026", status: "Cancelled", amount: "₹1,800" },
  ];

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Confirmed': return 'bg-green-100 text-green-700 border-green-200';
      case 'Pending': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Cancelled': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Live <span className="text-gray-400 italic font-light">Bookings</span></h1>
        <div className="flex gap-2">
           <span className="px-4 py-2 bg-white border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm">Today: 12 New</span>
        </div>
      </div>

      {/* Modern Table Container */}
      <div className="bg-white/70 backdrop-blur-xl border border-white rounded-[40px] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-50">
              <th className="p-8 text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">User Details</th>
              <th className="p-8 text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">Service Type</th>
              <th className="p-8 text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">Scheduled Date</th>
              <th className="p-8 text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">Status</th>
              <th className="p-8 text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">Amount</th>
              <th className="p-8"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {bookingData.map((item, index) => (
              <tr key={index} className="group hover:bg-gray-50/50 transition-colors">
                <td className="p-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center text-white font-bold text-xs">
                      {item.user.charAt(0)}
                    </div>
                    <div>
                      <p className="font-black text-gray-900 text-sm tracking-tight">{item.user}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">{item.id}</p>
                    </div>
                  </div>
                </td>
                <td className="p-8">
                  <p className="font-bold text-gray-700 text-sm">{item.service}</p>
                </td>
                <td className="p-8">
                  <p className="font-bold text-gray-500 text-sm">{item.date}</p>
                </td>
                <td className="p-8">
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black border ${getStatusStyle(item.status)}`}>
                    {item.status.toUpperCase()}
                  </span>
                </td>
                <td className="p-8">
                  <p className="font-black text-gray-900">{item.amount}</p>
                </td>
                <td className="p-8 text-right">
                  <button className="p-2 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-gray-100 transition-all">
                    <MoreVertical size={18} className="text-gray-400" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default Bookings;