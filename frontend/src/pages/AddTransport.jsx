import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Car, MapPin, IndianRupee, Users, ShieldCheck, Navigation, Loader2 } from 'lucide-react';
import axios from 'axios';

const AddTransport = () => {
  // 1. State Management for form fields
  const [formData, setFormData] = useState({
    model: '',
    number: '', // Plate Number
    capacity: '7',
    price: '',
    location: 'Guptakashi'
  });

  const [loading, setLoading] = useState(false);

  // 2. Handle Input Change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 3. Form Submission Logic
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Backend Route: http://localhost:5000/api/transport
      const response = await axios.post('http://localhost:5000/api/transport', formData);
      
      if (response.data) {
        alert("Vehicle Registered Successfully! 🚗");
        // Clear form after success
        setFormData({
          model: '',
          number: '',
          capacity: '7',
          price: '',
          location: 'Guptakashi'
        });
      }
    } catch (error) {
      console.error("Submission Error:", error);
      alert(error.response?.data?.message || "Failed to register vehicle. Make sure server is live.");
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
      <div className="fixed inset-0 bg-black/50 backdrop-blur-[3px] z-[-1]"></div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto bg-white/10 backdrop-blur-3xl border border-white/20 rounded-[60px] p-16 shadow-2xl"
      >
        <div className="mb-12">
          <h2 className="text-5xl font-black text-white tracking-tighter uppercase leading-none">
            List Your <span className="text-orange-500 italic">Ride.</span>
          </h2>
          <p className="text-white/50 font-bold text-[10px] tracking-[0.3em] uppercase mt-4">Add your taxi or traveler to the M-Mate network</p>
        </div>

        {/* Form with onSubmit */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-10">
          
          {/* Vehicle Model */}
          <div className="space-y-4">
            <label className="flex items-center gap-3 text-[9px] font-black text-white/40 uppercase tracking-widest ml-2">
              <Car size={14}/> Vehicle Model
            </label>
            <input 
              required
              name="model"
              value={formData.model}
              onChange={handleChange}
              type="text" 
              placeholder="e.g. Bolero, Innova, Force Traveler"
              className="w-full bg-white/5 border border-white/10 p-6 rounded-[30px] font-bold text-white outline-none focus:bg-white/10 focus:border-orange-500 transition-all placeholder:text-white/20"
            />
          </div>

          {/* Plate Number */}
          <div className="space-y-4">
            <label className="flex items-center gap-3 text-[9px] font-black text-white/40 uppercase tracking-widest ml-2">
              <Navigation size={14}/> Plate Number (UK-XX-XXXX)
            </label>
            <input 
              required
              name="number"
              value={formData.number}
              onChange={handleChange}
              type="text" 
              placeholder="UK 13 TA 1234"
              className="w-full bg-white/5 border border-white/10 p-6 rounded-[30px] font-bold text-white outline-none focus:bg-white/10 focus:border-orange-500 transition-all placeholder:text-white/20"
            />
          </div>

          {/* Seating Capacity */}
          <div className="space-y-4">
            <label className="flex items-center gap-3 text-[9px] font-black text-white/40 uppercase tracking-widest ml-2">
              <Users size={14}/> Seating Capacity
            </label>
            <select 
              name="capacity"
              value={formData.capacity}
              onChange={handleChange}
              className="w-full bg-white/5 border border-white/10 p-6 rounded-[30px] font-bold text-white outline-none appearance-none cursor-pointer"
            >
              <option className="bg-gray-900" value="4">4 Seater (Small)</option>
              <option className="bg-gray-900" value="7">7 Seater (SUV)</option>
              <option className="bg-gray-900" value="12">12 Seater (Traveler)</option>
              <option className="bg-gray-900" value="25">25+ Seater (Bus)</option>
            </select>
          </div>

          {/* Rate per Day */}
          <div className="space-y-4">
            <label className="flex items-center gap-3 text-[9px] font-black text-white/40 uppercase tracking-widest ml-2">
              <IndianRupee size={14}/> Daily Rate (Estimate ₹)
            </label>
            <input 
              required
              name="price"
              value={formData.price}
              onChange={handleChange}
              type="number" 
              placeholder="3500"
              className="w-full bg-white/5 border border-white/10 p-6 rounded-[30px] font-bold text-white outline-none focus:bg-white/10 focus:border-orange-500 transition-all placeholder:text-white/20"
            />
          </div>

          {/* Base Hub */}
          <div className="md:col-span-2 space-y-4">
            <label className="flex items-center gap-3 text-[9px] font-black text-white/40 uppercase tracking-widest ml-2">
              <MapPin size={14}/> Base Operation Hub
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
              <option className="bg-gray-900" value="Rudraprayag">Rudraprayag</option>
              <option className="bg-gray-900" value="Dehradun">Dehradun</option>
            </select>
          </div>

          {/* Submit Action */}
          <div className="md:col-span-2 pt-6">
            <button 
              disabled={loading}
              type="submit"
              className="w-full bg-orange-600 hover:bg-white hover:text-black text-white p-8 rounded-[35px] font-black text-[11px] uppercase tracking-[0.4em] shadow-2xl transition-all flex items-center justify-center gap-4 group disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <ShieldCheck size={20} className="group-hover:text-green-600 transition-colors"/> 
              )}
              {loading ? "REGISTERING..." : "REGISTER VEHICLE"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default AddTransport;