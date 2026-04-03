import API from "../utils/api";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Car,
  MapPin,
  IndianRupee,
  Users,
  Navigation,
  Loader2,
  Image as ImageIcon,
  X,
  UploadCloud,
  CheckCircle2,
  Zap,
  ArrowRight,
  Globe,
  Cpu,
  FileBadge2,
  UserCheck,
  Activity,
  Crosshair,
} from "lucide-react";
import { useNotify } from "../context/NotificationContext";
import RoutePreview from "../components/RoutePreview";

const transportDocumentFields = [
  { key: "driverPhoto", label: "Driver Photo" },
  { key: "driverLicenseDoc", label: "Driver License Scan" },
  { key: "driverAadhaarDoc", label: "Driver Aadhaar Scan" },
  { key: "vehicleRcDoc", label: "Vehicle RC" },
  { key: "vehicleInsuranceDoc", label: "Vehicle Insurance" },
  { key: "vehiclePermitDoc", label: "Tourist / Commercial Permit" },
  { key: "pollutionCertificateDoc", label: "PUC Certificate" },
  { key: "fitnessCertificateDoc", label: "Fitness Certificate" },
];

const createEmptyForm = () => ({
  vehicleModel: "",
  plateNumber: "",
  vehicleType: "",
  driverName: "",
  routeFrom: "",
  routeTo: "",
  availableDate: "",
  pricePerSeat: "",
  seatsAvailable: "1",
  contactNumber: "",
  driverLicenseNumber: "",
  driverAadhaarNumber: "",
  driverPanNumber: "",
  rcNumber: "",
  insurancePolicyNumber: "",
  permitNumber: "",
  pollutionCertificateNumber: "",
  fitnessCertificateNumber: "",
});

const createEmptyDocs = () =>
  transportDocumentFields.reduce((acc, item) => {
    acc[item.key] = null;
    return acc;
  }, {});

const inputClass =
  "w-full rounded-[28px] border border-white/10 bg-black/40 p-6 text-sm font-bold text-white outline-none shadow-inner transition-all focus:border-orange-500/50";

export default function AddTransport() {
  const { notify } = useNotify();
  const [formData, setFormData] = useState(createEmptyForm);
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [documents, setDocuments] = useState(createEmptyDocs);
  const [loading, setLoading] = useState(false);
  const [liveFromCoords, setLiveFromCoords] = useState(null);
  const [liveToCoords, setLiveToCoords] = useState(null);
  const [locating, setLocating] = useState(false);
  const [usingLivePickup, setUsingLivePickup] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
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

  const getCoords = async (place) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(place)}&format=json&limit=1`);
      const data = await res.json();
      return data && data.length > 0
        ? { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
        : { lat: 30.7333, lng: 79.0667 };
    } catch {
      return { lat: 30.7333, lng: 79.0667 };
    }
  };

  const getLocationLabel = async (lat, lng) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&format=json`);
      const data = await res.json();
      return (
        data?.address?.suburb ||
        data?.address?.road ||
        data?.address?.town ||
        data?.address?.city ||
        data?.display_name?.split(",")?.slice(0, 2)?.join(", ") ||
        `${lat.toFixed(5)}, ${lng.toFixed(5)}`
      );
    } catch {
      return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    }
  };

  const captureLivePickup = () => {
    if (!navigator.geolocation) {
      notify("This browser does not support live location.", "error");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        const label = await getLocationLabel(coords.lat, coords.lng);
        setFormData((prev) => ({ ...prev, routeFrom: label }));
        setLiveFromCoords(coords);
        setUsingLivePickup(true);
        setLocating(false);
        notify("Exact pickup location captured.", "success");
      },
      () => {
        setLocating(false);
        notify("Allow location access to use your exact live pickup point.", "error");
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  useEffect(() => {
    let active = true;

    const syncFrom = async () => {
      if (!formData.routeFrom.trim()) {
        if (active) setLiveFromCoords(null);
        return;
      }

      if (usingLivePickup) return;

      const coords = await getCoords(formData.routeFrom);
      if (active) setLiveFromCoords(coords);
    };

    syncFrom();

    return () => {
      active = false;
    };
  }, [formData.routeFrom, usingLivePickup]);

  useEffect(() => {
    let active = true;

    const syncTo = async () => {
      if (!formData.routeTo.trim()) {
        if (active) setLiveToCoords(null);
        return;
      }

      const coords = await getCoords(formData.routeTo);
      if (active) setLiveToCoords(coords);
    };

    syncTo();

    return () => {
      active = false;
    };
  }, [formData.routeTo]);

  const resetForm = () => {
    setFormData(createEmptyForm());
    setImages([]);
    setPreviews([]);
    setDocuments(createEmptyDocs());
    setLiveFromCoords(null);
    setLiveToCoords(null);
    setUsingLivePickup(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
      const fromCoords = liveFromCoords || await getCoords(formData.routeFrom);
      const toCoords = liveToCoords || await getCoords(formData.routeTo);

      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => data.append(key, value));
      data.append("fromCoords", JSON.stringify(fromCoords));
      data.append("toCoords", JSON.stringify(toCoords));
      images.forEach((file) => data.append("images", file));
      Object.entries(documents).forEach(([key, file]) => {
        if (file) data.append(key, file);
      });

      const response = await API.post("/transport/add", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data.success) {
        notify("Fleet and compliance documents transmitted successfully.", "success");
        resetForm();
      }
    } catch (error) {
      notify(error?.response?.data?.message || error?.message || "Uplink failed. Check compliance details.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen select-none bg-[#050505] px-4 pb-20 pt-40 text-white md:px-8">
      <div className="pointer-events-none fixed inset-0 z-0">
        <img src="https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=2500" className="h-full w-full scale-110 object-cover opacity-[0.08] grayscale blur-[2px]" alt="" />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#ea580c10,transparent_70%)]" />
      </div>

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 mx-auto max-w-7xl">
        <div className="mb-20 flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-1 w-12 rounded-full bg-orange-600" />
              <p className="text-[9px] font-black uppercase tracking-[0.7em] text-orange-500 italic">Central Logistics Terminal</p>
            </div>
            <h1 className="text-6xl font-black uppercase italic leading-none tracking-tighter drop-shadow-2xl md:text-8xl">
              Onboard <span className="bg-gradient-to-r from-orange-500 to-orange-800 bg-clip-text text-transparent">Units.</span>
            </h1>
          </div>
          <div className="flex items-center gap-4 rounded-[35px] border border-white/10 bg-white/[0.02] p-6 shadow-3xl backdrop-blur-3xl">
            <div className="rounded-2xl border border-orange-600/20 bg-orange-600/10 p-3 text-orange-500">
              <Cpu size={24} className="animate-spin-slow" />
            </div>
            <div>
              <p className="text-[8px] font-black uppercase tracking-widest text-white/20">Protocol Sync</p>
              <p className="text-lg font-black italic leading-none text-white">CONNECTED</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
          <div className="space-y-8 lg:col-span-8">
            <Panel title="Core Identity Specs" index="01" icon={<CheckCircle2 size={16} className="text-white/10" />}>
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <Field label="Vehicle Model">
                  <input name="vehicleModel" value={formData.vehicleModel} onChange={handleChange} placeholder="Innova Crysta / Premium SUV" className={inputClass} />
                </Field>
                <Field label="Vehicle Type">
                  <select name="vehicleType" value={formData.vehicleType} onChange={handleChange} className={inputClass}>
                    <option value="" className="bg-black">SELECT TYPE</option>
                    {["SUV", "MUV", "Sedan", "Hatchback", "Tempo Traveller", "Taxi", "Other"].map((item) => (
                      <option key={item} value={item} className="bg-black">
                        {item}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Lead Pilot Name">
                  <input name="driverName" value={formData.driverName} onChange={handleChange} placeholder="Lead Navigator" className={inputClass} />
                </Field>
                <Field label="Encrypted Comms Line">
                  <input name="contactNumber" value={formData.contactNumber} onChange={handleChange} placeholder="WhatsApp Terminal" className={inputClass} />
                </Field>
              </div>
            </Panel>

            <Panel title="Global Navigation Links" index="02" icon={<Globe size={16} className="animate-pulse text-white/10" />}>
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <Field label="Origin Terminal" icon={<MapPin className="text-orange-500" size={18} />}>
                  <div className="rounded-[30px] border border-white/5 bg-black/40 p-2 transition-all focus-within:border-orange-600/30">
                    <div className="flex items-center gap-4 px-6 py-4">
                      <MapPin className="text-orange-500" size={18} />
                      <input
                        name="routeFrom"
                        value={formData.routeFrom}
                        onChange={(e) => {
                          handleChange(e);
                          setUsingLivePickup(false);
                          setLiveFromCoords(null);
                        }}
                        placeholder="ORIGIN TERMINAL"
                        className="w-full bg-transparent text-xs font-black uppercase tracking-widest text-white outline-none"
                      />
                    </div>
                    <div className="px-6 pb-4">
                      <button
                        type="button"
                        onClick={captureLivePickup}
                        disabled={locating}
                        className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-2 text-[9px] font-black uppercase tracking-[0.24em] text-orange-200 transition-all hover:bg-orange-500/20 disabled:opacity-60"
                      >
                        {locating ? <Loader2 size={12} className="animate-spin" /> : <Crosshair size={12} />}
                        Use My Live Pickup
                      </button>
                    </div>
                  </div>
                </Field>
                <Field label="Destination Hub" icon={<Navigation className="text-orange-500" size={18} />}>
                  <input
                    name="routeTo"
                    value={formData.routeTo}
                    onChange={(e) => {
                      handleChange(e);
                      setLiveToCoords(null);
                    }}
                    placeholder="DESTINATION HUB"
                    className={inputClass}
                  />
                </Field>
                <Field label="Available Date" icon={<Navigation className="text-orange-500" size={18} />}>
                  <input name="availableDate" type="date" value={formData.availableDate} onChange={handleChange} className={`${inputClass} [color-scheme:dark]`} />
                </Field>
              </div>

              {(formData.routeFrom || formData.routeTo) && (
                <div className="overflow-hidden rounded-[32px] border border-white/10 bg-black/30 p-4">
                  <div className="mb-4 flex items-center gap-3">
                    <Activity size={16} className="text-orange-500" />
                    <p className="text-[9px] font-black uppercase tracking-[0.35em] text-white/35">Live Route Preview</p>
                  </div>
                  <RoutePreview pickupCoords={liveFromCoords} destinationCoords={liveToCoords} />
                </div>
              )}
            </Panel>

            <Panel title="Valuation Matrix" index="03" icon={<IndianRupee size={16} className="text-white/10" />}>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <MetricCard label="Price Strategy" icon={<IndianRupee size={18} className="text-orange-500" />}>
                  <input name="pricePerSeat" value={formData.pricePerSeat} onChange={handleChange} type="number" className="w-20 bg-transparent text-center text-4xl font-black italic tracking-tighter text-white outline-none" placeholder="00" />
                </MetricCard>
                <MetricCard label="Seat Matrix" icon={<Users size={18} className="text-orange-500" />}>
                  <input name="seatsAvailable" value={formData.seatsAvailable} onChange={handleChange} type="number" className="w-20 bg-transparent text-center text-4xl font-black italic tracking-tighter text-white outline-none" />
                </MetricCard>
                <MetricCard label="Fleet Code" icon={<Car size={18} className="text-orange-500" />}>
                  <input name="plateNumber" value={formData.plateNumber} onChange={handleChange} className="w-full bg-transparent text-center text-sm font-black uppercase tracking-widest text-white outline-none" placeholder="UK 13 TA..." />
                </MetricCard>
              </div>
            </Panel>

            <Panel title="Driver & Vehicle Compliance" index="04" icon={<FileBadge2 size={16} className="text-white/10" />}>
              <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                <Field label="Driver License Number">
                  <input name="driverLicenseNumber" value={formData.driverLicenseNumber} onChange={handleChange} placeholder="DL-042011..." className={inputClass} />
                </Field>
                <Field label="Driver Aadhaar Number">
                  <input name="driverAadhaarNumber" value={formData.driverAadhaarNumber} onChange={handleChange} placeholder="XXXX XXXX XXXX" className={inputClass} />
                </Field>
                <Field label="Driver PAN Number">
                  <input name="driverPanNumber" value={formData.driverPanNumber} onChange={handleChange} placeholder="Optional but useful" className={inputClass} />
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
                <Field label="RC Number">
                  <input name="rcNumber" value={formData.rcNumber} onChange={handleChange} placeholder="Vehicle RC number" className={inputClass} />
                </Field>
                <Field label="Insurance Policy No.">
                  <input name="insurancePolicyNumber" value={formData.insurancePolicyNumber} onChange={handleChange} placeholder="Insurance reference" className={inputClass} />
                </Field>
                <Field label="Permit Number">
                  <input name="permitNumber" value={formData.permitNumber} onChange={handleChange} placeholder="Commercial / tourist permit" className={inputClass} />
                </Field>
                <Field label="PUC Number">
                  <input name="pollutionCertificateNumber" value={formData.pollutionCertificateNumber} onChange={handleChange} placeholder="Pollution certificate" className={inputClass} />
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <Field label="Fitness Certificate Number">
                  <input name="fitnessCertificateNumber" value={formData.fitnessCertificateNumber} onChange={handleChange} placeholder="If vehicle class requires it" className={inputClass} />
                </Field>
                <div className="rounded-[30px] border border-orange-600/10 bg-orange-600/5 p-8">
                  <div className="mb-3 flex items-center gap-3 text-[9px] font-black uppercase tracking-[0.4em] text-orange-500">
                    <UserCheck size={16} className="animate-pulse" />
                    Safety Protocol
                  </div>
                  <p className="text-[9px] font-bold uppercase leading-relaxed tracking-tight text-white/30">
                    Add all legal operating references here so admin review can verify the driver, vehicle, and permit status without chasing documents later.
                  </p>
                </div>
              </div>
            </Panel>
          </div>

          <div className="space-y-8 lg:col-span-4">
            <div className="space-y-12 rounded-[60px] border border-white/5 bg-white/[0.02] p-8 shadow-3xl backdrop-blur-3xl">
              <div className="space-y-8">
                <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                  <ImageIcon size={16} className="text-orange-600" />
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 italic">Media Dashboard</p>
                </div>

                <div className="group relative h-64 cursor-pointer">
                  <input type="file" multiple accept="image/*" onChange={handleImageChange} className="absolute inset-0 z-20 h-full w-full cursor-pointer opacity-0" />
                  <div className="flex h-full w-full flex-col items-center justify-center gap-5 rounded-[45px] border-2 border-dashed border-white/10 bg-black/40 transition-all duration-500 group-hover:border-orange-600 group-hover:bg-orange-600/[0.02]">
                    <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/5 shadow-2xl transition-all duration-500 group-hover:rotate-12 group-hover:bg-orange-600">
                      <UploadCloud size={28} className="text-white/20 group-hover:text-white" />
                    </div>
                    <div className="px-6 text-center">
                      <p className="text-[10px] font-black uppercase tracking-widest text-white">Transmit Media</p>
                      <p className="mt-2 text-[8px] font-bold uppercase text-white/10">Max Payload: 5 Units</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <AnimatePresence>
                    {previews.map((url, index) => (
                      <motion.div key={url} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="relative aspect-square">
                        <img src={url} className="h-full w-full rounded-[22px] border border-white/10 object-cover shadow-2xl" alt="preview" />
                        <button type="button" onClick={() => removeImage(index)} className="absolute -right-1.5 -top-1.5 z-30 rounded-full bg-red-600 p-1.5 text-white shadow-2xl transition-transform hover:scale-125">
                          <X size={10} />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              <div className="space-y-5">
                <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                  <FileBadge2 size={16} className="text-orange-600" />
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 italic">Compliance Uploads</p>
                </div>
                <div className="space-y-4">
                  {transportDocumentFields.map((item) => (
                    <DocumentField
                      key={item.key}
                      label={item.label}
                      file={documents[item.key]}
                      onChange={(file) => handleDocumentChange(item.key, file)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 lg:col-span-12">
            <button
              disabled={loading}
              type="submit"
              className="group relative flex w-full items-center justify-center gap-8 overflow-hidden rounded-[50px] border border-orange-500/20 bg-orange-600 p-10 text-[15px] font-black uppercase tracking-[0.8em] text-white shadow-[0_40px_100px_rgba(234,88,12,0.2)] transition-all duration-700 hover:bg-white hover:text-black disabled:opacity-20 active:scale-[0.99]"
            >
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 ease-in-out group-hover:translate-x-full" />
              {loading ? (
                <div className="flex items-center gap-4 font-black italic">
                  <Loader2 className="animate-spin" />
                  DATA STREAMING...
                </div>
              ) : (
                <div className="flex items-center gap-6">
                  <Zap size={24} className="animate-pulse fill-current" />
                  INITIALIZE FLEET DEPLOYMENT
                  <ArrowRight className="transition-transform duration-500 group-hover:translate-x-3" />
                </div>
              )}
            </button>
            <p className="mt-8 text-center text-[8px] font-black uppercase tracking-[1em] text-white/10">Secure End-to-End Encryption Enabled</p>
          </div>
        </form>
      </motion.div>

      <motion.div
        animate={{ y: [0, 1000, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        className="pointer-events-none fixed left-0 right-0 z-[100] h-[1px] bg-orange-600/20 blur-sm"
      />
    </div>
  );
}

function Panel({ title, index, icon, children }) {
  return (
    <div className="group rounded-[60px] border border-white/5 bg-white/[0.02] p-8 shadow-2xl backdrop-blur-3xl transition-all hover:border-orange-600/10 md:p-12">
      <div className="space-y-12">
        <div className="flex items-center justify-between border-b border-white/5 pb-6">
          <div className="flex items-center gap-4">
            <span className="text-xl font-black italic text-orange-600">{index}</span>
            <p className="text-[11px] font-black uppercase tracking-[0.4em] text-white italic leading-none">{title}</p>
          </div>
          {icon}
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, icon, children }) {
  return (
    <div className="space-y-3">
      <label className="ml-4 flex items-center gap-3 text-[9px] font-black uppercase tracking-[0.4em] text-white/20 italic">
        {icon}
        {label}
      </label>
      {children}
    </div>
  );
}

function MetricCard({ label, icon, children }) {
  return (
    <div className="space-y-3 rounded-[40px] border border-white/5 bg-white/5 p-8 text-center shadow-inner transition-all group-hover:bg-white/[0.04]">
      <p className="text-[8px] font-black uppercase tracking-[0.5em] text-white/30">{label}</p>
      <div className="flex items-center justify-center gap-3">
        {icon}
        {children}
      </div>
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
