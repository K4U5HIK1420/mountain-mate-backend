import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Hotel, Bed, IndianRupee, Power, CheckCircle2, AlertCircle } from 'lucide-react';

const ManageStays = () => {
  // Mock data for the owner's hotels
  const [myHotels, setMyHotels] = useState([
    { id: 1, name: "Kedar Valley Resort", rooms: 12, price: 4500, isAvailable: true },
    { id: 2, name: "Mountain Bliss Homestay", rooms: 4, price: 2800, isAvailable: false }
  ]);

  const toggleAvailability = (id) => {
    setMyHotels(myHotels.map(h => h.id === id ? { ...h, isAvailable: !h.isAvailable } : h));
  };

  return (
    <div className="relative min-h-screen pt-32 pb-20 px-6">
      <img 
        src="https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=2500" 
        className="fixed inset-0 w-full h-full object-cover z-[-1]"
        alt="Mountains"
      />
      <div className="fixed inset-0 bg-black/60 backdrop-blur-[3px] z-[-1]"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto space-y-10"
      >
        <div>
          <h1 className="text-5xl font-black text-white tracking-tighter uppercase leading-none">
            MANAGE <span className="text-orange-500 italic">YOUR STAYS.</span>
          </h1>
          <p className="text-white/40 font-black text-[10px] tracking-[0.3em] uppercase mt-4">Control your room inventory and live pricing</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {myHotels.map((hotel) => (
            <div key={hotel.id} className="bg-white/10 backdrop-blur-3xl border border-white/20 rounded-[50px] p-10 flex flex-col gap-8 shadow-2xl group transition-all">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-5">
                  <div className="p-5 bg-white/5 rounded-[25px] text-orange-500">
                    <Hotel size={32} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white tracking-tight">{hotel.name}</h3>
                    <p className="text-white/30 text-[10px] font-black tracking-widest uppercase">Verified Property</p>
                  </div>
                </div>
                
                {/* Status Toggle Switch */}
                <button 
                  onClick={() => toggleAvailability(hotel.id)}
                  className={`flex items-center gap-2 px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${hotel.isAvailable ? 'bg-green-500/20 text-green-500 border-green-500/40' : 'bg-red-500/20 text-red-500 border-red-500/40'}`}
                >
                  <Power size={12} /> {hotel.isAvailable ? 'Live' : 'Sold Out'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* Rooms Count */}
                <div className="bg-white/5 p-6 rounded-[30px] border border-white/5">
                  <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-2 flex items-center gap-2"><Bed size={12}/> Empty Rooms</p>
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-black text-white">{hotel.rooms}</span>
                    <div className="flex flex-col gap-1">
                      <button className="p-1 hover:text-orange-500 text-white/40">+</button>
                      <button className="p-1 hover:text-orange-500 text-white/40">-</button>
                    </div>
                  </div>
                </div>

                {/* Live Pricing */}
                <div className="bg-white/5 p-6 rounded-[30px] border border-white/5">
                  <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-2 flex items-center gap-2"><IndianRupee size={12}/> Tonight's Rate</p>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-black text-white">₹{hotel.price}</span>
                  </div>
                </div>
              </div>

              <button className="w-full bg-white/5 hover:bg-orange-600 hover:text-white text-white py-5 rounded-[25px] font-black text-[10px] uppercase tracking-[0.2em] transition-all border border-white/10">
                SAVE UPDATES
              </button>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default ManageStays;