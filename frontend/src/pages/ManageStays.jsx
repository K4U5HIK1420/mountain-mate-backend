import React, { useEffect, useState } from 'react';
import API from '../utils/api'; // Tera axios instance
import { motion } from 'framer-motion';
import { Hotel, Bed, IndianRupee, Power, Plus, Minus, Loader2 } from 'lucide-react';
import { useNotify } from "../context/NotificationContext";

const ManageStays = () => {
  const { notify } = useNotify();
  const [myHotels, setMyHotels] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch only MY properties from Backend
  useEffect(() => {
    const fetchMyStays = async () => {
      try {
        // Backend endpoint: router.get("/my-properties", authMiddleware, getOwnerHotels)
        const res = await API.get("/hotel/my-properties"); 
        setMyHotels(res.data.data || res.data);
      } catch (err) {
        console.error("Fetch error", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMyStays();
  }, []);

  // 2. Update Availability or Rooms
  const handleUpdate = async (id, updatedFields) => {
    try {
      await API.patch(`/hotel/update/${id}`, updatedFields);
      notify("Inventory Updated! 🏔️", "success");
      // Local state update karo taaki UI turant badle
      setMyHotels(myHotels.map(h => h._id === id ? { ...h, ...updatedFields } : h));
    } catch (err) {
      notify("Update failed!", "error");
      
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <Loader2 className="text-orange-600 animate-spin" size={40} />
    </div>
  );

  return (
    <div className="relative min-h-screen pt-40 pb-20 px-8">
      <img src="https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=2500" className="fixed inset-0 w-full h-full object-cover z-[-1]" alt="Background" />
      <div className="fixed inset-0 bg-black/75 backdrop-blur-[6px] z-[-1]"></div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-6xl mx-auto">
        <div className="mb-12">
          <h1 className="text-6xl font-black text-white uppercase italic tracking-tighter">Manage <span className="text-orange-500">Your Stays.</span></h1>
          <p className="text-white/30 text-[10px] font-black tracking-[0.4em] uppercase mt-4 italic">Exclusive access: Owner Dashboard</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {myHotels.length > 0 ? myHotels.map((hotel) => (
            <div key={hotel._id} className="bg-white/[0.03] border border-white/10 p-10 rounded-[60px] backdrop-blur-3xl shadow-2xl">
              <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-5">
                  <div className="bg-orange-600/20 p-5 rounded-[25px]"><Hotel className="text-orange-600" size={28}/></div>
                  <h3 className="text-3xl font-black text-white uppercase italic">{hotel.hotelName}</h3>
                </div>
                <button 
                  onClick={() => handleUpdate(hotel._id, { isVerified: !hotel.isVerified })}
                  className={`px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${hotel.isVerified ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}
                >
                  <Power size={12} className="inline mr-2"/> {hotel.isVerified ? 'Live' : 'Hidden'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-10">
                <div className="bg-white/5 p-8 rounded-[40px] text-center border border-white/5">
                  <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-4">Available Rooms</p>
                  <div className="flex items-center justify-between text-white">
                    <button onClick={() => handleUpdate(hotel._id, { roomsAvailable: hotel.roomsAvailable - 1 })} className="hover:text-orange-500"><Minus/></button>
                    <span className="text-5xl font-black">{hotel.roomsAvailable}</span>
                    <button onClick={() => handleUpdate(hotel._id, { roomsAvailable: hotel.roomsAvailable + 1 })} className="hover:text-orange-500"><Plus/></button>
                  </div>
                </div>
                <div className="bg-white/5 p-8 rounded-[40px] border border-white/5">
                  <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-4">Tonight's Rate</p>
                  <div className="flex items-center gap-2">
                    <IndianRupee size={20} className="text-orange-600"/>
                    <span className="text-4xl font-black text-white">{hotel.pricePerNight}</span>
                  </div>
                </div>
              </div>

              <button className="w-full bg-white/5 hover:bg-white hover:text-black border border-white/10 py-6 rounded-[30px] font-black text-[11px] uppercase tracking-[0.5em] transition-all">
                Update Cloud Database
              </button>
            </div>
          )) : (
            <div className="col-span-2 py-32 text-center border-4 border-dashed border-white/5 rounded-[60px]">
               <p className="text-white/10 text-3xl font-black uppercase tracking-[1em]">No Properties Found</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ManageStays;