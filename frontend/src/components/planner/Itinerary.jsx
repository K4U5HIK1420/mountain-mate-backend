import React from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Bus,
  CarTaxiFront,
  Clock3,
  Download,
  Hotel,
  Share2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "../ui/Button";

const toneMap = {
  high: "border-red-400/30 bg-red-500/12 text-red-200",
  medium: "border-amber-400/30 bg-amber-500/12 text-amber-100",
  low: "border-emerald-400/30 bg-emerald-500/12 text-emerald-100",
};

export default function Itinerary({
  formData,
  plan,
  onEditDay,
  onBookPlan,
  onReserve,
  onShare,
  onExport,
}) {
  return (
    <div className="space-y-5">
      <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(140deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02)),rgba(8,8,8,0.88)] p-5 backdrop-blur-2xl md:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#FFB37D]">Live Strategy Preview</p>
            <h3 className="mt-2 text-2xl font-black uppercase italic tracking-tight text-white">
              {formData.destination || "Destination Pending"} Plan
            </h3>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/70">
            <ShieldCheck size={13} className="text-emerald-300" />
            Trusted by travelers
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Metric title="Estimated Days" value={String(plan.days.length)} />
          <Metric title="Budget Fit" value={plan.budgetLabel} />
          <Metric title="Travelers" value={`${formData.travelers || 1} people`} />
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-white/12 bg-white/5 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/45">Optimized Route</p>
            <p className="mt-2 text-sm leading-7 text-white/80">{plan.routeLine}</p>
          </div>
          <div className="rounded-2xl border border-white/12 bg-white/5 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/45">Transport Mix</p>
            <p className="mt-2 text-sm leading-7 text-white/80">{plan.transportSummary}</p>
            <div className="mt-3 flex items-center gap-2 text-white/55">
              {plan.transportType === "shared" ? <Bus size={14} /> : <CarTaxiFront size={14} />}
              <span className="text-xs">{plan.transportType === "shared" ? "Shared mobility focused" : "Private comfort focused"}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {plan.alerts.map((alert) => (
          <div
            key={alert.title}
            className={`rounded-2xl border p-4 ${toneMap[alert.severity] || toneMap.medium}`}
          >
            <div className="flex items-start gap-3">
              <AlertTriangle size={15} className="mt-0.5" />
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.16em]">{alert.title}</p>
                <p className="mt-1 text-sm">{alert.message}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3 rounded-[30px] border border-white/10 bg-black/35 p-5 md:p-7">
        <div className="flex items-center justify-between gap-3">
          <h4 className="text-lg font-black uppercase italic text-white">Day Wise Itinerary</h4>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#FF6A00]/30 bg-[#FF6A00]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#FFB37D]">
            <Clock3 size={12} />
            Includes buffer
          </div>
        </div>

        <div className="space-y-3">
          {plan.days.map((day, index) => (
            <motion.div
              key={day.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.03 }}
              className="rounded-2xl border border-white/12 bg-white/5 p-4 hover:border-white/25"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/45">Day {index + 1}</p>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FFB37D]">{day.travelMode}</p>
              </div>
              <input
                value={day.title}
                onChange={(e) => onEditDay(day.id, "title", e.target.value)}
                className="mt-2 w-full bg-transparent text-base font-bold text-white outline-none"
              />
              <input
                value={day.route}
                onChange={(e) => onEditDay(day.id, "route", e.target.value)}
                className="mt-2 w-full bg-transparent text-sm text-white/70 outline-none"
              />
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <label className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                  <span className="text-[9px] font-black uppercase tracking-[0.16em] text-white/45">Stay</span>
                  <input
                    value={day.stay}
                    onChange={(e) => onEditDay(day.id, "stay", e.target.value)}
                    className="mt-1 w-full bg-transparent text-sm text-white outline-none"
                  />
                </label>
                <label className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                  <span className="text-[9px] font-black uppercase tracking-[0.16em] text-white/45">Tip</span>
                  <input
                    value={day.tip}
                    onChange={(e) => onEditDay(day.id, "tip", e.target.value)}
                    className="mt-1 w-full bg-transparent text-sm text-white outline-none"
                  />
                </label>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="grid gap-3 rounded-[30px] border border-orange-500/20 bg-orange-500/8 p-5 md:grid-cols-2 md:p-6">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-200">Conversion Snapshot</p>
          <p className="mt-2 text-sm leading-7 text-white/85">
            Save up to <b>18%</b> with route clustering and early stay reservation. One click to reserve your complete travel stack.
          </p>
          <div className="mt-3 flex items-center gap-2 text-[11px] text-orange-100">
            <Sparkles size={14} />
            Clear route + verified stays + transport synced
          </div>
        </div>
        <div className="grid gap-2">
          <Button size="sm" onClick={onBookPlan} className="rounded-xl px-4 py-3 tracking-[0.16em]">
            Book This Plan
          </Button>
          <Button size="sm" variant="neutral" onClick={onReserve} className="rounded-xl px-4 py-3 tracking-[0.14em]">
            Reserve Stays & Rides
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button size="sm" variant="ghost" onClick={onShare} className="rounded-xl px-4 py-3 tracking-[0.12em]">
              <Share2 size={13} />
              Share
            </Button>
            <Button size="sm" variant="ghost" onClick={onExport} className="rounded-xl px-4 py-3 tracking-[0.12em]">
              <Download size={13} />
              PDF
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({ title, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/40">{title}</p>
      <p className="mt-2 text-base font-bold text-white">{value}</p>
    </div>
  );
}
