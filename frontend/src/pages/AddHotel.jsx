import API from "../utils/api";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotify } from "../context/NotificationContext";
import { 
  Hotel, MapPin, IndianRupee, ShieldCheck, Loader2, ImagePlus, 
  X, Info, Users, Phone, User, BookOpen, CheckCircle2, Navigation
} from 'lucide-react';

const AddHotel = () => {
  const { notify } = useNotify();
  const [formData, setFormData] = useState({
    hotelName: '', // Fixed: name -> hotelName
    propertyType: 'Hotel',
    location: 'Guptakashi',
    landmark: '',
    pricePerNight: '', // Fixed: price -> pricePerNight
    roomType: 'Standard',
    totalRooms: '',
    guestsPerRoom: '2',
    distance: '0',
    description: '',
    ownerName: '',
    contactNumber: '',
    mapsLink: '',
    cancellationPolicy: '',
    petPolicy: 'Not Allowed',
    smokingPolicy: 'Prohibited',
  });

  const [amenities, setAmenities] = useState({
    wifi: false, parking: false, breakfast: false, hotWater: false,
    roomService: false, mountainView: false, restaurant: false, powerBackup: false
  });

  const [images, setImages] = useState([]); 
  const [previews, setPreviews] = useState([]); 
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAmenityChange = (amenity) => {
    setAmenities(prev => ({ ...prev, [amenity]: !prev[amenity] }));
  };

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

    // 🚨 Critical Validation
    if (!formData.hotelName || !formData.pricePerNight) {
        return notify("Bhai, Hotel ka naam aur rate zaruri hai!", "error");
    }
    if (images.length === 0) return notify("Bhai, kam se kam ek photo toh dalo!", "error");
    
    setLoading(true);
    const data = new FormData();
    
    // 🛠️ Proper Data Preparation
    Object.keys(formData).forEach(key => {
      // Cast numeric strings to actual numbers for backend
      if (['pricePerNight', 'totalRooms', 'guestsPerRoom', 'distance'].includes(key)) {
        data.append(key, Number(formData[key]) || 0);
      } else {
        data.append(key, formData[key]);
      }
    });
    
    const selectedAmenities = Object.keys(amenities).filter(key => amenities[key]);
    data.append("amenities", JSON.stringify(selectedAmenities));

    images.forEach((file) => data.append("images", file));

    try {
      const response = await API.post("/hotel/add", data);      
      
      if (response.data) {
        notify("Property Synced to Vault! Admin approval pending. 🏔️", "success");
        setFormData({ 
          hotelName: '', location: 'Guptakashi', pricePerNight: '', totalRooms: '', 
          propertyType: 'Hotel', landmark: '', contactNumber: '', description: '',
          ownerName: '', mapsLink: '', cancellationPolicy: '', 
          petPolicy: 'Not Allowed', smokingPolicy: 'Prohibited',
          guestsPerRoom: '2', distance: '0', roomType: 'Standard'
        });
        setImages([]);
        setPreviews([]);
        setAmenities({
            wifi: false, parking: false, breakfast: false, hotWater: false,
            roomService: false, mountainView: false, restaurant: false, powerBackup: false
        });
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Check fields and try again.";
      notify(`Status: ${errorMsg}`, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen pt-32 pb-20 px-4 md:px-8 overflow-x-hidden font-sans">
      <img src="https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=2500" className="fixed inset-0 w-full h-full object-cover z-[-1]" alt="BG" />
      <div className="fixed inset-0 bg-black/85 backdrop-blur-[8px] z-[-1]"></div>

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto bg-white/[0.02] backdrop-blur-3xl border border-white/10 rounded-[40px] md:rounded-[60px] p-6 md:p-16 shadow-3xl">
        <div className="mb-12 border-b border-white/10 pb-8">
          <h2 className="text-4xl md:text-7xl font-black text-white tracking-tighter uppercase italic leading-none">
            REGISTER <span className="text-orange-600">PROPERTY.</span>
          </h2>
          <p className="text-white/20 font-black text-[9px] tracking-[0.5em] uppercase mt-5 italic">Transmission ID: MM-{Math.floor(Math.random()*9000)}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-12 md:space-y-16">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
            <div className="space-y-4">
              <label className="flex items-center gap-3 text-[9px] font-black text-white/40 uppercase tracking-widest"><Hotel size={14} className="text-orange-500"/> Property Identity</label>
              <input name="hotelName" value={formData.hotelName} onChange={handleChange} required placeholder="Kedar Valley Resort" className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl font-bold text-white outline-none focus:border-orange-600 transition-all" />
            </div>
            <div className="space-y-4">
              <label className="flex items-center gap-3 text-[9px] font-black text-white/40 uppercase tracking-widest"><Info size={14} className="text-orange-500"/> Classification</label>
              <select name="propertyType" value={formData.propertyType} onChange={handleChange} className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl font-bold text-white outline-none cursor-pointer">
                {['Hotel', 'Homestay', 'Resort', 'Guest House', 'Camp'].map(t => <option key={t} value={t} className="bg-[#111]">{t}</option>)}
              </select>
            </div>
            <div className="space-y-4">
              <label className="flex items-center gap-3 text-[9px] font-black text-white/40 uppercase tracking-widest"><MapPin size={14} className="text-orange-500"/> Tactical Zone</label>
              <select name="location" value={formData.location} onChange={handleChange} className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl font-bold text-white outline-none cursor-pointer">
                {['Guptakashi', 'Sonprayag', 'Phata', 'Rudraprayag', 'Ukhimath'].map(l => <option key={l} value={l} className="bg-[#111]">{l}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            <div className="space-y-4">
              <label className="flex items-center gap-3 text-[9px] font-black text-white/40 uppercase tracking-widest"><IndianRupee size={12}/> Rate/Night</label>
              <input name="pricePerNight" type="number" value={formData.pricePerNight} onChange={handleChange} required placeholder="3500" className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl font-bold text-white outline-none focus:border-orange-600" />
            </div>
            <div className="space-y-4">
              <label className="flex items-center gap-3 text-[9px] font-black text-white/40 uppercase tracking-widest"><BookOpen size={12}/> Units</label>
              <input name="totalRooms" type="number" value={formData.totalRooms} onChange={handleChange} required placeholder="10" className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl font-bold text-white outline-none focus:border-orange-600" />
            </div>
            <div className="space-y-4">
              <label className="flex items-center gap-3 text-[9px] font-black text-white/40 uppercase tracking-widest"><Users size={12}/> Max Guests</label>
              <input name="guestsPerRoom" type="number" value={formData.guestsPerRoom} onChange={handleChange} className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl font-bold text-white outline-none" />
            </div>
            <div className="space-y-4">
              <label className="flex items-center gap-3 text-[9px] font-black text-white/40 uppercase tracking-widest"><Navigation size={12}/> Landmark</label>
              <input name="landmark" value={formData.landmark} onChange={handleChange} placeholder="Near Helipad" className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl font-bold text-white outline-none" />
            </div>
          </div>

          <div className="space-y-8">
            <label className="text-[10px] font-black text-orange-500 uppercase tracking-[0.4em] italic underline underline-offset-8 decoration-orange-500/20">Facility Infrastructure</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.keys(amenities).map((key) => (
                <button 
                  key={key} type="button" onClick={() => handleAmenityChange(key)}
                  className={`flex items-center gap-4 p-5 rounded-2xl transition-all border-2 ${amenities[key] ? 'bg-orange-600 border-orange-400 text-white' : 'bg-white/5 border-white/5 text-white/20 hover:border-white/20'}`}
                >
                  <CheckCircle2 size={16} className={amenities[key] ? 'opacity-100' : 'opacity-20'} />
                  <span className="text-[9px] font-black uppercase tracking-widest">{key.replace(/([A-Z])/g, ' $1')}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
            <div className="space-y-4">
              <label className="flex items-center gap-3 text-[9px] font-black text-white/40 uppercase tracking-widest"><User size={14}/> Manager Name</label>
              <input name="ownerName" value={formData.ownerName} onChange={handleChange} required placeholder="Shardul Aswal" className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl font-bold text-white outline-none focus:border-orange-600" />
            </div>
            <div className="space-y-4">
              <label className="flex items-center gap-3 text-[9px] font-black text-white/40 uppercase tracking-widest"><Phone size={14}/> Contact Line</label>
              <input name="contactNumber" value={formData.contactNumber} onChange={handleChange} required placeholder="+91 XXXX" className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl font-bold text-white outline-none focus:border-orange-600" />
            </div>
          </div>

          <div className="space-y-4">
            <label className="flex items-center gap-3 text-[9px] font-black text-white/40 uppercase tracking-widest">System Narrative</label>
            <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Brief about hospitality..." className="w-full h-40 bg-white/5 border border-white/10 p-8 rounded-3xl font-bold text-white outline-none resize-none focus:border-orange-600" />
          </div>

          <div className="space-y-8 bg-white/[0.02] p-6 md:p-10 rounded-[30px] border border-white/5">
            <label className="flex items-center gap-3 text-[9px] font-black text-white/40 uppercase tracking-widest"><ImagePlus size={14}/> Visual Assets (Gallery)</label>
            <div className="flex gap-5 flex-wrap">
              <AnimatePresence>
                {previews.map((src, index) => (
                  <motion.div key={src} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5 }} className="relative w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden border border-white/10 group">
                    <img src={src} className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeImage(index)} className="absolute top-2 right-2 bg-red-600 p-2 rounded-full shadow-xl hover:bg-white hover:text-red-600 transition-all"><X size={12}/></button>
                  </motion.div>
                ))}
              </AnimatePresence>
              <label className="w-32 h-32 md:w-40 md:h-40 flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-2xl cursor-pointer hover:bg-orange-600/10 hover:border-orange-600 transition-all group">
                <ImagePlus className="text-white/20 group-hover:text-orange-500" size={32} />
                <span className="text-[8px] font-black text-white/20 uppercase mt-3 tracking-widest">Upload</span>
                <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
            </div>
          </div>

          <button disabled={loading} type="submit" className="w-full bg-orange-600 hover:bg-white hover:text-black text-white p-8 md:p-10 rounded-full font-black text-[12px] uppercase tracking-[0.4em] shadow-3xl transition-all flex items-center justify-center gap-5 disabled:opacity-50 active:scale-95">
            {loading ? <Loader2 className="animate-spin" /> : <ShieldCheck size={24}/>}
            {loading ? "TRANSMITTING DATA..." : "INITIALIZE DEPLOYMENT"}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default AddHotel;