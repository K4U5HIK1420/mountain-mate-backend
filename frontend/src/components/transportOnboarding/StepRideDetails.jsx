import React from "react";
import { Crosshair, Loader2, MapPin, Navigation } from "lucide-react";
import StepCard from "./StepCard";
import RoutePreview from "../../components/RoutePreview";

const inputClass =
  "w-full rounded-2xl border border-white/15 bg-black/40 px-4 py-3 text-sm text-white outline-none transition focus:border-[#FF6A00]";
const LOCATION_SUGGESTIONS = [
  "Haridwar",
  "Rishikesh",
  "Dehradun",
  "Rudraprayag",
  "Guptkashi",
  "Sonprayag",
  "Ukhimath",
  "Joshimath",
];

function Field({ label, error, children }) {
  return (
    <label className="block space-y-2">
      <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/50">{label}</span>
      {children}
      {error ? <span className="text-xs text-red-300">{error}</span> : null}
    </label>
  );
}

export default function StepRideDetails({
  formData,
  errors,
  onFieldChange,
  onOriginChange,
  onDestinationChange,
  onCaptureLivePickup,
  locating,
  liveFromCoords,
  liveToCoords,
}) {
  return (
    <StepCard
      title="Ride Details"
      subtitle="Tell riders where and when you are going. Only one more required step after this."
      rightSlot={<span className="rounded-full border border-[#FF6A00]/30 bg-[#FF6A00]/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#FFB37D]">Required</span>}
    >
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Origin" error={errors.routeFrom}>
          <div className="space-y-3">
            <div className="relative">
              <MapPin size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#FF6A00]" />
              <input
                name="routeFrom"
                value={formData.routeFrom}
                onChange={onOriginChange}
                list="origin-location-suggestions"
                className={`${inputClass} pl-10`}
                placeholder="Dehradun"
              />
            </div>
            <datalist id="origin-location-suggestions">
              {LOCATION_SUGGESTIONS.map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>
            <button
              type="button"
              onClick={onCaptureLivePickup}
              disabled={locating}
              className="inline-flex items-center gap-2 rounded-full border border-[#FF6A00]/30 bg-[#FF6A00]/10 px-4 py-2 text-[11px] font-bold text-[#FFD4B1] transition hover:bg-[#FF6A00]/20 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {locating ? <Loader2 size={14} className="animate-spin" /> : <Crosshair size={14} />}
              Use live location
            </button>
          </div>
        </Field>

        <Field label="Destination" error={errors.routeTo}>
          <div className="relative">
            <Navigation size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#FF6A00]" />
            <input
              name="routeTo"
              value={formData.routeTo}
              onChange={onDestinationChange}
              list="destination-location-suggestions"
              className={`${inputClass} pl-10`}
              placeholder="Rishikesh"
            />
          </div>
          <datalist id="destination-location-suggestions">
            {LOCATION_SUGGESTIONS.map((item) => (
              <option key={item} value={item} />
            ))}
          </datalist>
        </Field>

        <Field label="Travel Date" error={errors.availableDate}>
          <input
            name="availableDate"
            type="date"
            value={formData.availableDate}
            onChange={onFieldChange}
            className={`${inputClass} [color-scheme:dark]`}
          />
        </Field>
      </div>

      {(formData.routeFrom || formData.routeTo) && (
        <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-4">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-white/50">Route preview</p>
          <RoutePreview pickupCoords={liveFromCoords} destinationCoords={liveToCoords} />
        </div>
      )}
    </StepCard>
  );
}
