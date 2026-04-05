import React from "react";
import StepCard from "./StepCard";

const inputClass =
  "w-full rounded-2xl border border-white/15 bg-black/40 px-4 py-3 text-sm text-white outline-none transition focus:border-[#FF6A00]";

function Field({ label, error, children, helper }) {
  return (
    <label className="block space-y-2">
      <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/50">{label}</span>
      {children}
      {error ? <span className="text-xs text-red-300">{error}</span> : null}
      {!error && helper ? <span className="text-xs text-white/45">{helper}</span> : null}
    </label>
  );
}

export default function StepBasicInfo({ formData, errors, onFieldChange }) {
  return (
    <StepCard
      title="Basic Info"
      subtitle="Required identity details. Fill all fields before moving ahead."
      rightSlot={<span className="rounded-full border border-[#FF6A00]/30 bg-[#FF6A00]/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#FFB37D]">Required</span>}
    >
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Vehicle Model" error={errors.vehicleModel} helper="Example: Innova Crysta, Swift Dzire.">
          <input
            name="vehicleModel"
            value={formData.vehicleModel}
            onChange={onFieldChange}
            className={inputClass}
            placeholder="Innova Crysta"
          />
        </Field>

        <Field label="Plate Number" error={errors.plateNumber} helper="Enter the exact registration number.">
          <input
            name="plateNumber"
            value={formData.plateNumber}
            onChange={onFieldChange}
            className={inputClass}
            placeholder="UK07 XX 1234"
          />
        </Field>

        <Field label="Driver Name" error={errors.driverName} helper="Use your full name as shown on your ID.">
          <input
            name="driverName"
            value={formData.driverName}
            onChange={onFieldChange}
            className={inputClass}
            placeholder="Rahul Singh"
          />
        </Field>

        <Field label="Vehicle Type" error={errors.vehicleType} helper="Choose the main category for faster approvals.">
          <select name="vehicleType" value={formData.vehicleType} onChange={onFieldChange} className={inputClass}>
            <option value="" className="bg-black">Select type</option>
            {[
              "SUV",
              "MUV",
              "Sedan",
              "Hatchback",
              "Tempo Traveller",
              "Taxi",
              "Other",
            ].map((item) => (
              <option key={item} value={item} className="bg-black">
                {item}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Phone Number" error={errors.contactNumber} helper="This is shared with riders after booking.">
          <input
            name="contactNumber"
            value={formData.contactNumber}
            onChange={onFieldChange}
            className={inputClass}
            placeholder="9876543210"
            inputMode="tel"
          />
        </Field>
      </div>
    </StepCard>
  );
}
