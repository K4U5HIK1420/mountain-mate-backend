import API from "../utils/api";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hotel, MapPin, IndianRupee, Star, ShieldCheck, Loader2, ImagePlus, X } from 'lucide-react';

const AddHotel = () => {
  const [formData, setFormData] = useState({
    name: '',
    location: 'Guptakashi',
    price: '',
    roomType: 'Standard',
    distance: ''
  });

  const [images, setImages] = useState([]); // Files store karne ke liye
  const [previews, setPreviews] = useState([]); // UI mein dikhane ke liye
  const [loading, setLoading] = useState(false);

  // 1. Handle Text Inputs
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 2. Handle Image Selection
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Nayi files ko purani state mein add karein
    setImages((prev) => [...prev, ...files]);

    // Previews generate karein
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  // 3. Remove Image before upload
  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
    setPreviews(previews.filter((_, i) => i !== index));
  };

  // 4. Handle Submit (Using FormData for Files)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const data = new FormData();
    // Text fields append karein
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    
    // Images append karein
    images.forEach((file) => {
      data.append("images", file);
    });

    try {
      // Content-Type multipart/form-data hona chahiye (Axios handles this automatically with FormData)
      const response = await API.post("/hotel/add", data);      
      if (response.data) {
        alert("Property & Images Uploaded Successfully! 🏔️");
        setFormData({ name: '', location: 'Guptakashi', price: '', roomType: 'Standard', distance: '' });
        setImages([]);
        setPreviews([]);
      }
    } catch (error) {
      console.error("Backend Error:", error);
      alert(error.response?.data?.message || "Failed to list property.");
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
        className="max-w-4xl mx-auto bg-white/10 backdrop-blur-3xl border border-white/20 rounded-[60px] p-10 md:p-16 shadow-2xl"
      >
        <div className="mb-12">
          <h2 className="text-5xl font-black text-white tracking-tighter uppercase leading-none">
            LIST YOUR <span className="text-orange-500 italic">PROPERTY.</span>
          </h2>
          <p className="text-white/50 font-bold text-[10px] tracking-[0.3em] uppercase mt-4">Partner with M-Mate for Kedarnath Yatra 2026</p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-10">
          
          {/* Form Fields - Same as before */}
          <div className="space-y-4">
            <label className="flex items-center gap-3 text-[9px] font-black text-white/40 uppercase tracking-widest ml-2">
              <Hotel size={14}/> Property Name
            </label>
            <input name="name" value={formData.name} onChange={handleChange} required type="text" placeholder="e.g. Kedar Valley Resort" className="w-full bg-white/5 border border-white/10 p-6 rounded-[30px] font-bold text-white outline-none focus:bg-white/10 focus:border-orange-500 transition-all placeholder:text-white/20" />
          </div>

          <div className="space-y-4">
            <label className="flex items-center gap-3 text-[9px] font-black text-white/40 uppercase tracking-widest ml-2">
              <MapPin size={14}/> Area / Location
            </label>
            <select name="location" value={formData.location} onChange={handleChange} className="w-full bg-white/5 border border-white/10 p-6 rounded-[30px] font-bold text-white outline-none appearance-none cursor-pointer">
              <option className="bg-gray-900" value="Guptakashi">GUPTAKASHI</option>
              <option className="bg-gray-900" value="Sonprayag">SONPRAYAG</option>
              <option className="bg-gray-900" value="Phata">PHATA</option>
              <option className="bg-gray-900" value="Kedarnath">KEDARNATH</option>
              <option className="bg-gray-900" value="Gaurikund">GAURIKUND</option>
            </select>
          </div>

          {/* IMAGE UPLOAD SECTION */}
          <div className="md:col-span-2 space-y-4">
            <label className="flex items-center gap-3 text-[9px] font-black text-white/40 uppercase tracking-widest ml-2">
              <ImagePlus size={14}/> Property Images (Select Multiple)
            </label>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {/* Preview Boxes */}
              <AnimatePresence>
                {previews.map((src, index) => (
                  <motion.div 
                    key={src}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="relative aspect-square rounded-2xl overflow-hidden border border-white/20"
                  >
                    <img src={src} alt="Preview" className="w-full h-full object-cover" />
                    <button 
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-red-500 p-1 rounded-full text-white hover:bg-red-600 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Upload Trigger */}
              <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-white/20 rounded-2xl cursor-pointer hover:bg-white/5 transition-colors group">
                <ImagePlus className="text-white/20 group-hover:text-orange-500 transition-colors" size={30} />
                <span className="text-[8px] font-bold text-white/20 mt-2 uppercase">Add Photo</span>
                <input 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  onChange={handleImageChange} 
                  className="hidden" 
                />
              </label>
            </div>
          </div>

          {/* Other Fields */}
          <div className="space-y-4">
            <label className="flex items-center gap-3 text-[9px] font-black text-white/40 uppercase tracking-widest ml-2">
              <IndianRupee size={14}/> Price (₹)
            </label>
            <input name="price" value={formData.price} onChange={handleChange} required type="number" placeholder="3500" className="w-full bg-white/5 border border-white/10 p-6 rounded-[30px] font-bold text-white outline-none focus:border-orange-500 transition-all placeholder:text-white/20" />
          </div>

          <div className="space-y-4">
            <label className="flex items-center gap-3 text-[9px] font-black text-white/40 uppercase tracking-widest ml-2">
              <Star size={14}/> Room Type
            </label>
            <select name="roomType" value={formData.roomType} onChange={handleChange} className="w-full bg-white/5 border border-white/10 p-6 rounded-[30px] font-bold text-white outline-none appearance-none cursor-pointer">
              <option className="bg-gray-900" value="Standard">Standard Room</option>
              <option className="bg-gray-900" value="Deluxe">Deluxe Suite</option>
              <option className="bg-gray-900" value="Swiss Tents">Swiss Tents</option>
            </select>
          </div>

          <div className="md:col-span-2 pt-6">
            <button 
              disabled={loading}
              type="submit"
              className="w-full bg-orange-600 hover:bg-white hover:text-black text-white p-8 rounded-[35px] font-black text-[11px] uppercase tracking-[0.4em] shadow-2xl transition-all flex items-center justify-center gap-4 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" /> : <ShieldCheck size={20}/>}
              {loading ? "UPLOADING..." : "SUBMIT PROPERTY"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default AddHotel;