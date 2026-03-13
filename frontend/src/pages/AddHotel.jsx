import API from "../utils/api";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotify } from "../context/NotificationContext";
import { Hotel, MapPin, IndianRupee, Star, ShieldCheck, Loader2, ImagePlus, X, Info, Users, Phone, User, BookOpen, CheckCircle2 } from 'lucide-react';

const AddHotel = () => {
  const { notify } = useNotify();
  const [formData, setFormData] = useState({
    name: '',
    propertyType: 'Hotel', // New
    location: 'Guptakashi',
    landmark: '', // New
    price: '',
    roomType: 'Standard',
    totalRooms: '', // New
    guestsPerRoom: '2', // New
    distance: '0',
    description: '', // New
    ownerName: '', // New
    contactNumber: '', // New
    mapsLink: '', // New
    cancellationPolicy: '', // New
    petPolicy: 'Not Allowed', // New
    smokingPolicy: 'Prohibited', // New
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
    if (images.length === 0) return notify("Bhai, kam se kam ek photo toh dalo!", "error");
    
    setLoading(true);
    const token = localStorage.getItem("token");
    const data = new FormData();
    
    // Append all text fields
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    
    // Convert amenities to array and append
    const selectedAmenities = Object.keys(amenities).filter(key => amenities[key]);
    data.append("amenities", JSON.stringify(selectedAmenities));

    // Append images
    images.forEach((file) => data.append("images", file));

    try {
      const response = await API.post("/hotel/add", data, {
        headers: { "Authorization": `Bearer ${token}` }
      });      
      
      if (response.data) {
        notify("Property Synced to Vault! Admin approval pending. 🏔️", "success");
        setFormData({ name: '', location: 'Guptakashi', price: '', roomType: 'Standard', distance: '0' });
        setImages([]);
        setPreviews([]);
      }
    } catch (error) {
      console.error("Backend Error Detail:", error.response?.data);
      // Backend se jo validation error message aayega, wahi alert mein dikhega
      const errorMsg = error.response?.data?.message || "Validation Error: Check Server Fields";
      notify(`Server Says: ${errorMsg}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const amenityLabels = [
    { id: 'wifi', label: 'WiFi' }, { id: 'parking', label: 'Parking' },
    { id: 'breakfast', label: 'Breakfast' }, { id: 'hotWater', label: 'Hot Water' },
    { id: 'roomService', label: 'Room Service' }, { id: 'mountainView', label: 'Mountain View' },
    { id: 'restaurant', label: 'Restaurant' }, { id: 'powerBackup', label: 'Power Backup' }
  ];

  return (
    <div className="relative min-h-screen pt-32 pb-20 px-6">
      <img src="https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=2500" className="fixed inset-0 w-full h-full object-cover z-[-1]" alt="BG" />
      <div className="fixed inset-0 bg-black/75 backdrop-blur-[4px] z-[-1]"></div>

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[60px] p-8 md:p-16 shadow-2xl">
        <div className="mb-12 border-b border-white/10 pb-8">
          <h2 className="text-6xl font-black text-white tracking-tighter uppercase italic leading-none">
            REGISTER <span className="text-orange-500">PROPERTY.</span>
          </h2>
          <p className="text-white/40 font-bold text-[10px] tracking-[0.5em] uppercase mt-4">Partner Transmission Portal / Mountain Mate</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-16">
          {/* Section 1: Basic Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <label className="flex items-center gap-3 text-[9px] font-black text-white/40 uppercase tracking-widest"><Hotel size={14}/> Property Name</label>
              <input name="name" value={formData.name} onChange={handleChange} required placeholder="Kedar Valley Resort" className="w-full bg-white/5 border border-white/10 p-5 rounded-[25px] font-bold text-white outline-none focus:border-orange-500 transition-all" />
            </div>
            <div className="space-y-4">
              <label className="flex items-center gap-3 text-[9px] font-black text-white/40 uppercase tracking-widest"><Info size={14}/> Property Type</label>
              <select name="propertyType" value={formData.propertyType} onChange={handleChange} className="w-full bg-white/5 border border-white/10 p-5 rounded-[25px] font-bold text-white outline-none appearance-none cursor-pointer">
                {['Hotel', 'Homestay', 'Resort', 'Guest House', 'Camp'].map(t => <option key={t} value={t} className="bg-black">{t}</option>)}
              </select>
            </div>
            <div className="space-y-4">
              <label className="flex items-center gap-3 text-[9px] font-black text-white/40 uppercase tracking-widest"><MapPin size={14}/> Location</label>
              <select name="location" value={formData.location} onChange={handleChange} className="w-full bg-white/5 border border-white/10 p-5 rounded-[25px] font-bold text-white outline-none appearance-none cursor-pointer">
                {['Guptakashi', 'Sonprayag', 'Phata'].map(l => <option key={l} value={l} className="bg-black">{l}</option>)}
              </select>
            </div>
          </div>

          {/* Section 2: Capacity & Pricing */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <label className="flex items-center gap-3 text-[9px] font-black text-white/40 uppercase tracking-widest"><IndianRupee size={14}/> Base Price</label>
              <input name="price" type="number" value={formData.price} onChange={handleChange} required placeholder="3500" className="w-full bg-white/5 border border-white/10 p-5 rounded-[25px] font-bold text-white outline-none focus:border-orange-500 transition-all" />
            </div>
            <div className="space-y-4">
              <label className="flex items-center gap-3 text-[9px] font-black text-white/40 uppercase tracking-widest"><BookOpen size={14}/> Total Rooms</label>
              <input name="totalRooms" type="number" value={formData.totalRooms} onChange={handleChange} required placeholder="12" className="w-full bg-white/5 border border-white/10 p-5 rounded-[25px] font-bold text-white outline-none focus:border-orange-500 transition-all" />
            </div>
            <div className="space-y-4">
              <label className="flex items-center gap-3 text-[9px] font-black text-white/40 uppercase tracking-widest"><Users size={14}/> Max Guests / Rm</label>
              <input name="guestsPerRoom" type="number" value={formData.guestsPerRoom} onChange={handleChange} className="w-full bg-white/5 border border-white/10 p-5 rounded-[25px] font-bold text-white outline-none" />
            </div>
            <div className="space-y-4">
              <label className="flex items-center gap-3 text-[9px] font-black text-white/40 uppercase tracking-widest"><MapPin size={14}/> Landmark</label>
              <input name="landmark" value={formData.landmark} onChange={handleChange} placeholder="Near Helipad" className="w-full bg-white/5 border border-white/10 p-5 rounded-[25px] font-bold text-white outline-none" />
            </div>
          </div>

          {/* Amenities Checkboxes */}
          <div className="space-y-6">
            <label className="text-[10px] font-black text-orange-500 uppercase tracking-[0.3em]">Select Amenities</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {amenityLabels.map((item) => (
                <div 
                  key={item.id} 
                  onClick={() => handleAmenityChange(item.id)}
                  className={`flex items-center gap-3 p-4 rounded-2xl cursor-pointer transition-all border ${amenities[item.id] ? 'bg-orange-600 border-orange-500 text-white' : 'bg-white/5 border-white/10 text-white/40'}`}
                >
                  <CheckCircle2 size={16} className={amenities[item.id] ? 'opacity-100' : 'opacity-20'} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Contact & Links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <label className="flex items-center gap-3 text-[9px] font-black text-white/40 uppercase tracking-widest"><User size={14}/> Owner / Manager Name</label>
              <input name="ownerName" value={formData.ownerName} onChange={handleChange} required className="w-full bg-white/5 border border-white/10 p-5 rounded-[25px] font-bold text-white outline-none focus:border-orange-500" />
            </div>
            <div className="space-y-4">
              <label className="flex items-center gap-3 text-[9px] font-black text-white/40 uppercase tracking-widest"><Phone size={14}/> Contact Number</label>
              <input name="contactNumber" value={formData.contactNumber} onChange={handleChange} required className="w-full bg-white/5 border border-white/10 p-5 rounded-[25px] font-bold text-white outline-none focus:border-orange-500" />
            </div>
            <div className="space-y-4">
              <label className="flex items-center gap-3 text-[9px] font-black text-white/40 uppercase tracking-widest"><MapPin size={14}/> Maps Link</label>
              <input name="mapsLink" value={formData.mapsLink} onChange={handleChange} placeholder="https://google.com/maps/..." className="w-full bg-white/5 border border-white/10 p-5 rounded-[25px] font-bold text-white outline-none" />
            </div>
          </div>

          <div className="space-y-4 md:col-span-2">
            <label className="flex items-center gap-3 text-[9px] font-black text-white/40 uppercase tracking-widest">Property Description</label>
            <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Tell travelers about the mountain view and hospitality..." className="w-full h-32 bg-white/5 border border-white/10 p-6 rounded-[30px] font-bold text-white outline-none resize-none" />
          </div>

          {/* Images Upload Section */}
          <div className="space-y-6">
            <label className="flex items-center gap-3 text-[9px] font-black text-white/40 uppercase tracking-widest"><ImagePlus size={14}/> Property Gallery</label>
            <div className="flex gap-4 flex-wrap">
              <AnimatePresence>
                {previews.map((src, index) => (
                  <motion.div key={src} initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }} className="relative w-32 h-32 rounded-3xl overflow-hidden border border-white/20">
                    <img src={src} alt="Pre" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeImage(index)} className="absolute top-2 right-2 bg-red-500 p-1 rounded-full"><X size={10}/></button>
                  </motion.div>
                ))}
              </AnimatePresence>
              <label className="w-32 h-32 flex flex-col items-center justify-center border-2 border-dashed border-white/20 rounded-3xl cursor-pointer hover:bg-white/5">
                <ImagePlus className="text-white/20" size={24} />
                <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
            </div>
          </div>

          {/* Policies */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-white/10 pt-12">
            <div className="space-y-4">
              <label className="text-[9px] font-black text-white/40 uppercase tracking-widest">Cancellation Policy</label>
              <input name="cancellationPolicy" value={formData.cancellationPolicy} onChange={handleChange} placeholder="Full refund within 24hrs" className="w-full bg-white/5 border border-white/10 p-5 rounded-[25px] font-bold text-white outline-none" />
            </div>
            <div className="space-y-4">
              <label className="text-[9px] font-black text-white/40 uppercase tracking-widest">Pet Policy</label>
              <select name="petPolicy" value={formData.petPolicy} onChange={handleChange} className="w-full bg-white/5 border border-white/10 p-5 rounded-[25px] font-bold text-white outline-none appearance-none">
                <option value="Allowed" className="bg-black">Allowed</option>
                <option value="Not Allowed" className="bg-black">Not Allowed</option>
              </select>
            </div>
            <div className="space-y-4">
              <label className="text-[9px] font-black text-white/40 uppercase tracking-widest">Smoking Policy</label>
              <select name="smokingPolicy" value={formData.smokingPolicy} onChange={handleChange} className="w-full bg-white/5 border border-white/10 p-5 rounded-[25px] font-bold text-white outline-none appearance-none">
                <option value="Prohibited" className="bg-black">Prohibited</option>
                <option value="Designated Areas" className="bg-black">Designated Areas</option>
              </select>
            </div>
          </div>

          <button disabled={loading} type="submit" className="w-full bg-orange-600 hover:bg-white hover:text-black text-white p-8 rounded-[35px] font-black text-[11px] uppercase tracking-[0.4em] shadow-2xl transition-all flex items-center justify-center gap-4">
            {loading ? <Loader2 className="animate-spin" /> : <ShieldCheck size={20}/>}
            {loading ? "DATA TRANSMITTING..." : "INITIALIZE DEPLOYMENT"}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default AddHotel;