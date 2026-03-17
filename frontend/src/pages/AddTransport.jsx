import API from "../utils/api";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Car, MapPin, IndianRupee, Users, ShieldCheck, 
  Navigation, Loader2, Image as ImageIcon, X, 
  Phone, User as UserIcon, UploadCloud, Info, CheckCircle2, Zap, ArrowRight, Activity, Globe, Cpu
} from 'lucide-react';
import { useNotify } from "../context/NotificationContext";

const AddTransport = () => {
  const { notify } = useNotify();
  const [formData, setFormData] = useState({
    vehicleModel: '', 
    plateNumber: '', 
    vehicleType: '', 
    driverName: '', 
    routeFrom: '', 
    routeTo: '', 
    pricePerSeat: '', 
    seatsAvailable: '1', 
    contactNumber: ''
  });

  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setImages((prev) => [...prev, ...files]);
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
    setPreviews(previews.filter((_, i) => i !== index));
  };

  const getCoords = async (place) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(place)}&format=json&limit=1`);
      const data = await res.json();
      return (data && data.length > 0) 
        ? { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
        : { lat: 30.7333, lng: 79.0667 };
    } catch (err) { return { lat: 30.7333, lng: 79.0667 }; }
  };

  const handleSubmit = async (e) => { 
    e.preventDefault();
    if (images.length === 0) return notify("Protocol Error: Vehicle media required", "error");
    
    setLoading(true);

    try {
      const fromCoords = await getCoords(formData.routeFrom);
      const toCoords = await getCoords(formData.routeTo);

      const data = new FormData();
      Object.keys(formData).forEach(key => data.append(key, formData[key]));
      data.append("fromCoords", JSON.stringify(fromCoords));
      data.append("toCoords", JSON.stringify(toCoords));
      images.forEach((file) => data.append("images", file));

      const response = await API.post("/transport/add", data, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (response.data.success) {
        notify("Transmission Successful: Fleet Online", "success");        
        setFormData({ vehicleModel: '', plateNumber: '', vehicleType: '', driverName: '', routeFrom: '', routeTo: '', pricePerSeat: '', seatsAvailable: '1', contactNumber: '' });
        setImages([]);
        setPreviews([]);
      }
    } catch (error) {
      notify("Uplink Failed: Check Connection", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#050505] text-white pt-40 pb-20 px-4 md:px-8 selection:bg-orange-600">
      
      {/* --- CINEMATIC BACKGROUND ENGINE --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img src="https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=2500" className="w-full h-full object-cover opacity-[0.08] grayscale scale-110 blur-[2px]" alt="" />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#ea580c10,transparent_70%)]"></div>
      </div>

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 max-w-7xl mx-auto">
        
        {/* --- EXECUTIVE HEADER --- */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="h-1 w-12 bg-orange-600 rounded-full"></div>
                    <p className="text-orange-500 font-black text-[9px] tracking-[0.7em] uppercase italic">Central Logistics Terminal</p>
                </div>
                <h1 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter leading-none drop-shadow-2xl">
                    ONBOARD <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-800">UNITS.</span>
                </h1>
            </div>
            <div className="flex items-center gap-4 bg-white/[0.02] border border-white/10 p-6 rounded-[35px] backdrop-blur-3xl shadow-3xl">
                <div className="p-3 bg-orange-600/10 rounded-2xl text-orange-500 border border-orange-600/20">
                    <Cpu size={24} className="animate-spin-slow" />
                </div>
                <div>
                    <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">Protocol Sync</p>
                    <p className="text-lg font-black italic text-white leading-none">CONNECTED</p>
                </div>
            </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* --- LEFT: CONFIGURATION MODULE (8 COLS) --- */}
          <div className="lg:col-span-8 space-y-8">
            <div className="bg-white/[0.02] border border-white/5 rounded-[60px] p-8 md:p-12 backdrop-blur-3xl shadow-2xl transition-all hover:border-orange-600/10 group">
              
              <div className="space-y-12">
                {/* 01. IDENTITY */}
                <div className="space-y-8">
                  <div className="flex items-center justify-between border-b border-white/5 pb-6">
                    <div className="flex items-center gap-4">
                        <span className="text-orange-600 font-black italic text-xl">01</span>
                        <p className="text-white font-black text-[11px] uppercase tracking-[0.4em] italic leading-none">Core Identity Specs</p>
                    </div>
                    <CheckCircle2 size={16} className="text-white/10" />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                          <label className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] ml-4 italic">Vehicle Model</label>
                          <input name="vehicleModel" value={formData.vehicleModel} onChange={handleChange} required placeholder="Innova Crysta / Premium SUV" className="w-full bg-black/40 border border-white/10 p-6 rounded-[28px] outline-none focus:border-orange-500/50 transition-all font-bold text-white text-sm shadow-inner" />
                      </div>
                      <div className="space-y-3">
                          <label className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] ml-4 italic">Lead Pilot Name</label>
                          <input name="driverName" value={formData.driverName} onChange={handleChange} required placeholder="Lead Navigator" className="w-full bg-black/40 border border-white/10 p-6 rounded-[28px] outline-none focus:border-orange-500/50 transition-all font-bold text-white text-sm shadow-inner" />
                      </div>
                  </div>
                </div>

                {/* 02. GEOGRAPHY */}
                <div className="space-y-8 pt-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-6">
                    <div className="flex items-center gap-4">
                        <span className="text-orange-600 font-black italic text-xl">02</span>
                        <p className="text-white font-black text-[11px] uppercase tracking-[0.4em] italic leading-none">Global Navigation Links</p>
                    </div>
                    <Globe size={16} className="text-white/10 animate-pulse" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="group bg-black/40 border border-white/5 rounded-[30px] p-2 focus-within:border-orange-600/30 transition-all">
                      <div className="flex items-center gap-4 px-6 py-4">
                        <MapPin className="text-orange-500" size={18}/>
                        <input name="routeFrom" value={formData.routeFrom} onChange={handleChange} required placeholder="ORIGIN TERMINAL" className="bg-transparent w-full outline-none font-black uppercase tracking-widest text-xs text-white" />
                      </div>
                    </div>
                    <div className="group bg-black/40 border border-white/5 rounded-[30px] p-2 focus-within:border-orange-600/30 transition-all">
                      <div className="flex items-center gap-4 px-6 py-4">
                        <Navigation className="text-orange-500" size={18}/>
                        <input name="routeTo" value={formData.routeTo} onChange={handleChange} required placeholder="DESTINATION HUB" className="bg-transparent w-full outline-none font-black uppercase tracking-widest text-xs text-white" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 03. VALUATION */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
                    <div className="bg-white/5 border border-white/5 p-8 rounded-[40px] shadow-inner text-center space-y-3 group-hover:bg-white/[0.04] transition-all">
                        <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.5em]">Price Strategy</p>
                        <div className="flex items-center justify-center gap-3">
                            <IndianRupee size={18} className="text-orange-500"/>
                            <input name="pricePerSeat" value={formData.pricePerSeat} onChange={handleChange} required type="number" className="bg-transparent w-20 text-center text-4xl font-black text-white outline-none italic tracking-tighter" placeholder="00" />
                        </div>
                    </div>
                    <div className="bg-white/5 border border-white/5 p-8 rounded-[40px] shadow-inner text-center space-y-3 group-hover:bg-white/[0.04] transition-all">
                        <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.5em]">Seat Matrix</p>
                        <div className="flex items-center justify-center gap-3">
                            <Users size={18} className="text-orange-500"/>
                            <input name="seatsAvailable" value={formData.seatsAvailable} onChange={handleChange} required type="number" className="bg-transparent w-20 text-center text-4xl font-black text-white outline-none italic tracking-tighter" />
                        </div>
                    </div>
                    <div className="bg-white/5 border border-white/5 p-8 rounded-[40px] shadow-inner text-center space-y-3 group-hover:bg-white/[0.04] transition-all">
                        <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.5em]">Fleet Code</p>
                        <div className="flex items-center justify-center gap-3">
                            <Car size={18} className="text-orange-500"/>
                            <input name="plateNumber" value={formData.plateNumber} onChange={handleChange} required className="bg-transparent w-full text-center text-sm font-black uppercase text-white outline-none tracking-widest" placeholder="UK 13 TA..." />
                        </div>
                    </div>
                </div>
              </div>
            </div>
          </div>

          {/* --- RIGHT: MEDIA & COMMS MODULE (4 COLS) --- */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-white/[0.02] border border-white/5 rounded-[60px] p-8 backdrop-blur-3xl shadow-3xl space-y-12">
              
              <div className="space-y-8">
                <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                    <ImageIcon size={16} className="text-orange-600"/>
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] italic">Media Dashboard</p>
                </div>
                
                <div className="relative group h-64 cursor-pointer">
                  <input type="file" multiple accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
                  <div className="w-full h-full bg-black/40 border-2 border-dashed border-white/10 rounded-[45px] flex flex-col items-center justify-center gap-5 group-hover:border-orange-600 group-hover:bg-orange-600/[0.02] transition-all duration-500">
                    <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center group-hover:bg-orange-600 group-hover:rotate-12 transition-all duration-500 shadow-2xl">
                        <UploadCloud size={28} className="text-white/20 group-hover:text-white" />
                    </div>
                    <div className="text-center px-6">
                        <p className="text-white font-black text-[10px] uppercase tracking-widest">Transmit Media</p>
                        <p className="text-white/10 text-[8px] font-bold uppercase mt-2">Max Payload: 5 Units</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <AnimatePresence>
                      {previews.map((url, index) => (
                      <motion.div key={index} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="relative aspect-square">
                          <img src={url} className="w-full h-full object-cover rounded-[22px] border border-white/10 shadow-2xl" alt="preview" />
                          <button type="button" onClick={() => removeImage(index)} className="absolute -top-1.5 -right-1.5 bg-red-600 text-white p-1.5 rounded-full shadow-2xl z-30 hover:scale-125 transition-transform"><X size={10} /></button>
                      </motion.div>
                      ))}
                  </AnimatePresence>
                </div>
              </div>

              <div className="space-y-4 pt-4">
                  <label className="text-[9px] font-black text-white/20 uppercase tracking-[0.5em] ml-4 italic">Encrypted Comms Line</label>
                  <div className="relative group">
                    <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-orange-600 group-focus-within:animate-bounce" size={16}/>
                    <input name="contactNumber" value={formData.contactNumber} onChange={handleChange} required placeholder="WHATSAPP TERMINAL" className="w-full bg-black/40 border border-white/10 p-6 pl-16 rounded-[30px] outline-none focus:border-orange-500 font-black text-xs tracking-widest text-white shadow-inner" />
                  </div>
              </div>

              <div className="bg-orange-600/5 border border-orange-600/10 p-8 rounded-[45px] relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-orange-600 opacity-50"></div>
                  <div className="flex items-center gap-3 text-orange-500 uppercase font-black text-[9px] tracking-[0.4em] mb-3">
                    <ShieldCheck size={16} className="animate-pulse"/> Safety Protocol
                  </div>
                  <p className="text-white/30 text-[9px] leading-relaxed italic uppercase font-bold tracking-tight">Geographic coordinates will be synthesized for route visualization. Verify all hub names before transmission.</p>
              </div>
            </div>
          </div>

          {/* --- FINAL SUBMISSION TERMINAL --- */}
          <div className="lg:col-span-12 pt-6">
            <button disabled={loading} type="submit" className="w-full bg-orange-600 hover:bg-white hover:text-black text-white p-10 rounded-[50px] font-black text-[15px] uppercase tracking-[0.8em] transition-all duration-700 flex items-center justify-center gap-8 disabled:opacity-20 active:scale-[0.99] shadow-[0_40px_100px_rgba(234,88,12,0.2)] group overflow-hidden relative border border-orange-500/20">
              {/* Shimmer Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
              
              {loading ? (
                <div className="flex items-center gap-4 font-black italic">
                   <Loader2 className="animate-spin" />
                   DATA STREAMING...
                </div>
              ) : (
                <div className="flex items-center gap-6">
                   <Zap size={24} className="fill-current animate-pulse"/> 
                   INITIALIZE FLEET DEPLOYMENT
                   <ArrowRight className="group-hover:translate-x-3 transition-transform duration-500" />
                </div>
              )}
            </button>
            <p className="text-center mt-8 text-[8px] font-black text-white/10 uppercase tracking-[1em]">Secure End-to-End Encryption Enabled</p>
          </div>
        </form>
      </motion.div>

      {/* --- SYSTEM SCANNER LINE --- */}
      <motion.div 
        animate={{ y: [0, 1000, 0] }} 
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        className="fixed left-0 right-0 h-[1px] bg-orange-600/20 z-[100] blur-sm pointer-events-none"
      />
    </div>
  );
};

export default AddTransport;