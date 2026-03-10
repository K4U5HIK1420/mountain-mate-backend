import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Calendar, Search, Star, Car, Hotel, ChevronRight, ShieldCheck, Users, Loader2 } from 'lucide-react';
import axios from 'axios';

const Explore = () => {
  const [activeTab, setActiveTab] = useState('stays');
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [locationFilter, setLocationFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Current date for min-date attribute
  const today = new Date().toISOString().split("T")[0];

  const fetchListings = async () => {
    setLoading(true);
    try {
      // API endpoints based on active tab
      const endpoint = activeTab === 'stays' ? '/api/hotel' : '/api/transport';
      const response = await axios.get(`http://localhost:5000${endpoint}`, {
        params: { 
            location: locationFilter.toLowerCase(), 
            date: dateFilter 
        }
      });
      setListings(response.data);
    } catch (error) {
      console.error("Error fetching listings:", error);
      setListings([]);
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch when tab changes
  useEffect(() => {
    fetchListings();
  }, [activeTab]);

  return (
    <div className="relative min-h-screen">
      {/* --- HERO SECTION --- */}
      <section className="relative h-screen w-full flex items-center justify-center overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=2500" 
          className="absolute inset-0 w-full h-full object-cover"
          alt="Mountains"
        />
        <div className="absolute inset-0 bg-black/40"></div>

        <div className="relative z-10 text-center flex flex-col items-center w-full px-6">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.4em] text-white/90 mb-10">
            KEDARNATH ROUTE SPECIALIST
          </div>
          
          <h1 className="text-[12vw] md:text-[140px] font-black text-white leading-[0.85] tracking-tighter">
            TRAVEL<br/>
            <span className="text-orange-600 italic">SMARTER.</span>
          </h1>

          {/* MASTER SEARCH BAR */}
          <div className="mt-20 w-full max-w-5xl bg-white rounded-[40px] p-4 flex flex-col md:flex-row items-center shadow-2xl">
            {/* Location Search */}
            <div className="flex-1 px-10 py-4 flex items-center gap-5 border-r border-gray-100 w-full">
              <MapPin className="text-orange-500" size={24} />
              <div className="text-left w-full">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Pickup Location</p>
                <input 
                  type="text" 
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  placeholder="e.g. GUPTAKASHI" 
                  className="font-bold text-gray-900 outline-none bg-transparent w-full uppercase placeholder:text-gray-300" 
                />
              </div>
            </div>
            
            {/* Native Date Picker */}
            <div className="flex-1 px-10 py-4 flex items-center gap-5 w-full border-r border-gray-100 relative group">
              <Calendar className="text-orange-500" size={24} />
              <div className="text-left w-full">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Travel Date</p>
                <input 
                  type="date" 
                  min={today}
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="font-bold text-gray-900 outline-none bg-transparent w-full cursor-pointer uppercase 
                             appearance-none block
                             [&::-webkit-calendar-picker-indicator]:cursor-pointer
                             [&::-webkit-calendar-picker-indicator]:opacity-50" 
                />
              </div>
            </div>

            <button 
              onClick={fetchListings}
              className="bg-[#0D4D2E] hover:bg-black text-white px-12 py-6 rounded-[30px] font-black flex items-center gap-3 transition-all shrink-0 w-full md:w-auto uppercase text-xs tracking-widest"
            >
              <Search size={18}/> Find Services
            </button>
          </div>
        </div>
      </section>

      {/* --- BOOKING SECTION --- */}
      <section className="relative z-20 -mt-20 px-6 pb-20 max-w-7xl mx-auto">
        {/* Tab Switcher */}
        <div className="flex justify-center mb-12">
          <div className="bg-white/10 backdrop-blur-3xl p-2 rounded-[30px] border border-white/20 flex gap-2">
            <button 
              onClick={() => setActiveTab('stays')}
              className={`flex items-center gap-3 px-10 py-4 rounded-[25px] font-black text-[10px] tracking-widest transition-all ${activeTab === 'stays' ? 'bg-orange-600 text-white shadow-xl' : 'text-white/60 hover:text-white'}`}
            >
              <Hotel size={16}/> BOOK STAYS
            </button>
            <button 
              onClick={() => setActiveTab('rides')}
              className={`flex items-center gap-3 px-10 py-4 rounded-[25px] font-black text-[10px] tracking-widest transition-all ${activeTab === 'rides' ? 'bg-orange-600 text-white shadow-xl' : 'text-white/60 hover:text-white'}`}
            >
              <Car size={16}/> BOOK RIDES
            </button>
          </div>
        </div>

        {/* Listings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 min-h-[400px]">
          {loading ? (
            <div className="col-span-full flex flex-col items-center justify-center space-y-4">
              <Loader2 className="animate-spin text-orange-500" size={48} />
              <p className="text-white/40 font-black text-[10px] tracking-[0.3em] uppercase">Fetching Live Data...</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {listings.length > 0 ? (
                listings.map((item) => (
                  <ListingCard key={item._id} data={item} type={activeTab === 'stays' ? 'hotel' : 'ride'} />
                ))
              ) : (
                <div className="col-span-full text-center py-20 bg-white/5 rounded-[50px] border border-white/10">
                   <p className="text-white/40 font-black text-[12px] tracking-[0.2em] uppercase">No {activeTab} available for this search.</p>
                </div>
              )}
            </AnimatePresence>
          )}
        </div>
      </section>
    </div>
  );
};

// --- REUSABLE CARD COMPONENT ---
const ListingCard = ({ data, type }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.95 }}
    whileHover={{ y: -10 }}
    className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[50px] overflow-hidden group shadow-2xl flex flex-col justify-between"
  >
    <div>
        {type === 'hotel' ? (
        <div className="h-64 overflow-hidden relative">
            <img src={data.img || "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600"} alt={data.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
            <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 font-black text-[10px]">
            <Star size={14} className="fill-orange-500 text-orange-500"/> {data.rating || "4.5"}
            </div>
        </div>
        ) : (
        <div className="h-64 flex flex-col items-center justify-center bg-black/20 space-y-4 relative">
            <Car size={80} className="text-orange-500 opacity-50" />
            <span className="text-white/40 font-black text-[10px] tracking-widest bg-white/5 px-4 py-2 rounded-full border border-white/10 italic">
               {data.number || "UK 13 TA XXXX"}
            </span>
        </div>
        )}

        <div className="p-10 space-y-6">
          <div className="flex justify-between items-start">
              <div>
              <h3 className="text-2xl font-black text-white tracking-tighter uppercase leading-tight">
                  {type === 'hotel' ? data.name : data.model}
              </h3>
              <p className="flex items-center gap-1 text-white/40 text-[10px] font-black uppercase mt-2 tracking-widest">
                  <MapPin size={12}/> {data.location}
              </p>
              </div>
              <p className="text-2xl font-black text-orange-500 italic">₹{data.price}</p>
          </div>

          {type === 'ride' && (
              <div className="flex gap-4 border-y border-white/10 py-4">
                  <div className="flex items-center gap-2 text-white/60 text-[10px] font-black uppercase"><Users size={14}/> {data.capacity || 7} Seats</div>
                  <div className="flex items-center gap-2 text-white/60 text-[10px] font-black uppercase"><ShieldCheck size={14}/> Verified</div>
              </div>
          )}
        </div>
    </div>

    <div className="p-10 pt-0">
        <button className="w-full bg-white text-black p-6 rounded-[25px] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-orange-600 hover:text-white transition-all flex items-center justify-center gap-2 shadow-lg">
            BOOK NOW <ChevronRight size={16}/>
        </button>
    </div>
  </motion.div>
);

export default Explore;