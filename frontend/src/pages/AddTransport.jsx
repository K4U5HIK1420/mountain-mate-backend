import API from "../utils/api";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Car, MapPin, IndianRupee, Users, ShieldCheck, Navigation, Loader2, Image as ImageIcon, X, Phone } from 'lucide-react';

const AddTransport = () => {
  const [formData, setFormData] = useState({
    model: '',
    number: '', // Plate Number
    capacity: '7', // Default to 7 Seater
    price: '',
    location: 'Guptakashi',
    contact: '' // Added contact for the driver
  });

  const [images, setImages] = useState([]); // Raw files for Multer
  const [previews, setPreviews] = useState([]); // Preview URLs for UI
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Multiple Image Selection Handling
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages((prev) => [...prev, ...files]);

    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
    setPreviews(previews.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (images.length === 0) return alert("Bhai, kam se kam ek photo toh dalo gaadi ki!");
    
    setLoading(true);
    const data = new FormData();
    
    // Text fields append karna
    data.append("vehicleName", formData.model);
    data.append("vehicleNumber", formData.number);
    data.append("capacity", formData.capacity);
    data.append("pricePerDay", formData.price);
    data.append("location", formData.location);
    data.append("contactNumber", formData.contact);
    
    // Images append karna
    images.forEach((file) => {
      data.append("images", file);
    });

    try {
      // Endpoint: /transport/add
      const response = await API.post("/transport/add", data, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (response.data) {
        alert("Vehicle Registered! Admin approval ka wait karo. 🚕");
        setFormData({ model: '', number: '', capacity: '7', price: '', location: 'Guptakashi', contact: '' });
        setImages([]);
        setPreviews([]);
      }
    } catch (error) {
      console.error("Submission Error:", error);
      alert(error.response?.data?.message || "Failed to register vehicle. Check server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen pt-40 pb-20 px-8">
      {/* Immersive Background */}
      <img 
        src="https://images.unsplash.com/photo-1530521954074-e64f6810b32d?q=80&w=2070" 
        className="fixed inset-0 w-full h-full object-cover z-[-1]"
        alt="Mountain Road"
      />
      <div className="fixed inset-0 bg-black/80 backdrop-blur-[6px] z-[-1]"></div>

      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[80px] p-16 shadow-2xl"
      >
        <div className="mb-16">
          <h2 className="text-7xl font-black text-white tracking-tighter uppercase leading-none italic">
            REGISTER <span className="text-orange-600">RIDE.</span>
          </h2>
          <p className="text-white/30 font-bold text-[10px] tracking-[0.5em] uppercase mt-6 ml-2">Fleet Management Portal / Kedarnath 2026</p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-20">
          
          {/* Details Section */}
          <div className="space-y-10">
            <div className="space-y-4">
              <label className="flex items-center gap-4 text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-2"><Car size={16}/> Vehicle Model</label>
              <input name="model" value={formData.model} onChange={handleChange} required type="text" placeholder="e.g. Innova Crysta" className="w-full bg-white/5 border border-white/10 p-7 rounded-[35px] font-black text-white outline-none focus:border-orange-600 transition-all placeholder:text-white/10" />
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="flex items-center gap-4 text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-2"><Navigation size={16}/> Plate Number</label>
                <input name="number" value={formData.number} onChange={handleChange} required type="text" placeholder="UK 13 TA 1234" className="w-full bg-white/5 border border-white/10 p-7 rounded-[35px] font-black text-white outline-none focus:border-orange-600 transition-all" />
              </div>
              <div className="space-y-4">
                <label className="flex items-center gap-4 text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-2"><Users size={16}/> Seating</label>
                <select name="capacity" value={formData.capacity} onChange={handleChange} className="w-full bg-white/5 border border-white/10 p-7 rounded-[35px] font-black text-white outline-none cursor-pointer appearance-none">
                  <option className="bg-zinc-900" value="4">4 Seater</option>
                  <option className="bg-zinc-900" value="7">7 Seater</option>
                  <option className="bg-zinc-900" value="12">12 Seater</option>
                  <option className="bg-zinc-900" value="25">Bus (25+)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="flex items-center gap-4 text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-2"><IndianRupee size={16}/> Rate/Day</label>
                <input name="price" value={formData.price} onChange={handleChange} required type="number" placeholder="4500" className="w-full bg-white/5 border border-white/10 p-7 rounded-[35px] font-black text-white outline-none focus:border-orange-600 transition-all" />
              </div>
              <div className="space-y-4">
                <label className="flex items-center gap-4 text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-2"><Phone size={16}/> Contact</label>
                <input name="contact" value={formData.contact} onChange={handleChange} required type="text" placeholder="+91 99...00" className="w-full bg-white/5 border border-white/10 p-7 rounded-[35px] font-black text-white outline-none focus:border-orange-600 transition-all" />
              </div>
            </div>
          </div>

          {/* Image Upload Section */}
          <div className="space-y-10">
             <div className="space-y-4">
                <label className="flex items-center gap-4 text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-2"><ImageIcon size={16}/> Vehicle Gallery</label>
                <div className="relative group">
                  <input type="file" multiple accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
                  <div className="w-full bg-white/[0.02] border-4 border-dashed border-white/5 p-16 rounded-[50px] text-center group-hover:border-orange-600 transition-all">
                    <p className="text-white/20 font-black text-[11px] tracking-[0.4em] uppercase">Add External/Internal Photos</p>
                    <p className="text-orange-600/50 text-[9px] mt-4 font-black uppercase italic tracking-widest">DRAG OR CLICK TO SELECT</p>
                  </div>
                </div>
             </div>

             {/* Previews */}
             <div className="grid grid-cols-3 gap-6">
                {previews.map((url, index) => (
                  <div key={index} className="relative aspect-square">
                    <img src={url} className="w-full h-full object-cover rounded-[30px] border-2 border-white/10 shadow-2xl" alt="preview" />
                    <button type="button" onClick={() => removeImage(index)} className="absolute -top-3 -right-3 bg-red-600 text-white p-2 rounded-full shadow-2xl z-30">
                      <X size={16} />
                    </button>
                    {index === 0 && <div className="absolute bottom-4 left-4 bg-orange-600 text-[8px] font-black px-4 py-1.5 rounded-full text-white tracking-widest">THUMBNAIL</div>}
                  </div>
                ))}
             </div>
          </div>

          <div className="lg:col-span-2 pt-10">
            <button 
              disabled={loading}
              type="submit"
              className="w-full bg-white text-black hover:bg-orange-600 hover:text-white p-10 rounded-[40px] font-black text-[13px] uppercase tracking-[0.6em] shadow-2xl transition-all flex items-center justify-center gap-6 disabled:opacity-20"
            >
              {loading ? <Loader2 className="animate-spin" /> : <ShieldCheck size={24}/>}
              {loading ? "INITIALIZING UPLOAD..." : "SUBMIT TO FLEET MANAGER"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default AddTransport;