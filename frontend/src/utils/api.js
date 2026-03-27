import axios from "axios";
import { getSupabaseAccessToken } from "./supabase";

const baseURL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:5000/api";

const API = axios.create({
  baseURL,
});

// Attach the latest auth token to each backend request when available.
API.interceptors.request.use(
  async (config) => {
    try {
      const supabaseToken = await getSupabaseAccessToken();
      const legacyToken = localStorage.getItem("token");
      const token = supabaseToken || legacyToken;

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      console.error("Uplink Injection Failed:", err);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("Session Expired. Redirecting to login...");
    }
    return Promise.reject(error);
  }
);

export const getDashboardStats = () => API.get("/admin/stats");

export const getReferralStats = () => API.get("/user/referral");

export const redeemReferralCode = (code) => API.post("/user/referral/redeem", { code });

export const getWeatherData = async (location) => {
  const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;
  if (!apiKey || apiKey === "undefined") return null;

  const params =
    typeof location === "string"
      ? { q: location, units: "metric", appid: apiKey }
      : location?.lat != null && location?.lon != null
        ? { lat: location.lat, lon: location.lon, units: "metric", appid: apiKey }
        : null;

  if (!params) return null;

  try {
    const response = await axios.get("https://api.openweathermap.org/data/2.5/weather", {
      params,
    });
    return response.data;
  } catch (error) {
    console.error("Weather Sync Error:", error.message);
    return null;
  }
};

export const saveTrip = (tripData) => API.post("/trips", tripData);
export const getUserTrips = () => API.get("/trips/my-trips");
export const getAIRecommendations = (preferences) => API.post("/ai/recommend", preferences);

export default API;
