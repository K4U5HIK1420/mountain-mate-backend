import React from "react";
import { IndianRupee, Users } from "lucide-react";
import StepCard from "./StepCard";

const inputClass =
  "w-full rounded-2xl border border-white/15 bg-black/40 px-4 py-3 text-sm text-white outline-none transition focus:border-[#FF6A00]";

export default function StepPricingSeats({ formData, onFieldChange }) {
  const isSharedTaxi = String(formData.rideMode || "car_pooling") === "shared_taxi";

  return (
    <StepCard
      title="Pricing & Seats"
      subtitle={
        isSharedTaxi
          ? "Define seat count and per-seat pricing for your shared taxi route."
          : "Optional for now. Add this now for better conversion or skip and complete later."
      }
      rightSlot={<span className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/65">Optional</span>}
    >
      <div className="grid gap-5 md:grid-cols-2">
        <label className="block space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/50">
            {isSharedTaxi ? "Price Per Seat (INR)" : "Price Per Seat (INR)"}
          </span>
          <div className="relative">
            <IndianRupee size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#FF6A00]" />
            <input
              name="pricePerSeat"
              value={formData.pricePerSeat}
              onChange={onFieldChange}
              type="number"
              min="0"
              className={`${inputClass} pl-10`}
              placeholder="800"
            />
          </div>
          <span className="text-xs text-white/45">Tip: round numbers convert better on mobile.</span>
        </label>

        <label className="block space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/50">
            {isSharedTaxi ? "Total Seats" : "Seats Available"}
          </span>
          <div className="relative">
            <Users size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#FF6A00]" />
            <input
              name="seatsAvailable"
              value={formData.seatsAvailable}
              onChange={onFieldChange}
              type="number"
              min="1"
              className={`${inputClass} pl-10`}
              placeholder="3"
            />
          </div>
          <span className="text-xs text-white/45">
            {isSharedTaxi ? "Shared taxis usually perform best with 4-7 seats." : "Keeping 1-4 seats usually increases booking confidence."}
          </span>
        </label>
      </div>

      <div className="mt-6 rounded-2xl border border-[#FF6A00]/20 bg-[#FF6A00]/10 p-4 text-sm text-[#FFD4B1]">
        Documents can be uploaded later. You can publish your ride now and complete these details from Manage Rides.
      </div>
    </StepCard>
  );
}
