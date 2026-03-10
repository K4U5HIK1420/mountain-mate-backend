import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Car, MapPin, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

const ManageRides = () => {
  // Mock data: In real app, fetch this from your DB based on logged-in owner
  const [myRides, setMyRides] = useState([
    { id: 1, model: "Bolero 4x4", plate: "UK 13 TA 1234", location: "Guptakashi", status: "Available" },
    { id: 2, model: "Innova Crysta", plate: "UK 07 TB 5678", location: "Dehradun", status: "On Trip" }
  ]);

  const locations = ["Guptakashi", "Sonprayag", "Phata", "Rudraprayag", "Dehradun", "Rishikesh"];

  const updateLocation = (id, newLoc) => {
    setMyRides(myRides.map(ride => ride.id === id ? { ...ride, location: newLoc } : ride));
    // Yahan Backend API call hogi: axios.patch(`/api/rides/${id}`, { location: newLoc })
    alert(`Location updated to ${newLoc}`);
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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto space-y-10"
      >
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-5xl font-black text-white tracking-tighter uppercase leading-none">
              MANAGE <span className="text-orange-500 italic">YOUR FLEET.</span>
            </h1>
            <p className="text-white/40 font-black text-[10px] tracking-[0.3em] uppercase mt-4">Update your vehicle's live location and availability</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {myRides.map((ride) => (
            <div key={ride.id} className="bg-white/10 backdrop-blur-3xl border border-white/20 rounded-[50px] p-10 flex flex-col gap-8 shadow-2xl group hover:border-orange-500/50 transition-all">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-5">
                  <div className="p-5 bg-white/5 rounded-[25px] text-orange-500 group-hover:bg-orange-600 group-hover:text-white transition-all">
                    <Car size={32} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white tracking-tight">{ride.model}</h3>
                    <p className="text-white/30 text-[10px] font-black tracking-widest uppercase">{ride.plate}</p>
                  </div>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${ride.status === 'Available' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-orange-500/10 text-orange-500 border-orange-500/20'}`}>
                  {ride.status}
                </div>
              </div>

              <div className="space-y-4">
                <label className="flex items-center gap-2 text-[9px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">
                  <MapPin size={12}/> Update Current Location
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {locations.map((loc) => (
                    <button 
                      key={loc}
                      onClick={() => updateLocation(ride.id, loc)}
                      className={`py-3 px-2 rounded-2xl text-[9px] font-black uppercase tracking-tighter transition-all border ${ride.location === loc ? 'bg-white text-black border-white' : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'}`}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              </div>

              <button className="w-full bg-white/5 hover:bg-white hover:text-black text-white py-5 rounded-[25px] font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3">
                <RefreshCw size={16}/> Sync with Server
              </button>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default ManageRides;