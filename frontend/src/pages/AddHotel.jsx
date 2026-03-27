import API from "../utils/api";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNotify } from "../context/NotificationContext";
import {
  Hotel,
  MapPin,
  IndianRupee,
  ShieldCheck,
  Loader2,
  ImagePlus,
  X,
  Info,
  Users,
  Phone,
  User,
  BookOpen,
  CheckCircle2,
  Navigation,
  Landmark,
  FileBadge2,
  CreditCard,
  Building2,
} from "lucide-react";

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

const createEmptyForm = () => ({
  hotelName: "",
  propertyType: "Hotel",
  location: "Guptakashi",
  landmark: "",
  pricePerNight: "",
  roomsAvailable: "",
  guestsPerRoom: "2",
  distance: "0",
  description: "",
  ownerName: "",
  contactNumber: "",
  mapsLink: "",
  cancellationPolicy: "",
  petPolicy: "Not Allowed",
  smokingPolicy: "Prohibited",
  ownerAadhaarNumber: "",
  ownerPanNumber: "",
  gstNumber: "",
  registrationNumber: "",
  tradeLicenseNumber: "",
  fireSafetyCertificateNumber: "",
  bankAccountHolder: "",
  bankAccountNumber: "",
  ifscCode: "",
});

const createEmptyDocs = () =>
  hotelDocumentFields.reduce((acc, item) => {
    acc[item.key] = null;
    return acc;
  }, {});

const AddHotel = () => {
  const { notify } = useNotify();
  const [formData, setFormData] = useState(createEmptyForm);
  const [amenities, setAmenities] = useState(
    amenityKeys.reduce((acc, key) => {
      acc[key] = false;
      return acc;
    }, {})
  );
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [documents, setDocuments] = useState(createEmptyDocs);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAmenityChange = (amenity) => {
    setAmenities((prev) => ({ ...prev, [amenity]: !prev[amenity] }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setImages((prev) => [...prev, ...files]);
    setPreviews((prev) => [...prev, ...files.map((file) => URL.createObjectURL(file))]);
  };

  const handleDocumentChange = (key, file) => {
    setDocuments((prev) => ({ ...prev, [key]: file || null }));
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setFormData(createEmptyForm());
    setImages([]);
    setPreviews([]);
    setDocuments(createEmptyDocs());
    setAmenities(
      amenityKeys.reduce((acc, key) => {
        acc[key] = false;
        return acc;
      }, {})
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.hotelName || !formData.pricePerNight) {
      return notify("Hotel name and nightly rate are required.", "error");
    }

    if (!images.length) {
      return notify("Add at least one property image.", "error");
    }

    if (!documents.ownerPhoto || !documents.ownerAadhaarDoc || !documents.propertyRegistrationDoc) {
      return notify("Owner photo, owner Aadhaar, and property registration proof are required.", "error");
    }

    setLoading(true);
    const data = new FormData();

    Object.entries(formData).forEach(([key, value]) => {
      data.append(key, value);
    });

    data.append("amenities", JSON.stringify(Object.keys(amenities).filter((key) => amenities[key])));
    images.forEach((file) => data.append("images", file));
    Object.entries(documents).forEach(([key, file]) => {
      if (file) data.append(key, file);
    });

    try {
      const response = await API.post("/hotel/add", data);
      if (response.data) {
        notify("Property synced with compliance documents. Admin review pending.", "success");
        resetForm();
      }
    } catch (error) {
      notify(error.response?.data?.message || "Check the new compliance fields and try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden px-4 pb-20 pt-32 font-sans md:px-8">
      <img src="https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=2500" className="fixed inset-0 z-[-1] h-full w-full object-cover" alt="BG" />
      <div className="fixed inset-0 z-[-1] bg-black/85 backdrop-blur-[8px]" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-6xl rounded-[40px] border border-white/10 bg-white/[0.02] p-6 shadow-3xl backdrop-blur-3xl md:rounded-[60px] md:p-16"
      >
        <div className="mb-12 border-b border-white/10 pb-8">
          <h2 className="text-4xl font-black uppercase leading-none tracking-tighter text-white md:text-7xl">
            Register <span className="text-orange-600">Property.</span>
          </h2>
          <p className="mt-5 text-[9px] font-black uppercase tracking-[0.5em] text-white/20 italic">Transmission ID: MM-{Math.floor(Math.random() * 9000)}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-12 md:space-y-16">
          <FormSection title="Property Identity" icon={<Hotel size={16} className="text-orange-500" />}>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-10">
              <Field label="Property Identity" icon={<Hotel size={14} className="text-orange-500" />}>
                <input name="hotelName" value={formData.hotelName} onChange={handleChange} required placeholder="Kedar Valley Resort" className={inputClass} />
              </Field>
              <Field label="Classification" icon={<Info size={14} className="text-orange-500" />}>
                <select name="propertyType" value={formData.propertyType} onChange={handleChange} className={inputClass}>
                  {["Hotel", "Homestay", "Resort", "Guest House", "Camp"].map((type) => (
                    <option key={type} value={type} className="bg-[#111]">
                      {type}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Tactical Zone" icon={<MapPin size={14} className="text-orange-500" />}>
                <select name="location" value={formData.location} onChange={handleChange} className={inputClass}>
                  {["Guptakashi", "Sonprayag", "Phata", "Rudraprayag", "Ukhimath"].map((loc) => (
                    <option key={loc} value={loc} className="bg-[#111]">
                      {loc}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-8">
              <Field label="Rate/Night" icon={<IndianRupee size={12} />}>
                <input name="pricePerNight" type="number" value={formData.pricePerNight} onChange={handleChange} required placeholder="3500" className={inputClass} />
              </Field>
              <Field label="Units" icon={<BookOpen size={12} />}>
                <input name="roomsAvailable" type="number" value={formData.roomsAvailable} onChange={handleChange} required placeholder="10" className={inputClass} />
              </Field>
              <Field label="Max Guests" icon={<Users size={12} />}>
                <input name="guestsPerRoom" type="number" value={formData.guestsPerRoom} onChange={handleChange} className={inputClass} />
              </Field>
              <Field label="Landmark" icon={<Navigation size={12} />}>
                <input name="landmark" value={formData.landmark} onChange={handleChange} placeholder="Near Helipad" className={inputClass} />
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <Field label="Manager Name" icon={<User size={14} />}>
                <input name="ownerName" value={formData.ownerName} onChange={handleChange} required placeholder="Shardul Aswal" className={inputClass} />
              </Field>
              <Field label="Contact Line" icon={<Phone size={14} />}>
                <input name="contactNumber" value={formData.contactNumber} onChange={handleChange} required placeholder="+91 XXXXX XXXXX" className={inputClass} />
              </Field>
            </div>
          </FormSection>

          <FormSection title="Facility Infrastructure" icon={<Building2 size={16} className="text-orange-500" />}>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {amenityKeys.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleAmenityChange(key)}
                  className={`flex items-center gap-4 rounded-2xl border-2 p-5 transition-all ${
                    amenities[key] ? "border-orange-400 bg-orange-600 text-white" : "border-white/5 bg-white/5 text-white/20 hover:border-white/20"
                  }`}
                >
                  <CheckCircle2 size={16} className={amenities[key] ? "opacity-100" : "opacity-20"} />
                  <span className="text-[9px] font-black uppercase tracking-widest">{key.replace(/([A-Z])/g, " $1")}</span>
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <label className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest text-white/40">
                <Landmark size={14} className="text-orange-500" />
                System Narrative
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Brief about hospitality, route relevance, family suitability, parking situation, and onsite support..."
                className="h-40 w-full resize-none rounded-3xl border border-white/10 bg-white/5 p-8 font-bold text-white outline-none focus:border-orange-600"
              />
            </div>
          </FormSection>

          <FormSection title="Owner & Legal Compliance" icon={<FileBadge2 size={16} className="text-orange-500" />}>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <Field label="Owner Aadhaar Number">
                <input name="ownerAadhaarNumber" value={formData.ownerAadhaarNumber} onChange={handleChange} required placeholder="XXXX XXXX XXXX" className={inputClass} />
              </Field>
              <Field label="Owner PAN Number">
                <input name="ownerPanNumber" value={formData.ownerPanNumber} onChange={handleChange} required placeholder="ABCDE1234F" className={inputClass} />
              </Field>
              <Field label="GST Number">
                <input name="gstNumber" value={formData.gstNumber} onChange={handleChange} placeholder="Optional but recommended" className={inputClass} />
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <Field label="Registration Number">
                <input name="registrationNumber" value={formData.registrationNumber} onChange={handleChange} required placeholder="Property / lease registration" className={inputClass} />
              </Field>
              <Field label="Trade License Number">
                <input name="tradeLicenseNumber" value={formData.tradeLicenseNumber} onChange={handleChange} placeholder="Municipal / tourism license" className={inputClass} />
              </Field>
              <Field label="Fire Safety Certificate No.">
                <input name="fireSafetyCertificateNumber" value={formData.fireSafetyCertificateNumber} onChange={handleChange} placeholder="If applicable" className={inputClass} />
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <Field label="Account Holder">
                <input name="bankAccountHolder" value={formData.bankAccountHolder} onChange={handleChange} placeholder="Payout account name" className={inputClass} />
              </Field>
              <Field label="Account Number">
                <input name="bankAccountNumber" value={formData.bankAccountNumber} onChange={handleChange} placeholder="For settlements" className={inputClass} />
              </Field>
              <Field label="IFSC Code" icon={<CreditCard size={14} className="text-orange-500" />}>
                <input name="ifscCode" value={formData.ifscCode} onChange={handleChange} placeholder="SBIN0000001" className={inputClass} />
              </Field>
            </div>
          </FormSection>

          <FormSection title="Verification Documents" icon={<ShieldCheck size={16} className="text-orange-500" />}>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {hotelDocumentFields.map((item) => (
                <DocumentField
                  key={item.key}
                  label={item.label}
                  file={documents[item.key]}
                  onChange={(file) => handleDocumentChange(item.key, file)}
                />
              ))}
            </div>
          </FormSection>

          <FormSection title="Visual Assets" icon={<ImagePlus size={16} className="text-orange-500" />}>
            <div className="flex flex-wrap gap-5">
              <AnimatePresence>
                {previews.map((src, index) => (
                  <motion.div
                    key={src}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5 }}
                    className="group relative h-32 w-32 overflow-hidden rounded-2xl border border-white/10 md:h-40 md:w-40"
                  >
                    <img src={src} className="h-full w-full object-cover" alt="preview" />
                    <button type="button" onClick={() => removeImage(index)} className="absolute right-2 top-2 rounded-full bg-red-600 p-2 shadow-xl transition-all hover:bg-white hover:text-red-600">
                      <X size={12} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>

              <label className="flex h-32 w-32 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/10 transition-all hover:border-orange-600 hover:bg-orange-600/10 group md:h-40 md:w-40">
                <ImagePlus className="text-white/20 group-hover:text-orange-500" size={32} />
                <span className="mt-3 text-[8px] font-black uppercase tracking-widest text-white/20">Upload</span>
                <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
            </div>
          </FormSection>

          <button
            disabled={loading}
            type="submit"
            className="flex w-full items-center justify-center gap-5 rounded-full bg-orange-600 p-8 text-[12px] font-black uppercase tracking-[0.4em] text-white shadow-3xl transition-all hover:bg-white hover:text-black disabled:opacity-50 active:scale-95 md:p-10"
          >
            {loading ? <Loader2 className="animate-spin" /> : <ShieldCheck size={24} />}
            {loading ? "TRANSMITTING DATA..." : "INITIALIZE DEPLOYMENT"}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

function FormSection({ title, icon, children }) {
  return (
    <div className="space-y-8">
      <label className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.4em] text-orange-500 italic">
        {icon}
        {title}
      </label>
      <div className="space-y-8 rounded-[30px] border border-white/5 bg-white/[0.02] p-6 md:p-10">{children}</div>
    </div>
  );
}

function Field({ label, icon, children }) {
  return (
    <div className="space-y-4">
      <label className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest text-white/40">
        {icon}
        {label}
      </label>
      {children}
    </div>
  );
}

function DocumentField({ label, file, onChange }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-[24px] border border-white/10 bg-black/30 px-5 py-5 transition-all hover:border-orange-500/40 hover:bg-black/40">
      <div>
        <p className="text-[9px] font-black uppercase tracking-[0.24em] text-white/55">{label}</p>
        <p className="mt-2 text-xs text-white/35">{file ? file.name : "Upload JPG, PNG, WEBP or PDF"}</p>
      </div>
      <span className="rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-2 text-[8px] font-black uppercase tracking-[0.24em] text-orange-300">
        {file ? "Change" : "Select"}
      </span>
      <input type="file" accept=".pdf,image/*" className="hidden" onChange={(e) => onChange(e.target.files?.[0] || null)} />
    </label>
  );
}

const inputClass = "w-full rounded-2xl border border-white/10 bg-white/5 p-5 font-bold text-white outline-none transition-all focus:border-orange-600";

export default AddHotel;
