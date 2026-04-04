import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Compass, Route, ShieldCheck, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Container } from "../components/ui/Container";
import { useNotify } from "../context/NotificationContext";
import StepForm from "../components/planner/StepForm";
import Itinerary from "../components/planner/Itinerary";

const STORAGE_KEY = "mountain_mate_strategy_planner_v2";

const popularRoutes = [
  { destination: "Kedarnath", path: ["Delhi", "Rishikesh", "Guptkashi", "Kedarnath"] },
  { destination: "Badrinath", path: ["Delhi", "Rishikesh", "Joshimath", "Badrinath"] },
  { destination: "Auli", path: ["Delhi", "Rishikesh", "Joshimath", "Auli"] },
  { destination: "Valley of Flowers", path: ["Delhi", "Rishikesh", "Joshimath", "Govindghat"] },
];

const budgetLabelMap = {
  low: "Low Budget",
  medium: "Medium Budget",
  premium: "Premium",
};

const monthDemandMap = {
  Kedarnath: [5, 6, 9, 10],
  Badrinath: [5, 6, 9, 10],
  Auli: [12, 1, 2],
};

const monthWeatherRisk = [7, 8];

const initialFormData = {
  destination: "",
  startDate: "",
  endDate: "",
  travelers: 2,
  budget: "medium",
  travelType: "pilgrimage",
};

const dayInMs = 24 * 60 * 60 * 1000;

const getDateCount = (startDate, endDate) => {
  if (!startDate || !endDate) return 4;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 4;
  return Math.max(2, Math.round((end - start) / dayInMs) + 1);
};

const findRoutePath = (destination) => {
  const match = popularRoutes.find(
    (item) => item.destination.toLowerCase() === String(destination || "").trim().toLowerCase()
  );
  return match?.path || ["Delhi", "Rishikesh", destination || "Destination"];
};

const buildAlerts = (formData) => {
  const destination = String(formData.destination || "").trim();
  const startMonth = formData.startDate ? new Date(formData.startDate).getMonth() + 1 : null;
  const alerts = [];

  if (startMonth && monthDemandMap[destination]?.includes(startMonth)) {
    alerts.push({
      title: "High demand window",
      message: "Stays and rides can fill fast. Pre-booking recommended for better rates.",
      severity: "high",
    });
  }

  if (startMonth && monthWeatherRisk.includes(startMonth)) {
    alerts.push({
      title: "Weather risk",
      message: "Monsoon disruption possible. Keep flexible buffers and earlier departure slots.",
      severity: "medium",
    });
  }

  if (destination === "Kedarnath" || destination === "Badrinath") {
    alerts.push({
      title: "Route instability",
      message: "Mountain roads may experience temporary blocks. Buffer time has been added.",
      severity: "medium",
    });
  }

  if (!alerts.length) {
    alerts.push({
      title: "Route health stable",
      message: "Current strategy has normal risk profile. Keep weather checks 24h before departure.",
      severity: "low",
    });
  }

  return alerts;
};

const buildTransportSummary = (formData) => {
  const budget = formData.budget || "medium";
  const travelers = Number(formData.travelers || 1);

  if (budget === "low") {
    return {
      transportType: "shared",
      transportSummary:
        travelers >= 4
          ? "Intercity shared SUV + local shared cabs for mountain segments."
          : "Volvo/Bus till base hubs + shared jeep/cab for final stretch.",
    };
  }

  if (budget === "premium") {
    return {
      transportType: "private",
      transportSummary:
        "Private SUV transfers with priority early slots. Optional helicopter segment for pilgrimage routes.",
    };
  }

  return {
    transportType: "private",
    transportSummary:
      "Hybrid strategy: private cab for long legs, shared local options where efficient.",
  };
};

const buildPlanFromInput = (formData) => {
  const path = findRoutePath(formData.destination);
  const dayCount = getDateCount(formData.startDate, formData.endDate);
  const { transportType, transportSummary } = buildTransportSummary(formData);
  const alerts = buildAlerts(formData);
  const destination = formData.destination || "Destination";

  const days = [];
  const travelTypeLabel =
    formData.travelType === "trek"
      ? "Trek"
      : formData.travelType === "family"
        ? "Family comfort"
        : "Pilgrimage";

  days.push({
    id: "day-1",
    title: `Depart for ${path[1] || destination}`,
    route: `${path[0]} → ${path[1] || destination}`,
    stay: `${path[1] || destination} town stay`,
    travelMode: transportType === "shared" ? "Shared transfer" : "Private cab",
    tip: "Start before 6 AM to avoid uphill traffic delays.",
  });

  if (path.length > 3) {
    days.push({
      id: "day-2",
      title: "Move closer to base camp",
      route: `${path[1]} → ${path[2]}`,
      stay: `${path[2]} stay with early check-in`,
      travelMode: transportType === "shared" ? "Shared jeep" : "SUV transfer",
      tip: "Keep one light day for acclimatization.",
    });
  }

  days.push({
    id: "day-3",
    title: `${destination} main experience`,
    route: `${path[path.length - 2] || path[0]} → ${destination}`,
    stay: `${destination} stay (verified partner preferred)`,
    travelMode: formData.travelType === "trek" ? "Trek + local transfer" : "Road access",
    tip: `${travelTypeLabel} day: keep permit and ID copies ready.`,
  });

  if (dayCount >= 4) {
    days.push({
      id: "day-4",
      title: "Buffer and local exploration",
      route: `${destination} local circuit`,
      stay: `${destination} or nearby hub`,
      travelMode: "Local mobility",
      tip: "Use this day for weather buffer or recovery.",
    });
  }

  if (dayCount >= 5) {
    days.push({
      id: "day-5",
      title: "Return leg",
      route: `${destination} → ${path[1]} → ${path[0]}`,
      stay: "Optional transit stay",
      travelMode: transportType === "shared" ? "Shared + bus" : "Private return transfer",
      tip: "Avoid late descent to reduce mountain driving risk.",
    });
  }

  while (days.length < dayCount) {
    const idx = days.length + 1;
    days.push({
      id: `day-${idx}`,
      title: `Flexible Day ${idx}`,
      route: `${destination} surrounding routes`,
      stay: `${destination} alternate stay`,
      travelMode: "Flexible",
      tip: "Keep this day for weather, crowds, or rest.",
    });
  }

  return {
    routeLine: path.join(" → "),
    budgetLabel: budgetLabelMap[formData.budget] || "Medium Budget",
    transportType,
    transportSummary,
    alerts,
    days: days.slice(0, dayCount),
  };
};

export default function Planner() {
  const navigate = useNavigate();
  const { notify } = useNotify();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(initialFormData);
  const [dayEdits, setDayEdits] = useState({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed?.formData) {
        setFormData((prev) => ({ ...prev, ...parsed.formData }));
      }
      if (parsed?.dayEdits && typeof parsed.dayEdits === "object") {
        setDayEdits(parsed.dayEdits);
      }
    } catch {
      // Skip corrupt local state.
    }
  }, []);

  const generatedPlan = useMemo(() => buildPlanFromInput(formData), [formData]);

  const mergedPlan = useMemo(() => {
    const days = generatedPlan.days.map((day) => ({
      ...day,
      ...(dayEdits[day.id] || {}),
    }));
    return { ...generatedPlan, days };
  }, [generatedPlan, dayEdits]);

  const handleSavePlan = () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        formData,
        dayEdits,
        savedAt: new Date().toISOString(),
      })
    );
    notify("Strategy plan saved locally", "success");
  };

  const handleEditDay = (dayId, field, value) => {
    setDayEdits((prev) => ({
      ...prev,
      [dayId]: {
        ...(prev[dayId] || {}),
        [field]: value,
      },
    }));
  };

  const handleShare = async () => {
    const payload = {
      destination: formData.destination,
      route: mergedPlan.routeLine,
      days: mergedPlan.days.length,
      budget: mergedPlan.budgetLabel,
    };
    const text = `Mountain Mate Plan: ${payload.destination || "Trip"} | ${payload.route} | ${payload.days} days | ${payload.budget}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Mountain Mate Strategy Plan", text });
      } else {
        await navigator.clipboard.writeText(text);
      }
      notify("Plan summary ready to share", "success");
    } catch {
      notify("Share action cancelled", "error");
    }
  };

  const handleExport = () => {
    notify("Opening print view for PDF export", "success");
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#050505] pb-20 pt-32 text-white md:pt-36">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute left-[5%] top-12 h-[22rem] w-[22rem] rounded-full bg-orange-500/12 blur-[120px]" />
        <div className="absolute bottom-[-5rem] right-[4%] h-[24rem] w-[24rem] rounded-full bg-amber-400/8 blur-[120px]" />
      </div>

      <Container className="relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-8 rounded-[34px] border border-white/10 bg-black/35 p-5 backdrop-blur-2xl md:p-7"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.28em] text-[#FFB37D]">
                <Sparkles size={12} />
                Strategy Planner
              </p>
              <h1 className="mt-3 text-4xl font-black uppercase italic tracking-[-0.04em] text-white md:text-6xl">
                Plan Smarter.
                <span className="ml-2 bg-gradient-to-r from-orange-300 to-amber-200 bg-clip-text text-transparent">Travel Better.</span>
              </h1>
              <p className="mt-3 max-w-3xl text-sm text-white/60 md:text-base">
                Build your complete mountain travel strategy with live itinerary, route optimization, stay suggestions, and transport planning.
              </p>
            </div>
            <div className="grid gap-2 text-right">
              <div className="inline-flex items-center justify-end gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/50">
                <Route size={12} />
                Delhi to mountain optimized routes
              </div>
              <div className="inline-flex items-center justify-end gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/50">
                <ShieldCheck size={12} />
                Conversion-first booking flow
              </div>
              <div className="inline-flex items-center justify-end gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/50">
                <Compass size={12} />
                Live editable itinerary blocks
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-5">
            <StepForm
              formData={formData}
              setFormData={setFormData}
              currentStep={currentStep}
              setCurrentStep={setCurrentStep}
              popularRoutes={popularRoutes}
              onSavePlan={handleSavePlan}
            />

            <div className="rounded-[30px] border border-white/10 bg-black/30 p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/45">Suggested Popular Routes</p>
              <div className="mt-3 grid gap-2">
                {popularRoutes.map((item) => (
                  <button
                    key={item.destination}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, destination: item.destination }))}
                    className="rounded-xl border border-white/12 bg-white/5 px-3 py-3 text-left transition hover:border-[#FF6A00]/40"
                  >
                    <p className="text-sm font-bold text-white">{item.destination}</p>
                    <p className="mt-1 text-xs text-white/55">{item.path.join(" → ")}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Itinerary
            formData={formData}
            plan={mergedPlan}
            onEditDay={handleEditDay}
            onBookPlan={() => navigate("/bookings")}
            onReserve={() => {
              navigate("/explore-stays");
              notify("Reserve stays first, then add rides", "success");
            }}
            onShare={handleShare}
            onExport={handleExport}
          />
        </div>
      </Container>
    </div>
  );
}
