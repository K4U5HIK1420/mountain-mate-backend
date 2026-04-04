import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Compass,
  IndianRupee,
  MapPin,
  Mountain,
  Users,
} from "lucide-react";
import { Button } from "../ui/Button";

const stepMeta = [
  { id: 1, title: "Destination", subtitle: "Pick where you want to go", icon: MapPin },
  { id: 2, title: "Travel Dates", subtitle: "Choose your mountain window", icon: CalendarRange },
  { id: 3, title: "Travelers", subtitle: "How many people are joining?", icon: Users },
  { id: 4, title: "Budget", subtitle: "Select your spend style", icon: IndianRupee },
  { id: 5, title: "Travel Type", subtitle: "Match itinerary to your intent", icon: Compass },
];

const budgetOptions = [
  { key: "low", label: "Low", desc: "Smart savings and shared options" },
  { key: "medium", label: "Medium", desc: "Balanced comfort and flexibility" },
  { key: "premium", label: "Premium", desc: "Private comfort and faster transfers" },
];

const travelTypeOptions = [
  { key: "pilgrimage", label: "Pilgrimage", icon: Mountain },
  { key: "trek", label: "Trek", icon: Compass },
  { key: "family", label: "Family Trip", icon: Users },
];

const inputClass =
  "w-full rounded-2xl border border-white/15 bg-black/40 px-4 py-3 text-sm text-white outline-none transition focus:border-[#FF6A00]";

function StepShell({ step, children }) {
  const Icon = step.icon;
  return (
    <motion.div
      key={step.id}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -18 }}
      transition={{ duration: 0.25 }}
      className="space-y-5"
    >
      <div className="flex items-start gap-3">
        <div className="rounded-2xl border border-[#FF6A00]/30 bg-[#FF6A00]/10 p-3 text-[#FFB37D]">
          <Icon size={16} />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#FFB37D]">
            Step {step.id} of 5
          </p>
          <h3 className="mt-1 text-xl font-black uppercase italic tracking-tight text-white">{step.title}</h3>
          <p className="mt-1 text-sm text-white/55">{step.subtitle}</p>
        </div>
      </div>
      {children}
    </motion.div>
  );
}

export default function StepForm({
  formData,
  setFormData,
  currentStep,
  setCurrentStep,
  popularRoutes,
  onSavePlan,
}) {
  const currentMeta = stepMeta[currentStep - 1];
  const progress = Math.round((currentStep / 5) * 100);

  const setField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const canGoNext =
    (currentStep === 1 && formData.destination.trim()) ||
    (currentStep === 2 && formData.startDate && formData.endDate) ||
    (currentStep === 3 && Number(formData.travelers) > 0) ||
    (currentStep === 4 && formData.budget) ||
    (currentStep === 5 && formData.travelType);

  return (
    <div className="space-y-6 rounded-[30px] border border-white/10 bg-[linear-gradient(140deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02)),rgba(8,8,8,0.88)] p-5 backdrop-blur-2xl md:p-7">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/45">Progress</p>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#FFB37D]">{progress}%</p>
        </div>
        <div className="h-2 rounded-full bg-white/10">
          <motion.div
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
            className="h-full rounded-full bg-gradient-to-r from-[#FF6A00] to-amber-400"
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {currentStep === 1 && (
          <StepShell step={currentMeta}>
            <div className="space-y-3">
              <input
                value={formData.destination}
                onChange={(e) => setField("destination", e.target.value)}
                className={inputClass}
                placeholder="Kedarnath, Badrinath, Auli..."
                list="strategy-destination-list"
              />
              <datalist id="strategy-destination-list">
                {popularRoutes.map((item) => (
                  <option key={item.destination} value={item.destination} />
                ))}
              </datalist>
              <div className="flex flex-wrap gap-2">
                {popularRoutes.map((item) => (
                  <button
                    key={item.destination}
                    type="button"
                    onClick={() => setField("destination", item.destination)}
                    className="rounded-full border border-white/12 bg-white/5 px-3 py-2 text-[11px] text-white/80 transition hover:border-[#FF6A00]/40 hover:text-white"
                  >
                    {item.destination}
                  </button>
                ))}
              </div>
            </div>
          </StepShell>
        )}

        {currentStep === 2 && (
          <StepShell step={currentMeta}>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-2 text-sm text-white/60">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/45">Start Date</span>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setField("startDate", e.target.value)}
                  className={`${inputClass} [color-scheme:dark]`}
                />
              </label>
              <label className="space-y-2 text-sm text-white/60">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/45">End Date</span>
                <input
                  type="date"
                  min={formData.startDate || undefined}
                  value={formData.endDate}
                  onChange={(e) => setField("endDate", e.target.value)}
                  className={`${inputClass} [color-scheme:dark]`}
                />
              </label>
            </div>
          </StepShell>
        )}

        {currentStep === 3 && (
          <StepShell step={currentMeta}>
            <div className="flex items-center justify-between rounded-2xl border border-white/12 bg-white/5 px-4 py-3">
              <p className="text-sm text-white/70">Travelers</p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setField("travelers", Math.max(1, Number(formData.travelers) - 1))}
                  className="h-9 w-9 rounded-full border border-white/20 bg-black/35 text-white"
                >
                  -
                </button>
                <span className="min-w-8 text-center text-lg font-black text-white">{formData.travelers}</span>
                <button
                  type="button"
                  onClick={() => setField("travelers", Math.min(20, Number(formData.travelers) + 1))}
                  className="h-9 w-9 rounded-full border border-[#FF6A00]/35 bg-[#FF6A00]/15 text-[#FFD4B1]"
                >
                  +
                </button>
              </div>
            </div>
          </StepShell>
        )}

        {currentStep === 4 && (
          <StepShell step={currentMeta}>
            <div className="grid gap-3 sm:grid-cols-3">
              {budgetOptions.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setField("budget", item.key)}
                  className={`rounded-2xl border p-4 text-left transition ${
                    formData.budget === item.key
                      ? "border-[#FF6A00]/45 bg-[#FF6A00]/14"
                      : "border-white/12 bg-white/5 hover:border-white/25"
                  }`}
                >
                  <p className="text-sm font-bold text-white">{item.label}</p>
                  <p className="mt-2 text-xs text-white/55">{item.desc}</p>
                </button>
              ))}
            </div>
          </StepShell>
        )}

        {currentStep === 5 && (
          <StepShell step={currentMeta}>
            <div className="grid gap-3 sm:grid-cols-3">
              {travelTypeOptions.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setField("travelType", item.key)}
                    className={`rounded-2xl border p-4 transition ${
                      formData.travelType === item.key
                        ? "border-[#FF6A00]/45 bg-[#FF6A00]/14"
                        : "border-white/12 bg-white/5 hover:border-white/25"
                    }`}
                  >
                    <Icon size={16} className="text-[#FFB37D]" />
                    <p className="mt-3 text-sm font-bold text-white">{item.label}</p>
                  </button>
                );
              })}
            </div>
          </StepShell>
        )}
      </AnimatePresence>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
            className="rounded-xl px-4 py-2 tracking-[0.18em]"
          >
            <ChevronLeft size={14} />
            Back
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => setCurrentStep((prev) => Math.min(5, prev + 1))}
            disabled={!canGoNext}
            className="rounded-xl px-4 py-2 tracking-[0.18em]"
          >
            Next
            <ChevronRight size={14} />
          </Button>
        </div>
        <Button type="button" variant="neutral" size="sm" onClick={onSavePlan} className="rounded-xl px-4 py-2 tracking-[0.16em]">
          Save Plan
        </Button>
      </div>
    </div>
  );
}
