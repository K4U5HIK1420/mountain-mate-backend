
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Hotel,
  IndianRupee,
  Plus,
  Minus,
  Loader2,
  Edit3,
  X,
  MapPin,
  Activity,
  Layers,
  ArrowUpRight,
} from "lucide-react";
import { useNotify } from "../context/NotificationContext";
import { useAuth } from "../context/AuthContext";
import API from "../utils/api";

const hotelDocumentFields = [
  { key: "ownerPhoto", label: "Hotel Owner Photo" },
  { key: "ownerAadhaarDoc", label: "Owner Aadhaar Scan" },
  { key: "ownerPanDoc", label: "Owner PAN Scan" },
  { key: "propertyRegistrationDoc", label: "Property Registration / Lease" },
  { key: "tradeLicenseDoc", label: "Trade License" },
  { key: "gstCertificateDoc", label: "GST Certificate" },
  { key: "fireSafetyDoc", label: "Fire Safety Certificate" },
];

const amenityKeys = [
  "wifi",
  "parking",
  "breakfast",
  "hotWater",
  "roomService",
  "mountainView",
  "restaurant",
  "powerBackup",
];

function parseAmenities(value) {
  try {
    if (Array.isArray(value)) return value;
    return JSON.parse(value || "[]");
  } catch {
    return [];
  }
}

const ManageStays = () => {
  const { notify } = useNotify();
  const { user } = useAuth();
  const [myHotels, setMyHotels] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [editAmenities, setEditAmenities] = useState({});
  const [editDocuments, setEditDocuments] = useState({});
  const [newImages, setNewImages] = useState([]);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (user) fetchMyStays();
  }, [user]);

  const fetchMyStays = async () => {
    try {
      setLoading(true);
      const res = await API.get("/hotel/my-hotels");
      const data = res.data.data || res.data || [];
      setMyHotels(data);
    } catch {
      notify("Failed to link property vault", "error");
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (hotel) => {
    const compliance = hotel.complianceDetails || {};
    const selectedAmenities = parseAmenities(hotel.amenities);
    const amenitiesState = amenityKeys.reduce((acc, key) => {
      acc[key] = selectedAmenities.includes(key);
      return acc;
    }, {});

    setSelectedHotel(hotel);
    setEditFormData({
      ...hotel,
      propertyType: hotel.propertyType || "Hotel",
      guestsPerRoom: hotel.guestsPerRoom || 2,
      availabilityStatus: hotel.availabilityStatus || "Available now",
      ownerAadhaarNumber: compliance.ownerAadhaarNumber || "",
      ownerPanNumber: compliance.ownerPanNumber || "",
      gstNumber: compliance.gstNumber || "",
      registrationNumber: compliance.registrationNumber || "",
      tradeLicenseNumber: compliance.tradeLicenseNumber || "",
      fireSafetyCertificateNumber: compliance.fireSafetyCertificateNumber || "",
      bankAccountHolder: compliance.bankAccountHolder || "",
      bankAccountNumber: compliance.bankAccountNumber || "",
      ifscCode: compliance.ifscCode || "",
      contactNumber: hotel.contactNumber || "",
      landmark: hotel.landmark || "",
    });

    setEditAmenities(amenitiesState);
    setEditDocuments(hotelDocumentFields.reduce((acc, item) => ({ ...acc, [item.key]: null }), {}));
    setNewImages([]);
    setIsEditModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAmenityToggle = (amenity) => {
    setEditAmenities((prev) => ({ ...prev, [amenity]: !prev[amenity] }));
  };

  const handleDocumentChange = (key, file) => {
    setEditDocuments((prev) => ({ ...prev, [key]: file || null }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setNewImages((prev) => [...prev, ...files]);
  };

  const handleFullUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);

    try {
      const data = new FormData();
      const payload = { ...editFormData };

      const textKeys = [
        "propertyType",
        "location",
        "landmark",
        "description",
        "contactNumber",
        "distance",
        "pricePerNight",
        "roomsAvailable",
        "guestsPerRoom",
        "availabilityStatus",
        "ownerAadhaarNumber",
        "ownerPanNumber",
        "gstNumber",
        "registrationNumber",
        "tradeLicenseNumber",
        "fireSafetyCertificateNumber",
        "bankAccountHolder",
        "bankAccountNumber",
        "ifscCode",
      ];

      textKeys.forEach((key) => data.append(key, payload[key] ?? ""));
      data.append("amenities", JSON.stringify(Object.keys(editAmenities).filter((key) => editAmenities[key])));

      newImages.forEach((file) => data.append("images", file));
      Object.entries(editDocuments).forEach(([key, file]) => {
        if (file) data.append(key, file);
      });

      await API.patch(`/hotel/update/${selectedHotel._id}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      notify("Property synced successfully.", "success");
      setIsEditModalOpen(false);
      fetchMyStays();
    } catch {
      notify("Update failed.", "error");
    } finally {
      setUpdating(false);
    }
  };

  const handleQuickRoomUpdate = async (id, currentRooms, change) => {
    const newCount = currentRooms + change;
    if (newCount < 0) return;

    setMyHotels((prev) => prev.map((h) => (h._id === id ? { ...h, roomsAvailable: newCount } : h)));

    try {
      await API.patch(`/hotel/update/${id}`, { roomsAvailable: newCount });
      notify(`Inventory set to ${newCount}`, "success");
    } catch {
      setMyHotels((prev) => prev.map((h) => (h._id === id ? { ...h, roomsAvailable: currentRooms } : h)));
      notify("Sync failed. Check connection.", "error");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] gap-4">
        <div className="relative">
          <Loader2 className="text-orange-600 animate-spin" size={60} />
          <div className="absolute inset-0 bg-orange-600/20 blur-xl animate-pulse" />
        </div>
        <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.6em] animate-pulse">Establishing Property Uplink...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#050505] pt-40 pb-20 px-6 overflow-hidden">
      <div className="fixed inset-0 z-0">
        <img src="https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=2500" className="w-full h-full object-cover opacity-10 grayscale" alt="BG" />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/95 to-[#050505]" />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8 border-l-4 border-orange-600 pl-10">
          <div>
            <h1 className="text-6xl md:text-8xl font-black text-white uppercase italic tracking-tighter leading-[0.8]">
              STAY <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-800">VAULT.</span>
            </h1>
            <p className="text-white/30 font-bold text-[10px] tracking-[0.4em] uppercase mt-6 flex items-center gap-3 italic">
              <div className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
              Verified Partner: {user?.email}
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 px-10 py-6 rounded-[35px] backdrop-blur-3xl shadow-2xl">
            <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Total Assets</p>
            <p className="text-5xl font-black italic text-white leading-none">{myHotels.length < 10 ? `0${myHotels.length}` : myHotels.length}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {myHotels.length > 0 ? (
            myHotels.map((hotel) => (
              <motion.div
                key={hotel._id}
                whileHover={{ y: -10, scale: 1.01 }}
                className="bg-white/[0.02] border border-white/5 p-10 rounded-[60px] backdrop-blur-3xl shadow-3xl group relative overflow-hidden transition-all duration-700 hover:border-orange-500/30"
              >
                <div className="absolute top-0 right-0 w-40 h-40 bg-orange-600/10 blur-[100px] group-hover:bg-orange-600/20 transition-all" />

                <div className="flex justify-between items-start mb-12">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center text-orange-500 border border-white/10 group-hover:bg-orange-600 group-hover:text-white transition-all shadow-2xl duration-500">
                      <Hotel size={28} />
                    </div>
                    <div>
                      <h3 className="text-3xl font-black text-white uppercase italic leading-none group-hover:text-orange-500 transition-colors">{hotel.hotelName}</h3>
                      <p className="text-white/20 text-[9px] font-black tracking-widest uppercase mt-3 italic flex items-center gap-2">
                        <MapPin size={10} className="text-orange-500" /> {hotel.location}
                      </p>
                    </div>
                  </div>

                  <div className={`px-5 py-2.5 rounded-2xl text-[8px] font-black uppercase tracking-widest border flex items-center gap-3 shadow-lg ${hotel.status === "approved" ? "bg-green-500/5 text-green-500 border-green-500/20" : "bg-orange-500/5 text-orange-500 border-orange-500/20"}`}>
                    <div className={`w-2 h-2 rounded-full ${hotel.status === "approved" ? "bg-green-500 animate-pulse" : "bg-orange-500"}`} />
                    {hotel.status === "approved" ? "Active" : "Pending"}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-10">
                  <div className="bg-white/[0.03] border border-white/5 p-8 rounded-[40px] flex flex-col items-center justify-center text-center">
                    <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-5">Current Inventory</p>
                    <div className="flex items-center gap-8">
                      <button onClick={() => handleQuickRoomUpdate(hotel._id, hotel.roomsAvailable, -1)} className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/40 hover:bg-red-600 hover:text-white transition-all active:scale-90 border border-white/10"><Minus size={16} /></button>
                      <span className="text-5xl font-black text-white italic drop-shadow-2xl">{hotel.roomsAvailable}</span>
                      <button onClick={() => handleQuickRoomUpdate(hotel._id, hotel.roomsAvailable, 1)} className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/40 hover:bg-green-600 hover:text-white transition-all active:scale-90 border border-white/10"><Plus size={16} /></button>
                    </div>
                  </div>

                  <div className="bg-white/[0.03] border border-white/5 p-8 rounded-[40px] flex flex-col items-center justify-center text-center">
                    <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-5">Base Rate</p>
                    <div className="flex items-center gap-2"><IndianRupee size={22} className="text-orange-500" /><span className="text-5xl font-black text-white italic leading-none tracking-tighter">{hotel.pricePerNight}</span></div>
                  </div>
                </div>

                <button onClick={() => openEditModal(hotel)} className="w-full bg-white/[0.02] border border-white/5 py-7 rounded-[35px] font-black text-[10px] uppercase tracking-[0.5em] transition-all flex items-center justify-center gap-4 hover:bg-orange-600 hover:text-white shadow-2xl">
                  <Edit3 size={18} /> Modify Asset Specs
                </button>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-40 text-center border-2 border-dashed border-white/5 rounded-[80px] bg-white/[0.01]">
              <Activity size={48} className="mx-auto text-white/5 mb-6 animate-pulse" />
              <p className="text-white/10 text-xl font-black uppercase tracking-[1em] italic">No Properties Linked to Identity</p>
            </div>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsEditModalOpen(false)} className="absolute inset-0 bg-black/90 backdrop-blur-3xl" />

            <motion.div initial={{ scale: 0.9, opacity: 0, rotateX: 20 }} animate={{ scale: 1, opacity: 1, rotateX: 0 }} exit={{ scale: 0.9, opacity: 0, rotateX: 20 }} className="relative w-full max-w-5xl bg-[#080808] border border-white/10 rounded-[42px] shadow-[0_50px_100px_rgba(0,0,0,1)] overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-8 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-orange-600/10 to-transparent">
                <div>
                  <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">RECONFIGURE <span className="text-orange-500">ASSET.</span></h2>
                  <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.5em] mt-4 flex items-center gap-3 italic"><Layers size={14} className="text-orange-600" /> Pushing Updates to Global Mesh</p>
                </div>
                <button onClick={() => setIsEditModalOpen(false)} className="w-14 h-14 rounded-full bg-white/5 text-white/20 hover:bg-orange-600 hover:text-white transition-all flex items-center justify-center border border-white/10"><X size={26} /></button>
              </div>

              <form onSubmit={handleFullUpdate} className="p-8 space-y-10 overflow-y-auto">
                <div className="space-y-6">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] ml-2 italic">Property Identity</label>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <input name="hotelName" value={editFormData.hotelName || ""} readOnly className="bg-white/5 border border-white/10 p-4 rounded-[16px] text-white/60 font-black text-[11px] uppercase tracking-widest outline-none" />
                    <select name="propertyType" value={editFormData.propertyType || "Hotel"} onChange={handleInputChange} className="bg-white/5 border border-white/10 p-4 rounded-[16px] text-white font-black text-[11px] uppercase tracking-widest outline-none">
                      {["Hotel", "Homestay", "Lodge"].map((type) => <option key={type} value={type} className="bg-[#111]">{type}</option>)}
                    </select>
                    <input name="location" value={editFormData.location || ""} onChange={handleInputChange} placeholder="Tactical Zone" className="bg-white/5 border border-white/10 p-4 rounded-[16px] text-white font-black text-[11px] uppercase tracking-widest outline-none" />
                    <input name="landmark" value={editFormData.landmark || ""} onChange={handleInputChange} placeholder="Landmark" className="bg-white/5 border border-white/10 p-4 rounded-[16px] text-white font-black text-[11px] uppercase tracking-widest outline-none" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <input name="pricePerNight" value={editFormData.pricePerNight || ""} onChange={handleInputChange} type="number" placeholder="Rate / Night" className="bg-white/5 border border-white/10 p-4 rounded-[16px] text-white font-black text-[11px] uppercase tracking-widest outline-none" />
                    <input name="roomsAvailable" value={editFormData.roomsAvailable || ""} onChange={handleInputChange} type="number" placeholder="Units" className="bg-white/5 border border-white/10 p-4 rounded-[16px] text-white font-black text-[11px] uppercase tracking-widest outline-none" />
                    <input name="guestsPerRoom" value={editFormData.guestsPerRoom || ""} onChange={handleInputChange} type="number" placeholder="Max Guests" className="bg-white/5 border border-white/10 p-4 rounded-[16px] text-white font-black text-[11px] uppercase tracking-widest outline-none" />
                    <input name="contactNumber" value={editFormData.contactNumber || ""} onChange={handleInputChange} placeholder="Contact Line" className="bg-white/5 border border-white/10 p-4 rounded-[16px] text-white font-black text-[11px] uppercase tracking-widest outline-none" />
                    <select name="availabilityStatus" value={editFormData.availabilityStatus || "Available now"} onChange={handleInputChange} className="bg-white/5 border border-white/10 p-4 rounded-[16px] text-white font-black text-[11px] uppercase tracking-widest outline-none">
                      {["Available now", "Available this week", "Temporarily closed"].map((opt) => <option key={opt} value={opt} className="bg-[#111]">{opt}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-6">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] ml-2 italic">Facility Infrastructure</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {amenityKeys.map((key) => (
                      <button key={key} type="button" onClick={() => handleAmenityToggle(key)} className={`rounded-[14px] border p-4 text-[10px] font-black uppercase tracking-[0.16em] transition-all ${editAmenities[key] ? "border-orange-500/40 bg-orange-500/20 text-orange-200" : "border-white/10 bg-white/5 text-white/40 hover:text-white"}`}>
                        {key.replace(/([A-Z])/g, " $1")}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] ml-2 italic">Property Narrative</label>
                  <textarea name="description" value={editFormData.description || ""} onChange={handleInputChange} rows={4} className="w-full bg-white/5 border border-white/10 p-6 rounded-[20px] text-white/70 font-medium text-sm outline-none resize-none" />
                </div>

                <div className="space-y-6">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] ml-2 italic">Owner & Legal Compliance</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      ["ownerAadhaarNumber", "Owner Aadhaar Number"],
                      ["ownerPanNumber", "Owner PAN Number"],
                      ["gstNumber", "GST Number"],
                      ["registrationNumber", "Registration Number"],
                      ["tradeLicenseNumber", "Trade License Number"],
                      ["fireSafetyCertificateNumber", "Fire Safety Certificate No."],
                      ["bankAccountHolder", "Account Holder"],
                      ["bankAccountNumber", "Account Number"],
                      ["ifscCode", "IFSC Code"],
                    ].map(([name, placeholder]) => (
                      <input key={name} name={name} value={editFormData[name] || ""} onChange={handleInputChange} placeholder={placeholder} className="bg-white/5 border border-white/10 p-4 rounded-[16px] text-white font-black text-[11px] uppercase tracking-widest outline-none" />
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] ml-2 italic">Verification Documents</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {hotelDocumentFields.map((item) => (
                      <label key={item.key} className="flex cursor-pointer items-center justify-between gap-4 rounded-[16px] border border-white/10 bg-black/30 px-4 py-4 hover:border-orange-500/40">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/60">{item.label}</p>
                          <p className="text-xs text-white/35">{editDocuments[item.key]?.name || "Upload JPG, PNG, WEBP or PDF"}</p>
                          {selectedHotel?.verificationDocuments?.[item.key] ? (
                            <a href={selectedHotel.verificationDocuments[item.key]} target="_blank" rel="noreferrer" className="text-[11px] text-orange-300 underline" onClick={(e) => e.stopPropagation()}>
                              View current file
                            </a>
                          ) : <p className="text-[11px] text-white/30">No file uploaded</p>}
                        </div>
                        <span className="rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-orange-300">{editDocuments[item.key] ? "Change" : "Select"}</span>
                        <input type="file" accept=".pdf,image/*" className="hidden" onChange={(e) => handleDocumentChange(item.key, e.target.files?.[0] || null)} />
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] ml-2 italic">Visual Assets</label>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {(selectedHotel?.images || []).map((src, idx) => (
                      <a key={`${src}-${idx}`} href={src} target="_blank" rel="noreferrer" className="overflow-hidden rounded-2xl border border-white/10">
                        <img src={src} alt={`hotel-${idx}`} className="h-28 w-full object-cover" />
                      </a>
                    ))}
                    {(!selectedHotel?.images || selectedHotel.images.length === 0) ? (
                      <div className="col-span-2 md:col-span-4 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-5 text-center text-white/40 text-sm">No existing photos uploaded</div>
                    ) : null}
                  </div>

                  <label className="flex cursor-pointer items-center justify-between gap-4 rounded-[16px] border border-white/10 bg-black/30 px-4 py-4 hover:border-orange-500/40">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">Add New Images</p>
                      <p className="mt-1 text-xs text-white/35">{newImages.length ? `${newImages.length} file(s) selected` : "Add more property images"}</p>
                    </div>
                    <span className="rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-orange-300">Select</span>
                    <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
                  </label>
                </div>

                <button disabled={updating} type="submit" className="w-full bg-orange-600 text-white font-black p-7 rounded-[20px] uppercase tracking-[0.4em] text-[12px] hover:bg-white hover:text-black transition-all flex items-center justify-center gap-4 disabled:opacity-50">
                  {updating ? <Loader2 className="animate-spin" size={20} /> : <ArrowUpRight size={20} />}
                  {updating ? "SYNCHRONIZING..." : "OVERWRITE GLOBAL DATA"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ManageStays;
