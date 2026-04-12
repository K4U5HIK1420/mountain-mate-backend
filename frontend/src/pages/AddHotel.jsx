import API from "../utils/api";
import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNotify } from "../context/NotificationContext";
import {
  Bath,
  BadgeCheck,
  Banknote,
  BedDouble,
  BellRing,
  Building2,
  Car,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Clock3,
  FileBadge2,
  IndianRupee,
  Landmark,
  Loader2,
  LocateFixed,
  MapPin,
  Mountain,
  Phone,
  Power,
  Save,
  ShieldCheck,
  Soup,
  Sparkles,
  Upload,
  User,
  Users,
  Utensils,
  Wifi,
  X,
} from "lucide-react";
import { getBrowserLocation } from "../utils/location";
import {
  cleanValue,
  digitsOnly,
  isValidAadhaar,
  isValidBankAccount,
  isValidIfsc,
  isValidPan,
  isValidPhone,
  normalizeIfsc,
  normalizePan,
  normalizePhone,
} from "../utils/validation";

const FORM_STORAGE_KEY = "mountainMate.propertyOnboarding.v3";
const zoneOptions = ["Guptkashi", "Sonprayag", "Phata", "Rudraprayag", "Ukhimath", "Kedarnath Base"];
const availabilityOptions = ["Available now", "Available this week", "Temporarily closed"];
const propertyTypeOptions = ["Hotel", "Homestay", "Lodge", "Camp / Tent"];

const hotelDocumentFields = [
  { key: "ownerPhoto", label: "Owner Photo" },
  { key: "ownerAadhaarDoc", label: "Aadhaar Copy" },
  { key: "ownerPanDoc", label: "PAN Copy" },
  { key: "propertyRegistrationDoc", label: "Property Registration / Lease" },
  { key: "tradeLicenseDoc", label: "Trade License" },
  { key: "gstCertificateDoc", label: "GST Certificate" },
  { key: "fireSafetyDoc", label: "Fire Safety Certificate" },
];
const requiredDocumentKeys = ["ownerAadhaarDoc", "ownerPanDoc"];

const mandatoryImageFields = [
  { key: "hotel", label: "Hotel Photo", helper: "Main hotel exterior/front photo" },
  { key: "room", label: "Hotel Room Photo", helper: "At least one clear room image" },
  { key: "bathroom", label: "Bathroom Photo", helper: "At least one clear bathroom image" },
];

const facilitiesCatalog = [
  { key: "wifi", label: "WiFi", icon: Wifi },
  { key: "parking", label: "Parking", icon: Car },
  { key: "food", label: "Food", icon: Utensils },
  { key: "hotWater", label: "Hot Water", icon: Bath },
  { key: "roomService", label: "Room Service", icon: BellRing },
  { key: "mountainView", label: "Mountain View", icon: Mountain },
  { key: "restaurant", label: "Restaurant", icon: Soup },
  { key: "powerBackup", label: "Power Backup", icon: Power },
];

const createEmptyForm = () => ({
  hotelName: "",
  propertyType: "Hotel",
  location: "",
  landmark: "",
  ownerName: "",
  contactNumber: "",
  pricePerNight: "",
  roomsAvailable: "",
  guestsPerRoom: "2",
  availabilityStatus: "Available now",
  description: "",
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

const createEmptyDocs = () => hotelDocumentFields.reduce((acc, item) => ({ ...acc, [item.key]: null }), {});
const createInitialFacilities = () => facilitiesCatalog.reduce((acc, item) => ({ ...acc, [item.key]: false }), {});
const createInitialMandatoryImages = () => mandatoryImageFields.reduce((acc, item) => ({ ...acc, [item.key]: null }), {});
const createInitialMandatoryPreviews = () => mandatoryImageFields.reduce((acc, item) => ({ ...acc, [item.key]: "" }), {});

const requiredStepFieldMap = {
  0: ["hotelName", "propertyType", "location", "ownerName", "contactNumber"],
  1: ["pricePerNight", "roomsAvailable", "guestsPerRoom", "availabilityStatus"],
  2: ["description"],
  3: ["ownerAadhaarNumber", "ownerPanNumber", "bankAccountHolder", "bankAccountNumber", "ifscCode"],
};

const stepTitles = ["Basic Property Info", "Pricing & Capacity", "Facilities & Description", "Legal & Documents", "Property Images"];

const AddHotel = () => {
  const { notify } = useNotify();
  const [stepIndex, setStepIndex] = useState(0);
  const [formData, setFormData] = useState(createEmptyForm);
  const [facilities, setFacilities] = useState(createInitialFacilities);
  const [documents, setDocuments] = useState(createEmptyDocs);
  const [mandatoryImages, setMandatoryImages] = useState(createInitialMandatoryImages);
  const [mandatoryPreviews, setMandatoryPreviews] = useState(createInitialMandatoryPreviews);
  const [extraImages, setExtraImages] = useState([]);
  const [extraPreviews, setExtraPreviews] = useState([]);
  const [errors, setErrors] = useState({});
  const [isUploadingDocsOpen, setUploadingDocsOpen] = useState(false);
  const [isDetectingLocation, setDetectingLocation] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(FORM_STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (saved.formData) setFormData((prev) => ({ ...prev, ...saved.formData }));
      if (saved.facilities) setFacilities((prev) => ({ ...prev, ...saved.facilities }));
      if (typeof saved.stepIndex === "number") setStepIndex(Math.min(Math.max(saved.stepIndex, 0), 4));
      notify("Draft loaded. Continue from where you left.", "success");
    } catch {
      notify("Could not restore previous draft. Starting fresh.", "error");
    }
  }, [notify]);

  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem(
        FORM_STORAGE_KEY,
        JSON.stringify({ formData, facilities, stepIndex, updatedAt: new Date().toISOString() })
      );
    }, 350);
    return () => clearTimeout(timer);
  }, [formData, facilities, stepIndex]);

  const hasMandatoryFacilities = Object.values(facilities).some(Boolean);
  const hasMandatoryDocs = requiredDocumentKeys.every((key) => !!documents[key]);
  const hasMandatoryImages = mandatoryImageFields.every((field) => !!mandatoryImages[field.key]);

  const requiredCompletion = useMemo(() => {
    const step1Ready = requiredStepFieldMap[0].every((f) => String(formData[f] || "").trim());
    const step2Ready = requiredStepFieldMap[1].every((f) => String(formData[f] || "").trim());
    const step3Ready = requiredStepFieldMap[2].every((f) => String(formData[f] || "").trim()) && hasMandatoryFacilities;
    const step4Ready = requiredStepFieldMap[3].every((f) => String(formData[f] || "").trim()) && hasMandatoryDocs;
    return step1Ready && step2Ready && step3Ready && step4Ready && hasMandatoryImages;
  }, [formData, hasMandatoryFacilities, hasMandatoryDocs, hasMandatoryImages]);

  const progressPercent = ((stepIndex + 1) / stepTitles.length) * 100;

  const updateField = (name, value) => {
    let nextValue = value;
    if (name === "contactNumber") nextValue = normalizePhone(value);
    if (name === "ownerPanNumber") nextValue = normalizePan(value);
    if (name === "ifscCode") nextValue = normalizeIfsc(value);
    if (name === "ownerAadhaarNumber") nextValue = digitsOnly(value).slice(0, 12);
    if (name === "bankAccountNumber") nextValue = digitsOnly(value).slice(0, 18);
    setFormData((prev) => ({ ...prev, [name]: nextValue }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const toggleFacility = (key) => {
    setFacilities((prev) => ({ ...prev, [key]: !prev[key] }));
    setErrors((prev) => ({ ...prev, facilities: "" }));
  };

  const validateStep = (targetStep) => {
    const requiredFields = requiredStepFieldMap[targetStep] || [];
    const nextErrors = {};

    requiredFields.forEach((field) => {
      if (!String(formData[field] || "").trim()) nextErrors[field] = "This field is required.";
    });

    if ((targetStep === 0 || targetStep === 1) && formData.contactNumber && !isValidPhone(formData.contactNumber)) {
      nextErrors.contactNumber = "Enter a valid phone number.";
    }

    if ((targetStep === 1 || targetStep === 0) && formData.pricePerNight && Number(formData.pricePerNight) <= 0) nextErrors.pricePerNight = "Price must be greater than 0.";
    if ((targetStep === 1 || targetStep === 0) && formData.roomsAvailable && Number(formData.roomsAvailable) <= 0) nextErrors.roomsAvailable = "Rooms must be at least 1.";
    if ((targetStep === 1 || targetStep === 0) && formData.guestsPerRoom && Number(formData.guestsPerRoom) <= 0) nextErrors.guestsPerRoom = "Guests must be at least 1.";

    if (targetStep === 2 && !hasMandatoryFacilities) nextErrors.facilities = "Select at least one facility.";

    if (targetStep === 3) {
      if (cleanValue(formData.ownerAadhaarNumber) && !isValidAadhaar(formData.ownerAadhaarNumber)) {
        nextErrors.ownerAadhaarNumber = "Enter a valid 12-digit Aadhaar number.";
      }
      if (cleanValue(formData.ownerPanNumber) && !isValidPan(formData.ownerPanNumber)) {
        nextErrors.ownerPanNumber = "Enter a valid PAN number.";
      }
      if (cleanValue(formData.ifscCode) && !isValidIfsc(formData.ifscCode)) {
        nextErrors.ifscCode = "Enter a valid IFSC code.";
      }
      if (cleanValue(formData.bankAccountNumber) && !isValidBankAccount(formData.bankAccountNumber)) {
        nextErrors.bankAccountNumber = "Enter a valid bank account number.";
      }
      requiredDocumentKeys.forEach((key) => {
        if (!documents[key]) nextErrors[key] = "This document is required.";
      });
    }

    if (targetStep === 4) {
      mandatoryImageFields.forEach((field) => {
        if (!mandatoryImages[field.key]) nextErrors[`image_${field.key}`] = "This image is required.";
      });
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const getFirstIncompleteStep = () => {
    if (!requiredStepFieldMap[0].every((f) => String(formData[f] || "").trim())) return 0;
    if (!requiredStepFieldMap[1].every((f) => String(formData[f] || "").trim())) return 1;
    if (!requiredStepFieldMap[2].every((f) => String(formData[f] || "").trim()) || !hasMandatoryFacilities) return 2;
    if (!requiredStepFieldMap[3].every((f) => String(formData[f] || "").trim()) || !hasMandatoryDocs) return 3;
    if (!hasMandatoryImages) return 4;
    return 0;
  };

  const handleNext = () => {
    if (!validateStep(stepIndex)) {
      notify("Please complete required fields before continuing.", "error");
      return;
    }
    setStepIndex((prev) => Math.min(prev + 1, stepTitles.length - 1));
  };

  const handleBack = () => setStepIndex((prev) => Math.max(prev - 1, 0));

  const handleSaveAndContinueLater = () => {
    localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify({ formData, facilities, stepIndex, updatedAt: new Date().toISOString() }));
    notify("Draft saved. You can continue later.", "success");
  };

  const handleDocumentChange = (key, file) => {
    setDocuments((prev) => ({ ...prev, [key]: file || null }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const handleMandatoryImageChange = (key, file) => {
    setMandatoryImages((prev) => ({ ...prev, [key]: file || null }));
    setMandatoryPreviews((prev) => {
      if (prev[key]) URL.revokeObjectURL(prev[key]);
      return { ...prev, [key]: file ? URL.createObjectURL(file) : "" };
    });
    setErrors((prev) => ({ ...prev, [`image_${key}`]: "" }));
  };

  const handleExtraImagesChange = (files) => {
    if (!files.length) return;
    const selected = Array.from(files);
    setExtraImages((prev) => [...prev, ...selected]);
    setExtraPreviews((prev) => [...prev, ...selected.map((file) => URL.createObjectURL(file))]);
  };

  const removeExtraImage = (index) => {
    setExtraImages((prev) => prev.filter((_, i) => i !== index));
    setExtraPreviews((prev) => {
      const target = prev[index];
      if (target) URL.revokeObjectURL(target);
      return prev.filter((_, i) => i !== index);
    });
  };

  const tryAutoFillLocation = () => {
    setDetectingLocation(true);
    getBrowserLocation({ timeout: 12000 })
      .then(async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const coordText = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

        if (!formData.landmark) updateField("landmark", coordText);

        try {
          const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
          const data = await res.json();
          const locality = data.locality || data.city || data.principalSubdivision || coordText;
          const formatted = [data.locality, data.principalSubdivision].filter(Boolean).join(", ") || locality;
          updateField("location", formatted);
          notify(`Current location detected${accuracy ? ` (~${Math.round(accuracy)}m)` : ""}.`, "success");
        } catch {
          updateField("location", coordText);
          notify("Current coordinates filled. You can edit manually.", "success");
        } finally {
          setDetectingLocation(false);
        }
      })
      .catch(() => {
        notify("Location permission denied. Please allow location access.", "error");
        setDetectingLocation(false);
      });
  };

  const clearDraftAfterSubmit = () => {
    localStorage.removeItem(FORM_STORAGE_KEY);
    Object.values(mandatoryPreviews).forEach((url) => url && URL.revokeObjectURL(url));
    extraPreviews.forEach((url) => URL.revokeObjectURL(url));
    setFormData(createEmptyForm());
    setFacilities(createInitialFacilities());
    setDocuments(createEmptyDocs());
    setMandatoryImages(createInitialMandatoryImages());
    setMandatoryPreviews(createInitialMandatoryPreviews());
    setExtraImages([]);
    setExtraPreviews([]);
    setStepIndex(0);
    setErrors({});
    setUploadingDocsOpen(false);
  };

  const submitProperty = async () => {
    const validationErrors = stepTitles.reduce((acc, _title, index) => {
      const requiredFields = requiredStepFieldMap[index] || [];
      requiredFields.forEach((field) => {
        if (!cleanValue(formData[field])) acc[field] = "This field is required.";
      });
      return acc;
    }, {});

    if (cleanValue(formData.contactNumber) && !isValidPhone(formData.contactNumber)) {
      validationErrors.contactNumber = "Enter a valid phone number.";
    }
    if (cleanValue(formData.ownerAadhaarNumber) && !isValidAadhaar(formData.ownerAadhaarNumber)) {
      validationErrors.ownerAadhaarNumber = "Enter a valid 12-digit Aadhaar number.";
    }
    if (cleanValue(formData.ownerPanNumber) && !isValidPan(formData.ownerPanNumber)) {
      validationErrors.ownerPanNumber = "Enter a valid PAN number.";
    }
    if (cleanValue(formData.ifscCode) && !isValidIfsc(formData.ifscCode)) {
      validationErrors.ifscCode = "Enter a valid IFSC code.";
    }
    if (cleanValue(formData.bankAccountNumber) && !isValidBankAccount(formData.bankAccountNumber)) {
      validationErrors.bankAccountNumber = "Enter a valid bank account number.";
    }

    if (!requiredCompletion) {
      const firstIncompleteStep = getFirstIncompleteStep();
      setStepIndex(firstIncompleteStep);
      if (firstIncompleteStep === 3) setUploadingDocsOpen(true);
      validateStep(firstIncompleteStep);
      notify("Please complete all mandatory steps before publish.", "error");
      return;
    }
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      if (validationErrors.contactNumber) setStepIndex(0);
      else if (validationErrors.ownerAadhaarNumber || validationErrors.ownerPanNumber || validationErrors.ifscCode || validationErrors.bankAccountNumber) {
        setStepIndex(3);
        setUploadingDocsOpen(true);
      }
      notify("Please fix the highlighted details before publish.", "error");
      return;
    }

    setLoading(true);
    const data = new FormData();
    const sanitizedFormData = {
      ...formData,
      contactNumber: normalizePhone(formData.contactNumber),
      ownerAadhaarNumber: digitsOnly(formData.ownerAadhaarNumber),
      ownerPanNumber: normalizePan(formData.ownerPanNumber),
      ifscCode: normalizeIfsc(formData.ifscCode),
      bankAccountNumber: digitsOnly(formData.bankAccountNumber),
    };
    Object.entries(sanitizedFormData).forEach(([key, value]) => data.append(key, value));
    data.append("amenities", JSON.stringify(Object.keys(facilities).filter((key) => facilities[key])));

    Object.entries(documents).forEach(([key, file]) => {
      if (file) data.append(key, file);
    });
    mandatoryImageFields.forEach((field) => {
      if (mandatoryImages[field.key]) data.append("images", mandatoryImages[field.key]);
    });
    extraImages.forEach((file) => data.append("images", file));

    try {
      const response = await API.post("/hotel/add", data);
      if (response.data) {
        clearDraftAfterSubmit();
        notify("Property submitted successfully with mandatory details and images.", "success");
      }
    } catch (error) {
      notify(error.response?.data?.message || "Could not submit property right now.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden px-4 pb-20 pt-32 md:px-8">
      <div className="pointer-events-none fixed inset-0 z-[-1] bg-[radial-gradient(circle_at_10%_10%,rgba(255,106,0,0.24),transparent_35%),radial-gradient(circle_at_85%_18%,rgba(255,106,0,0.14),transparent_38%),linear-gradient(180deg,#050505_0%,#020202_100%)]" />
      <div className="pointer-events-none fixed inset-0 z-[-1] opacity-35 [background:radial-gradient(rgba(255,255,255,0.07)_1px,transparent_1px)] [background-size:16px_16px]" />

      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-6xl rounded-[34px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.5)] backdrop-blur-2xl md:p-10">
        <header className="space-y-6 border-b border-white/10 pb-8">
          <div className="flex flex-wrap items-center gap-3">
            <Chip icon={Clock3} text="Takes less than 2 minutes" accent />
            <Chip icon={CircleCheck} text="All 5 steps are required to publish" />
            <Chip icon={ShieldCheck} text="KYC, bank details and 3 photos are mandatory" />
          </div>

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.26em] text-orange-300/80">Mountain Mate Partner Onboarding</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-white md:text-5xl">Register <span className="text-[#FF6A00]">Property</span></h1>
              <p className="mt-3 max-w-2xl text-sm text-white/70">Fast setup with clear steps. Fill once, publish confidently.</p>
            </div>
            <div className="rounded-2xl border border-orange-400/20 bg-orange-500/10 px-4 py-3 text-right">
              <p className="text-[10px] uppercase tracking-[0.24em] text-orange-200/90">Step {stepIndex + 1} of {stepTitles.length}</p>
              <p className="mt-1 text-sm font-semibold text-white">{stepTitles[stepIndex]}</p>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between text-[11px] font-semibold text-white/60"><span>Progress</span><span>{Math.round(progressPercent)}%</span></div>
            <div className="h-2 rounded-full bg-white/10"><motion.div className="h-2 rounded-full bg-gradient-to-r from-orange-500 to-orange-300" animate={{ width: `${progressPercent}%` }} transition={{ duration: 0.35, ease: "easeOut" }} /></div>
          </div>

          <StepRail stepIndex={stepIndex} />
        </header>

        <section className="mt-8">
          <AnimatePresence mode="wait">
            <motion.div key={stepIndex} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.22 }} className="grid gap-6">
              {stepIndex === 0 && (
                <StepCard title="Basic Property Info" subtitle="Enter property identity, current location and contact details.">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <TextField label="Property Name" name="hotelName" value={formData.hotelName} onChange={updateField} placeholder="Kedar Valley Retreat" error={errors.hotelName} icon={Building2} required />
                    <SelectField label="Type" name="propertyType" value={formData.propertyType} onChange={updateField} options={propertyTypeOptions} error={errors.propertyType} icon={BadgeCheck} required />
                    <div className="md:col-span-2 grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto]">
                      <TextField label="Current Location" name="location" value={formData.location} onChange={updateField} placeholder="Current area/city auto-filled after click" error={errors.location} icon={MapPin} required list="zone-suggestions" />
                      <button type="button" onClick={tryAutoFillLocation} disabled={isDetectingLocation} className="mt-6 h-[50px] rounded-xl border border-orange-400/25 bg-orange-500/10 px-4 text-sm font-semibold text-orange-200 transition hover:border-orange-300/50 hover:bg-orange-500/15 disabled:opacity-60">
                        <span className="inline-flex items-center gap-2">{isDetectingLocation ? <Loader2 size={16} className="animate-spin" /> : <LocateFixed size={16} />}{isDetectingLocation ? "Detecting..." : "Auto-fill"}</span>
                      </button>
                    </div>
                    <datalist id="zone-suggestions">{zoneOptions.map((zone) => (<option key={zone} value={zone} />))}</datalist>
                    <TextField label="Landmark" name="landmark" value={formData.landmark} onChange={updateField} placeholder="Near Sonprayag Parking" icon={Landmark} />
                    <TextField label="Owner / Manager Name" name="ownerName" value={formData.ownerName} onChange={updateField} placeholder="Anita Rawat" error={errors.ownerName} icon={User} required />
                    <TextField label="Contact Number" name="contactNumber" value={formData.contactNumber} onChange={updateField} placeholder="+91 98XXXXXXXX" error={errors.contactNumber} icon={Phone} required />
                  </div>
                </StepCard>
              )}

              {stepIndex === 1 && (
                <StepCard title="Pricing & Capacity" subtitle="Set base pricing and guest capacity.">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <TextField label="Price Per Night (INR)" name="pricePerNight" value={formData.pricePerNight} onChange={updateField} placeholder="3500" type="number" icon={IndianRupee} error={errors.pricePerNight} required />
                    <TextField label="Total Rooms / Units" name="roomsAvailable" value={formData.roomsAvailable} onChange={updateField} placeholder="8" type="number" icon={BedDouble} error={errors.roomsAvailable} required />
                    <TextField label="Max Guests" name="guestsPerRoom" value={formData.guestsPerRoom} onChange={updateField} placeholder="2" type="number" icon={Users} error={errors.guestsPerRoom} required />
                    <SelectField label="Basic Availability" name="availabilityStatus" value={formData.availabilityStatus} onChange={updateField} options={availabilityOptions} icon={Clock3} error={errors.availabilityStatus} required />
                  </div>
                </StepCard>
              )}

              {stepIndex === 2 && (
                <StepCard title="Facilities & Description" subtitle="Mandatory before publishing.">
                  <div>
                    <p className="mb-3 text-sm text-white/70">Select available facilities:</p>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                      {facilitiesCatalog.map((item) => {
                        const Icon = item.icon;
                        const active = facilities[item.key];
                        return (
                          <button key={item.key} type="button" onClick={() => toggleFacility(item.key)} className={`rounded-xl border px-4 py-3 text-left transition ${active ? "border-orange-300/45 bg-orange-500/20 text-white" : "border-white/10 bg-white/5 text-white/75 hover:border-white/25"}`}>
                            <Icon size={16} className="mb-2" />
                            <p className="text-sm font-semibold">{item.label}</p>
                          </button>
                        );
                      })}
                    </div>
                    {errors.facilities ? <p className="mt-2 text-xs text-red-300">{errors.facilities}</p> : null}
                  </div>
                  <TextAreaField label="Property Description" name="description" value={formData.description} onChange={updateField} placeholder="Share what guests love: views, food style, parking convenience, and nearby attractions." error={errors.description} required />
                </StepCard>
              )}

              {stepIndex === 3 && (
                <StepCard title="Legal & Documents" subtitle="Mandatory before publishing.">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <TextField label="Aadhaar Number" name="ownerAadhaarNumber" value={formData.ownerAadhaarNumber} onChange={updateField} placeholder="XXXX XXXX XXXX" icon={FileBadge2} error={errors.ownerAadhaarNumber} required />
                    <TextField label="PAN Number" name="ownerPanNumber" value={formData.ownerPanNumber} onChange={updateField} placeholder="ABCDE1234F" icon={FileBadge2} error={errors.ownerPanNumber} required />
                    <TextField label="GST Number" name="gstNumber" value={formData.gstNumber} onChange={updateField} placeholder="22AAAAA0000A1Z5" icon={Banknote} />
                    <TextField label="Registration Number" name="registrationNumber" value={formData.registrationNumber} onChange={updateField} placeholder="Hotel / property registration no" icon={FileBadge2} />
                    <TextField label="Trade License Number" name="tradeLicenseNumber" value={formData.tradeLicenseNumber} onChange={updateField} placeholder="Trade license no" icon={FileBadge2} />
                    <TextField label="Fire Safety Certificate No" name="fireSafetyCertificateNumber" value={formData.fireSafetyCertificateNumber} onChange={updateField} placeholder="Fire safety certificate no" icon={FileBadge2} />
                    <TextField label="Bank Account Holder" name="bankAccountHolder" value={formData.bankAccountHolder} onChange={updateField} placeholder="Name as per bank" icon={BadgeCheck} error={errors.bankAccountHolder} required />
                    <TextField label="Bank Account Number" name="bankAccountNumber" value={formData.bankAccountNumber} onChange={updateField} placeholder="XXXXXXXXXXXX" icon={Banknote} error={errors.bankAccountNumber} required />
                    <TextField label="IFSC Code" name="ifscCode" value={formData.ifscCode} onChange={updateField} placeholder="SBIN0001234" icon={Banknote} error={errors.ifscCode} required />
                  </div>

                  <button type="button" onClick={() => setUploadingDocsOpen((prev) => !prev)} className="flex w-full items-center justify-between rounded-xl border border-white/12 bg-white/[0.03] px-4 py-3 text-left">
                    <span>
                      <p className="text-sm font-semibold text-white">Document Upload</p>
                      <p className="text-xs text-white/60">Aadhaar and PAN docs are mandatory.</p>
                    </span>
                    <ChevronDown size={18} className={`text-white/70 transition-transform ${isUploadingDocsOpen ? "rotate-180" : ""}`} />
                  </button>

                  <AnimatePresence>
                    {isUploadingDocsOpen && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                          {hotelDocumentFields.map((item) => (
                            <DocumentField key={item.key} label={item.label} file={documents[item.key]} onChange={(file) => handleDocumentChange(item.key, file)} error={errors[item.key]} />
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </StepCard>
              )}

              {stepIndex === 4 && (
                <StepCard title="Property Images" subtitle="3 photos are mandatory: hotel, room, bathroom.">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {mandatoryImageFields.map((field) => (
                      <ImageRequiredField key={field.key} label={field.label} helper={field.helper} preview={mandatoryPreviews[field.key]} file={mandatoryImages[field.key]} error={errors[`image_${field.key}`]} onChange={(file) => handleMandatoryImageChange(field.key, file)} />
                    ))}
                  </div>

                  <div className="rounded-xl border border-white/12 bg-white/[0.03] p-4">
                    <p className="text-sm font-semibold text-white">Additional Photos (Optional)</p>
                    <p className="mt-1 text-xs text-white/60">Owner can upload as many extra photos as needed.</p>
                    <div className="mt-3 flex flex-wrap gap-3">
                      {extraPreviews.map((src, index) => (
                        <div key={`${src}-${index}`} className="relative h-24 w-24 overflow-hidden rounded-lg border border-white/10">
                          <img src={src} alt="extra" className="h-full w-full object-cover" />
                          <button type="button" onClick={() => removeExtraImage(index)} className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white"><X size={12} /></button>
                        </div>
                      ))}

                      <label className="flex h-24 w-24 cursor-pointer items-center justify-center rounded-lg border border-dashed border-white/20 bg-black/25 text-xs text-white/60 hover:border-orange-300/40">
                        + Add
                        <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleExtraImagesChange(e.target.files || [])} />
                      </label>
                    </div>
                  </div>
                </StepCard>
              )}
            </motion.div>
          </AnimatePresence>
        </section>

        <footer className="mt-8 border-t border-white/10 pt-6">
          <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <TrustCard icon={ShieldCheck} title="Secure onboarding" text="Your legal details are encrypted and used only for verification." />
            <TrustCard icon={Clock3} title="Clear required flow" text="Every mandatory step is validated before publish." />
            <TrustCard icon={Sparkles} title="Better listing quality" text="Required photos and facilities improve guest trust and conversions." />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-3">
              <ActionButton type="button" variant="ghost" onClick={handleSaveAndContinueLater} icon={Save}>Save & Continue Later</ActionButton>
              {stepIndex > 0 && (<ActionButton type="button" variant="ghost" onClick={handleBack} icon={ChevronLeft}>Back</ActionButton>)}
            </div>

            <div className="flex flex-wrap gap-3">
              {stepIndex < stepTitles.length - 1 ? (<ActionButton type="button" variant="primary" onClick={handleNext} icon={ChevronRight}>Next</ActionButton>) : null}
              <ActionButton type="button" variant="primary" onClick={submitProperty} icon={loading ? Loader2 : Upload} disabled={loading || !requiredCompletion}>{loading ? "Submitting..." : "Publish Property"}</ActionButton>
            </div>
          </div>
        </footer>
      </motion.div>
    </div>
  );
};

function StepRail({ stepIndex }) {
  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
      {stepTitles.map((title, idx) => {
        const state = idx < stepIndex ? "done" : idx === stepIndex ? "active" : "idle";
        return (
          <div key={title} className={`rounded-xl border px-3 py-2 text-xs transition ${state === "done" ? "border-orange-300/35 bg-orange-500/15 text-orange-100" : state === "active" ? "border-white/25 bg-white/10 text-white" : "border-white/10 bg-white/[0.03] text-white/50"}`}>
            <p className="font-semibold">Step {idx + 1}</p>
            <p className="mt-0.5 truncate text-[11px]">{title}</p>
          </div>
        );
      })}
    </div>
  );
}

function StepCard({ title, subtitle, children }) {
  return (
    <article className="rounded-2xl border border-white/12 bg-white/[0.03] p-5 md:p-6">
      <h2 className="text-xl font-bold text-white">{title}</h2>
      <p className="mt-1 text-sm text-white/65">{subtitle}</p>
      <div className="mt-6 space-y-5">{children}</div>
    </article>
  );
}

function FieldShell({ label, required, icon: Icon, error, children }) {
  return (
    <label className="block">
      <div className="mb-2 flex items-center gap-2 text-sm text-white/75">
        {Icon ? <Icon size={15} className="text-orange-300/90" /> : null}
        <span className="font-medium">{label}</span>
        {required ? <span className="text-orange-300">*</span> : null}
      </div>
      {children}
      {error ? <p className="mt-1 text-xs text-red-300">{error}</p> : null}
    </label>
  );
}

function TextField({ label, name, value, onChange, placeholder, type = "text", icon, error, required, list }) {
  return (
    <FieldShell label={label} required={required} icon={icon} error={error}>
      <input name={name} value={value} onChange={(e) => onChange(name, e.target.value)} placeholder={placeholder} type={type} list={list} className="w-full rounded-xl border border-white/12 bg-black/35 px-3 py-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-orange-400/60" />
    </FieldShell>
  );
}

function SelectField({ label, name, value, onChange, options, icon, error, required }) {
  return (
    <FieldShell label={label} required={required} icon={icon} error={error}>
      <select name={name} value={value} onChange={(e) => onChange(name, e.target.value)} className="w-full rounded-xl border border-white/12 bg-black/35 px-3 py-3 text-sm text-white outline-none transition focus:border-orange-400/60">
        <option value="" className="bg-[#0d0d0d]">Select an option</option>
        {options.map((opt) => (<option key={opt} value={opt} className="bg-[#0d0d0d]">{opt}</option>))}
      </select>
    </FieldShell>
  );
}

function TextAreaField({ label, name, value, onChange, placeholder, required, icon, error }) {
  return (
    <FieldShell label={label} required={required} icon={icon} error={error}>
      <textarea name={name} value={value} onChange={(e) => onChange(name, e.target.value)} placeholder={placeholder} rows={5} className="w-full rounded-xl border border-white/12 bg-black/35 px-3 py-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-orange-400/60" />
    </FieldShell>
  );
}

function DocumentField({ label, file, onChange, error }) {
  return (
    <div>
      <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/30 px-4 py-3 transition hover:border-orange-400/40 hover:bg-black/40">
        <div>
          <p className="text-xs font-semibold text-white/85">{label}</p>
          <p className="mt-0.5 text-xs text-white/50">{file ? file.name : "Upload JPG, PNG, WEBP or PDF"}</p>
        </div>
        <span className="rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-[11px] font-semibold text-orange-200">{file ? "Change" : "Select"}</span>
        <input type="file" accept=".pdf,image/*" className="hidden" onChange={(e) => onChange(e.target.files?.[0] || null)} />
      </label>
      {error ? <p className="mt-1 text-xs text-red-300">{error}</p> : null}
    </div>
  );
}

function ImageRequiredField({ label, helper, preview, file, error, onChange }) {
  return (
    <div>
      <label className="block cursor-pointer rounded-xl border border-white/12 bg-black/30 p-3 transition hover:border-orange-300/45">
        <div className="mb-2">
          <p className="text-sm font-semibold text-white">{label}</p>
          <p className="text-xs text-white/60">{helper}</p>
        </div>
        <div className="overflow-hidden rounded-lg border border-white/10 bg-black/40">{preview ? <img src={preview} alt={label} className="h-32 w-full object-cover" /> : <div className="flex h-32 items-center justify-center text-xs text-white/55">Upload image</div>}</div>
        <p className="mt-2 text-xs text-white/65">{file ? file.name : "Required"}</p>
        <input type="file" accept="image/*" className="hidden" onChange={(e) => onChange(e.target.files?.[0] || null)} />
      </label>
      {error ? <p className="mt-1 text-xs text-red-300">{error}</p> : null}
    </div>
  );
}

function Chip({ icon: Icon, text, accent = false }) {
  return (<div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${accent ? "border-orange-300/35 bg-orange-500/15 text-orange-100" : "border-white/15 bg-white/[0.04] text-white/80"}`}><Icon size={13} /><span className="font-medium">{text}</span></div>);
}

function TrustCard({ icon: Icon, title, text }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <Icon size={15} className="text-orange-300" />
      <p className="mt-2 text-sm font-semibold text-white">{title}</p>
      <p className="mt-1 text-xs text-white/65">{text}</p>
    </div>
  );
}

function ActionButton({ type, variant, onClick, children, icon: Icon, disabled }) {
  const base = "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-55";
  const tone = variant === "primary" ? "border border-orange-300/40 bg-gradient-to-r from-[#FF6A00] to-orange-500 text-white hover:brightness-110" : "border border-white/20 bg-white/[0.04] text-white hover:bg-white/[0.08]";
  return <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${tone}`}><Icon size={15} className={Icon === Loader2 ? "animate-spin" : ""} />{children}</button>;
}

export default AddHotel;
