import API from "../utils/api";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Car, MapPin, IndianRupee, Users, ShieldCheck, Navigation, Loader2, Image as ImageIcon, X, Phone, User as UserIcon } from 'lucide-react';

const AddTransport = () => {
  const [formData, setFormData] = useState({
    model: '', // maps to vehicleName
    number: '', // vehicleNumber
    driverName: '', // New field
    routeFrom: '', // New field
    routeTo: '', // New field
    pricePerSeat: '', // New field
    seatsAvailable: '1', // New field
    location: 'Guptakashi',
    contact: ''
  });

  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
    if (images.length === 0) return alert("Bhai, kam se kam ek photo toh dalo gaadi ki!");
    
    setLoading(true);
    const token = localStorage.getItem("token");

    const data = new FormData();
    // ✅ SYNCED WITH YOUR BACKEND KEYS
    data.append("vehicleName", formData.model);
    data.append("vehicleNumber", formData.number);
    data.append("driverName", formData.driverName);
    data.append("routeFrom", formData.routeFrom);
    data.append("routeTo", formData.routeTo);
    data.append("pricePerSeat", formData.pricePerSeat);
    data.append("seatsAvailable", formData.seatsAvailable);
    data.append("location", formData.location);
    data.append("contactNumber", formData.contact);
    
    images.forEach((file) => {
      data.append("images", file);
    });

    try {
      const response = await API.post("/transport/add", data, {
        headers: { 
          "Content-Type": "multipart/form-data",
          "Authorization": `Bearer ${token}` 
        }
      });

      if (response.data) {
        alert("Vehicle Registered! Admin approval ka wait karo. 🚕");
        setFormData({ model: '', number: '', driverName: '', routeFrom: '', routeTo: '', pricePerSeat: '', seatsAvailable: '1', location: 'Guptakashi', contact: '' });
        setImages([]);
        setPreviews([]);
      }
    } catch (error) {
      alert(error.response?.data?.message || "Access Denied: Please login first.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen pt-40 pb-20 px-8">
      <img src="https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=2500" className="fixed inset-0 w-full h-full object-cover z-[-1]" alt="BG" />
      <div className="fixed inset-0 bg-black/75 backdrop-blur-[6px] z-[-1]"></div>

      <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[80px] p-12 lg:p-16 shadow-2xl">
        <div className="mb-12">
          <h2 className="text-6xl lg:text-7xl font-black text-white tracking-tighter uppercase leading-none italic text-glow">REGISTER <span className="text-orange-600">RIDE.</span></h2>
          <p className="text-white/30 font-bold text-[10px] tracking-[0.5em] uppercase mt-6 ml-2 italic">Secured Fleet Transmission</p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20">
          <div className="space-y-8">
            {/* Row 1: Model & Driver */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <label className="flex items-center gap-4 text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-2"><Car size={16}/> Vehicle Model</label>
                    <input name="model" value={formData.model} onChange={handleChange} required type="text" placeholder="Innova Crysta" className="w-full bg-white/5 border border-white/10 p-6 rounded-[35px] font-black text-white outline-none focus:border-orange-600 transition-all placeholder:text-white/10" />
                </div>
                <div className="space-y-4">
                    <label className="flex items-center gap-4 text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-2"><UserIcon size={16}/> Driver Name</label>
                    <input name="driverName" value={formData.driverName} onChange={handleChange} required type="text" placeholder="Shardul Aswal" className="w-full bg-white/5 border border-white/10 p-6 rounded-[35px] font-black text-white outline-none focus:border-orange-600 transition-all placeholder:text-white/10" />
                </div>
            </div>

            {/* Row 2: Route From & To */}
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="flex items-center gap-4 text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-2"><MapPin size={16}/> Route From</label>
                <input name="routeFrom" value={formData.routeFrom} onChange={handleChange} required type="text" placeholder="Rishikesh" className="w-full bg-white/5 border border-white/10 p-6 rounded-[35px] font-black text-white outline-none focus:border-orange-600 transition-all" />
              </div>
              <div className="space-y-4">
                <label className="flex items-center gap-4 text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-2"><MapPin size={16}/> Route To</label>
                <input name="routeTo" value={formData.routeTo} onChange={handleChange} required type="text" placeholder="Kedarnath" className="w-full bg-white/5 border border-white/10 p-6 rounded-[35px] font-black text-white outline-none focus:border-orange-600 transition-all" />
              </div>
            </div>

            {/* Row 3: Price/Seat & Seats Available */}
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="flex items-center gap-4 text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-2"><IndianRupee size={16}/> Price / Seat</label>
                <input name="pricePerSeat" value={formData.pricePerSeat} onChange={handleChange} required type="number" placeholder="800" className="w-full bg-white/5 border border-white/10 p-6 rounded-[35px] font-black text-white outline-none focus:border-orange-600 transition-all" />
              </div>
              <div className="space-y-4">
                <label className="flex items-center gap-4 text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-2"><Users size={16}/> Seats Avail.</label>
                <input name="seatsAvailable" value={formData.seatsAvailable} onChange={handleChange} required type="number" placeholder="7" className="w-full bg-white/5 border border-white/10 p-6 rounded-[35px] font-black text-white outline-none focus:border-orange-600 transition-all" />
              </div>
            </div>

            {/* Row 4: Plate No & Contact */}
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="flex items-center gap-4 text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-2"><Navigation size={16}/> Plate Number</label>
                <input name="number" value={formData.number} onChange={handleChange} required type="text" placeholder="UK 13 TA 1234" className="w-full bg-white/5 border border-white/10 p-6 rounded-[35px] font-black text-white outline-none focus:border-orange-600 transition-all" />
              </div>
              <div className="space-y-4">
                <label className="flex items-center gap-4 text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-2"><Phone size={16}/> Contact</label>
                <input name="contact" value={formData.contact} onChange={handleChange} required type="text" placeholder="+91..." className="w-full bg-white/5 border border-white/10 p-6 rounded-[35px] font-black text-white outline-none focus:border-orange-600 transition-all" />
              </div>
            </div>
          </div>

          <div className="space-y-10">
             <div className="space-y-4">
                <label className="flex items-center gap-4 text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-2"><ImageIcon size={16}/> Vehicle Photos</label>
                <div className="relative group">
                  <input type="file" multiple accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
                  <div className="w-full bg-white/[0.02] border-4 border-dashed border-white/5 p-14 rounded-[50px] text-center group-hover:border-orange-600 transition-all">
                    <p className="text-white/20 font-black text-[11px] tracking-[0.4em] uppercase text-center">Add Fleet Images</p>
                  </div>
                </div>
             </div>

             <div className="grid grid-cols-3 gap-6">
                {previews.map((url, index) => (
                  <div key={index} className="relative aspect-square">
                    <img src={url} className="w-full h-full object-cover rounded-[30px] border-2 border-white/10 shadow-2xl" alt="preview" />
                    <button type="button" onClick={() => removeImage(index)} className="absolute -top-3 -right-3 bg-red-600 text-white p-2 rounded-full shadow-2xl z-30"><X size={16} /></button>
                  </div>
                ))}
             </div>
          </div>

          <div className="lg:col-span-2 pt-6">
            <button disabled={loading} type="submit" className="w-full bg-orange-600 text-white p-8 rounded-[40px] font-black text-[13px] uppercase tracking-[0.6em] shadow-2xl transition-all flex items-center justify-center gap-6 disabled:opacity-20 hover:bg-white hover:text-black active:scale-95">
              {loading ? <Loader2 className="animate-spin" /> : <ShieldCheck size={24}/>}
              {loading ? "TRANSMITTING..." : "INITIALIZE DEPLOYMENT"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default AddTransport;