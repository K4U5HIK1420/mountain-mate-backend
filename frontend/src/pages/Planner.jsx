import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, MapPin, CloudSun, Sparkles, Plus, Trash2, Loader2, Zap } from "lucide-react";
import { Container } from "../components/ui/Container";
import { useNotify } from "../context/NotificationContext";
import { getAIRecommendations, getUserTrips, getWeatherData, saveTrip, updateTrip } from "../utils/api";

const createEmptyDay = (id = Date.now()) => ({
  id,
  title: "",
  location: "",
  activity: "",
});

const Planner = () => {
  const { notify } = useNotify();
  const [tripId, setTripId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [advisorLoading, setAdvisorLoading] = useState(false);
  const [days, setDays] = useState([createEmptyDay(1)]);
  const [weather, setWeather] = useState({ temp: "--", status: "Add a location", humidity: 0, wind: 0 });
  const [tripTitle, setTripTitle] = useState("");
  const [advisorMessage, setAdvisorMessage] = useState(
    "Add your trip details to get AI suggestions based on your itinerary and current weather."
  );

  const primaryLocation = useMemo(
    () => days.find((day) => day.location?.trim())?.location?.trim() || "",
    [days]
  );

  useEffect(() => {
    const hydrateTrip = async () => {
      try {
        const res = await getUserTrips();
        const latestTrip = res.data?.data?.[0];
        if (!latestTrip) return;

        setTripId(latestTrip._id);
        setTripTitle(latestTrip.title || "");

        if (Array.isArray(latestTrip.itinerary) && latestTrip.itinerary.length > 0) {
          setDays(
            latestTrip.itinerary.map((day, index) => ({
              id: `${latestTrip._id}-${index}`,
              title: day.title || "",
              location: day.location || "",
              activity: day.activity || "",
            }))
          );
        }
      } catch {
        // Keep the blank planner for first-time users.
      }
    };

    hydrateTrip();
  }, []);

  useEffect(() => {
    const loadWeather = async () => {
      if (!primaryLocation) {
        setWeather({ temp: "--", status: "Add a location", humidity: 0, wind: 0 });
        return;
      }

      try {
        const weatherData = await getWeatherData(primaryLocation);
        if (!weatherData) {
          setWeather({ temp: "--", status: "Unavailable", humidity: 0, wind: 0 });
          return;
        }

        setWeather({
          temp: Math.round(weatherData.main.temp),
          status: "Live",
          humidity: weatherData.main.humidity,
          wind: weatherData.wind.speed,
        });
      } catch {
        setWeather({ temp: "--", status: "Unavailable", humidity: 0, wind: 0 });
      }
    };

    loadWeather();
  }, [primaryLocation]);

  const addDay = () => {
    setDays((prev) => [...prev, createEmptyDay()]);
    notify("New day added", "success");
  };

  const removeDay = (id) => {
    if (days.length <= 1) return;
    setDays((prev) => prev.filter((day) => day.id !== id));
    notify("Day removed", "success");
  };

  const updateDayField = (id, field, value) => {
    setDays((prev) => prev.map((day) => (day.id === id ? { ...day, [field]: value } : day)));
  };

  const serializeItinerary = () =>
    days.map((day, index) => ({
      day: index + 1,
      title: day.title?.trim() || `Day ${index + 1}`,
      location: day.location?.trim() || "",
      activity: day.activity?.trim() || "",
    }));

  const handleSave = async () => {
    const normalizedTitle = tripTitle.trim();
    if (!normalizedTitle) {
      notify("Add a trip title before saving", "error");
      return;
    }

    setSaving(true);
    try {
      const payload = { title: normalizedTitle, itinerary: serializeItinerary() };
      const res = tripId ? await updateTrip(tripId, payload) : await saveTrip(payload);
      const savedTrip = res.data?.data;
      if (savedTrip?._id) setTripId(savedTrip._id);
      notify("Planner synced successfully", "success");
    } catch (err) {
      notify(err?.response?.data?.message || "Planner sync failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const runAdvisor = async () => {
    setAdvisorLoading(true);
    try {
      const prompt = [
        `Trip title: ${tripTitle || "Untitled trip"}`,
        `Primary location: ${primaryLocation || "Not set"}`,
        `Weather: ${weather.temp}C, ${weather.status}, humidity ${weather.humidity}%, wind ${weather.wind} km/h`,
        `Itinerary: ${JSON.stringify(serializeItinerary())}`,
        "Reply with a concise itinerary recommendation, one safety note, and one next best action.",
      ].join("\n");

      const res = await getAIRecommendations(prompt);
      setAdvisorMessage(res.data?.answer || "No AI guidance was returned for this itinerary yet.");
      notify("Advisor uplink complete", "success");
    } catch (err) {
      setAdvisorMessage("AI guidance is unavailable right now. You can still save and manage your trip manually.");
      notify(err?.response?.data?.answer || "Advisor uplink failed", "error");
    } finally {
      setAdvisorLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-32 md:pt-40 pb-20 selection:bg-orange-600 relative overflow-x-hidden font-sans">
      <div className="fixed top-[-10%] right-[-10%] w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-orange-600/5 blur-[100px] md:blur-[150px] rounded-full pointer-events-none" />

      <Container className="px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-16 md:mb-24 gap-10 border-b border-white/5 pb-12"
        >
          <div className="max-w-xl">
            <div className="flex items-center gap-3 text-orange-500 mb-6 group cursor-pointer">
              <Calendar size={18} className="group-hover:rotate-12 transition-transform" />
              <span className="font-black uppercase tracking-[0.4em] text-[8px] md:text-[10px] italic">
                Tactical Itinerary Control
              </span>
            </div>
            <h1 className="text-5xl md:text-8xl lg:text-[9rem] font-black italic uppercase tracking-tighter leading-[0.85] text-white">
              STRATEGY <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-white">PLANNER.</span>
            </h1>
          </div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="w-full lg:w-auto bg-white/[0.03] backdrop-blur-3xl border border-white/10 p-5 md:p-8 rounded-[30px] md:rounded-[40px] flex flex-col sm:flex-row items-center gap-6 md:gap-10 shadow-3xl"
          >
            <div className="text-center sm:text-left flex-1">
              <p className="text-[8px] md:text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">
                Trip Name
              </p>
              <input
                value={tripTitle}
                onChange={(e) => setTripTitle(e.target.value)}
                placeholder="Enter trip name"
                className="font-black italic text-white text-xl md:text-2xl bg-transparent outline-none tracking-tighter w-full max-w-[260px] placeholder:text-white/20"
              />
            </div>
            <div className="hidden sm:block h-12 w-[1px] bg-white/10" />
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full sm:w-auto bg-orange-600 hover:bg-white hover:text-black px-10 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-orange-600/20 italic disabled:opacity-70 disabled:hover:bg-orange-600 disabled:hover:text-white"
            >
              {saving ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin" />
                  Saving
                </span>
              ) : (
                "Save Plan"
              )}
            </button>
          </motion.div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
          <div className="lg:col-span-8 space-y-12 md:space-y-16">
            <AnimatePresence mode="popLayout">
              {days.map((day, index) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={day.id}
                  className="relative flex gap-4 md:gap-10 items-start group"
                >
                  <div className="flex flex-col items-center flex-shrink-0 pt-2">
                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-[20px] md:rounded-[28px] bg-white/5 border border-white/10 flex items-center justify-center font-black italic text-orange-500 group-hover:bg-orange-600 group-hover:text-white transition-all shadow-xl text-sm md:text-xl">
                      {index + 1 < 10 ? `0${index + 1}` : index + 1}
                    </div>
                    {index !== days.length - 1 && (
                      <div className="w-[1px] h-32 md:h-44 bg-gradient-to-b from-orange-600/40 to-transparent my-4" />
                    )}
                  </div>

                  <div className="flex-1 bg-white/[0.02] border border-white/5 p-6 md:p-12 rounded-[35px] md:rounded-[55px] hover:border-orange-500/20 transition-all relative overflow-hidden shadow-2xl">
                    <button
                      onClick={() => removeDay(day.id)}
                      className="absolute top-6 right-6 md:top-10 md:right-10 text-white/10 hover:text-red-500 transition-colors z-10"
                    >
                      <Trash2 size={20} />
                    </button>

                    <div className="flex items-center gap-3 text-orange-500 mb-6 font-black uppercase text-[8px] md:text-[10px] tracking-widest">
                      <MapPin size={14} />
                      <input
                        value={day.location}
                        onChange={(e) => updateDayField(day.id, "location", e.target.value)}
                        className="bg-transparent focus:outline-none w-full italic placeholder:text-white/10"
                        placeholder="Location"
                      />
                    </div>

                    <input
                      className="bg-transparent text-2xl md:text-4xl font-black italic tracking-tighter text-white focus:outline-none w-full mb-4 py-1 placeholder:text-white/18"
                      value={day.title}
                      onChange={(e) => updateDayField(day.id, "title", e.target.value)}
                      placeholder="Day title"
                    />
                    <textarea
                      className="bg-transparent text-sm md:text-base text-white/40 font-medium leading-relaxed w-full focus:outline-none resize-none overflow-hidden tracking-tight placeholder:text-white/18"
                      value={day.activity}
                      onChange={(e) => updateDayField(day.id, "activity", e.target.value)}
                      rows="2"
                      placeholder="Activity details"
                    />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            <button
              onClick={addDay}
              className="w-full py-16 md:py-24 border-2 border-dashed border-white/5 rounded-[40px] md:rounded-[60px] flex flex-col items-center justify-center gap-5 text-white/10 hover:border-orange-600/40 hover:text-orange-500 transition-all group bg-white/[0.01]"
            >
              <div className="p-5 rounded-full bg-white/5 group-hover:bg-orange-600/10 transition-colors">
                <Plus size={32} className="group-hover:rotate-90 transition-transform duration-500" />
              </div>
              <span className="font-black uppercase tracking-[0.6em] text-[8px] md:text-[10px] italic">
                Add Day
              </span>
            </button>
          </div>

          <div className="lg:col-span-4 space-y-8">
            <div className="bg-[#0a0a0a] border border-white/5 p-10 rounded-[40px] md:rounded-[50px] relative overflow-hidden group shadow-3xl">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                <CloudSun size={100} className="text-orange-500" />
              </div>
              <p className="text-white/20 text-[9px] font-black uppercase tracking-widest mb-10 italic">
                Weather
              </p>
              <div className="space-y-2 relative z-10">
                <h3 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-white">
                  {primaryLocation || "Location pending"}
                </h3>
                <p className="text-orange-500 font-black text-3xl italic tracking-tighter">
                  {weather.temp}°C / {weather.status}
                </p>
              </div>
              <div className="mt-12 pt-8 border-t border-white/5 flex justify-between text-[9px] font-black text-white/40 uppercase tracking-widest relative z-10">
                <span>Humidity: {weather.humidity}%</span>
                <span>Wind: {weather.wind} km/h</span>
              </div>
            </div>

            <div className="bg-orange-600 p-10 rounded-[40px] md:rounded-[50px] shadow-3xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:rotate-12 transition-transform">
                <Sparkles size={80} />
              </div>
              <div className="flex items-center gap-3 mb-8 relative z-10">
                <Zap size={18} className="text-white animate-pulse" />
                <span className="text-white font-black uppercase tracking-widest text-[9px] italic">
                  AI Advisor
                </span>
              </div>
              <p className="text-white font-bold italic leading-relaxed text-base md:text-lg relative z-10">
                {advisorMessage}
              </p>
              <button
                onClick={runAdvisor}
                disabled={advisorLoading}
                className="mt-12 w-full bg-white text-black py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-xl italic hover:bg-black hover:text-white disabled:opacity-70 disabled:hover:bg-white disabled:hover:text-black"
              >
                {advisorLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin" />
                    Connecting
                  </span>
                ) : (
                  "Generate Advice"
                )}
              </button>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default Planner;
