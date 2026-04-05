import React, { useState } from "react";
import { ChevronDown, ChevronUp, UploadCloud, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import StepCard from "./StepCard";

const DOCUMENT_SECTIONS = [
  {
    id: "driver",
    title: "Driver documents",
    fields: [
      { key: "driverPhoto", label: "Driver photo" },
      { key: "driverLicenseDoc", label: "Driving license" },
      { key: "driverAadhaarDoc", label: "Aadhaar" },
    ],
  },
  {
    id: "vehicle",
    title: "Vehicle documents",
    fields: [
      { key: "vehicleRcDoc", label: "RC" },
      { key: "vehicleInsuranceDoc", label: "Insurance" },
      { key: "vehiclePermitDoc", label: "Tourist/commercial permit" },
      { key: "pollutionCertificateDoc", label: "PUC" },
      { key: "fitnessCertificateDoc", label: "Fitness certificate" },
    ],
  },
];

function UploadField({ label, file, onChange }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/35 px-4 py-3 transition hover:border-[#FF6A00]/35">
      <div>
        <p className="text-xs font-semibold text-white">{label}</p>
        <p className="text-xs text-white/45">{file ? file.name : "Upload image or PDF"}</p>
      </div>
      <span className="rounded-full border border-[#FF6A00]/30 bg-[#FF6A00]/10 px-3 py-1 text-[10px] font-bold text-[#FFD4B1]">
        {file ? "Change" : "Upload"}
      </span>
      <input type="file" accept=".pdf,image/*" className="hidden" onChange={(e) => onChange(e.target.files?.[0] || null)} />
    </label>
  );
}

export default function StepDocuments({
  documents,
  onDocumentChange,
  images,
  previews,
  onImageChange,
  onRemoveImage,
  formData,
  onFieldChange,
  errors,
}) {
  const [openSections, setOpenSections] = useState({ driver: true, vehicle: false, photos: true });

  const toggleSection = (id) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <StepCard
      title="Documents"
      subtitle="Mandatory KYC fields: Driver License No, Driver Aadhaar No, and Aadhaar photo."
      rightSlot={<span className="rounded-full border border-[#FF6A00]/30 bg-[#FF6A00]/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#FFB37D]">Required</span>}
    >
      <div className="mb-5 grid gap-4 md:grid-cols-2">
        <label className="block space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/50">Driver License No</span>
          <input
            name="driverLicenseNumber"
            value={formData?.driverLicenseNumber || ""}
            onChange={onFieldChange}
            className="w-full rounded-2xl border border-white/15 bg-black/40 px-4 py-3 text-sm text-white outline-none transition focus:border-[#FF6A00]"
            placeholder="DL-042011..."
          />
          {errors?.driverLicenseNumber ? <span className="text-xs text-red-300">{errors.driverLicenseNumber}</span> : null}
        </label>
        <label className="block space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/50">Driver Aadhaar No</span>
          <input
            name="driverAadhaarNumber"
            value={formData?.driverAadhaarNumber || ""}
            onChange={onFieldChange}
            className="w-full rounded-2xl border border-white/15 bg-black/40 px-4 py-3 text-sm text-white outline-none transition focus:border-[#FF6A00]"
            placeholder="XXXX XXXX XXXX"
          />
          {errors?.driverAadhaarNumber ? <span className="text-xs text-red-300">{errors.driverAadhaarNumber}</span> : null}
        </label>
      </div>

      <div className="space-y-4">
        {DOCUMENT_SECTIONS.map((section) => (
          <div key={section.id} className="rounded-2xl border border-white/10 bg-black/20">
            <button
              type="button"
              onClick={() => toggleSection(section.id)}
              className="flex w-full items-center justify-between px-4 py-3 text-left"
            >
              <span className="text-sm font-bold text-white">{section.title}</span>
              {openSections[section.id] ? <ChevronUp size={16} className="text-white/70" /> : <ChevronDown size={16} className="text-white/70" />}
            </button>
            <AnimatePresence initial={false}>
              {openSections[section.id] ? (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-3 px-4 pb-4">
                    {section.fields.map((field) => (
                      <UploadField
                        key={field.key}
                        label={field.label}
                        file={documents[field.key]}
                        onChange={(file) => onDocumentChange(field.key, file)}
                      />
                    ))}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        ))}

        <div className="rounded-2xl border border-white/10 bg-black/20">
          <button
            type="button"
            onClick={() => toggleSection("photos")}
            className="flex w-full items-center justify-between px-4 py-3 text-left"
          >
            <span className="text-sm font-bold text-white">Ride photos (optional)</span>
            {openSections.photos ? <ChevronUp size={16} className="text-white/70" /> : <ChevronDown size={16} className="text-white/70" />}
          </button>
          <AnimatePresence initial={false}>
            {openSections.photos ? (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4">
                  <label className="mb-3 flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-white/20 bg-black/35 p-4 text-sm text-white/70 transition hover:border-[#FF6A00]/35">
                    <UploadCloud size={16} className="text-[#FF6A00]" />
                    Add ride photos
                    <input type="file" accept="image/*" multiple className="hidden" onChange={onImageChange} />
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {previews.map((url, index) => (
                      <div key={url} className="relative overflow-hidden rounded-xl border border-white/10">
                        <img src={url} alt="preview" className="h-20 w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => onRemoveImage(index)}
                          className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                  {!images.length ? <p className="mt-2 text-xs text-white/45">Photos are optional, but they can improve trust and bookings.</p> : null}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      {errors?.driverAadhaarDoc ? <p className="mt-4 text-sm text-red-300">{errors.driverAadhaarDoc}</p> : null}
      <p className="mt-5 text-sm text-[#FFD4B1]">Aadhaar photo is mandatory for publish. Other docs can still be uploaded gradually.</p>
    </StepCard>
  );
}
