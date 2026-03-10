import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Hotel, MapPin, IndianRupee, Star, ShieldCheck, Loader2 } from 'lucide-react';
import axios from 'axios'; // Direct use or use your API helper

const AddHotel = () => {
  // 1. State for Form Data
  const [formData, setFormData] = useState({
    name: '',
    location: 'Guptakashi',
    price: '',
    roomType: 'Standard',
    distance: ''
  });

  const [loading, setLoading] = useState(false);

  // 2. Handle Input Changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 3. Handle Submit to Backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Apne server.js ke route se match kar raha hai: /api/hotel
      const response = await axios.post('http://localhost:5000/api/hotel', formData);
      
      if (response.data) {
        alert("Property Listed Successfully! 🏔️");
        // Form clear karne ke liye
        setFormData({ name: '', location: 'Guptakashi', price: '', roomType: 'Standard', distance: '' });
      }
    } catch (error) {
      console.error("Backend Error:", error);
      alert(error.response?.data?.message || "Failed to list property. Check if Server is running.");
    } finally {
      setLoading(false);
    }
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
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto bg-white/10 backdrop-blur-3xl border border-white/20 rounded-[60px] p-16 shadow-2xl"
      >
        <div className="mb-12">
          <h2 className="text-5xl font-black text-white tracking-tighter uppercase leading-none">
            LIST YOUR <span className="text-orange-500 italic">PROPERTY.</span>
          </h2>
          <p className="text-white/50 font-bold text-[10px] tracking-[0.3em] uppercase mt-4">Partner with M-Mate for Kedarnath Yatra 2026</p>
        </div>

        {/* 4. Added onSubmit handler */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-10">
          
          <div className="space-y-4">
            <label className="flex items-center gap-3 text-[9px] font-black text-white/40 uppercase tracking-widest ml-2">
              <Hotel size={14}/> Property Name
            </label>
            <input 
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              type="text" 
              placeholder="e.g. Kedar Valley Resort" 
              className="w-full bg-white/5 border border-white/10 p-6 rounded-[30px] font-bold text-white outline-none focus:bg-white/10 focus:border-orange-500 transition-all placeholder:text-white/20" 
            />
          </div>

          <div className="space-y-4">
            <label className="flex items-center gap-3 text-[9px] font-black text-white/40 uppercase tracking-widest ml-2">
              <MapPin size={14}/> Area / Location
            </label>
            <select 
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full bg-white/5 border border-white/10 p-6 rounded-[30px] font-bold text-white outline-none appearance-none cursor-pointer"
            >
              <option className="bg-gray-900" value="Guptakashi">Guptakashi</option>
              <option className="bg-gray-900" value="Sonprayag">Sonprayag</option>
              <option className="bg-gray-900" value="Phata">Phata</option>
            </select>
          </div>

          <div className="space-y-4">
            <label className="flex items-center gap-3 text-[9px] font-black text-white/40 uppercase tracking-widest ml-2">
              <IndianRupee size={14}/> Starting Price (₹)
            </label>
            <input 
              name="price"
              value={formData.price}
              onChange={handleChange}
              required
              type="number" 
              placeholder="3500" 
              className="w-full bg-white/5 border border-white/10 p-6 rounded-[30px] font-bold text-white outline-none focus:border-orange-500 transition-all placeholder:text-white/20" 
            />
          </div>

          <div className="space-y-4">
            <label className="flex items-center gap-3 text-[9px] font-black text-white/40 uppercase tracking-widest ml-2">
              <Star size={14}/> Room Type
            </label>
            <select 
              name="roomType"
              value={formData.roomType}
              onChange={handleChange}
              className="w-full bg-white/5 border border-white/10 p-6 rounded-[30px] font-bold text-white outline-none appearance-none cursor-pointer"
            >
              <option className="bg-gray-900" value="Standard">Standard Room</option>
              <option className="bg-gray-900" value="Deluxe">Deluxe Suite</option>
            </select>
          </div>

          <div className="md:col-span-2 space-y-4">
            <label className="text-[9px] font-black text-white/40 uppercase tracking-widest ml-2">Distance from Sonprayag (km)</label>
            <input 
              name="distance"
              value={formData.distance}
              onChange={handleChange}
              type="text" 
              placeholder="e.g. 2 km" 
              className="w-full bg-white/5 border border-white/10 p-6 rounded-[30px] font-bold text-white outline-none focus:border-orange-500 transition-all placeholder:text-white/20" 
            />
          </div>

          <div className="md:col-span-2 pt-6">
            <button 
              disabled={loading}
              type="submit"
              className="w-full bg-orange-600 hover:bg-white hover:text-black text-white p-8 rounded-[35px] font-black text-[11px] uppercase tracking-[0.4em] shadow-2xl transition-all flex items-center justify-center gap-4 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" /> : <ShieldCheck size={20}/>}
              {loading ? "PROCESSING..." : "SUBMIT PROPERTY"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default AddHotel;