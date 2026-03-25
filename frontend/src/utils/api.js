import axios from "axios";
import { getSupabaseAccessToken } from "./supabase";

const baseURL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:5000/api";

const API = axios.create({
  baseURL,
});

// ✅ REQUEST INTERCEPTOR: Har request ke sath token attach karega
API.interceptors.request.use(async (config) => {
  try {
    const supabaseToken = await getSupabaseAccessToken();
    const legacyToken = localStorage.getItem("token");

    const token = supabaseToken || legacyToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (err) {
    console.error("🛰️ Uplink Injection Failed:", err);
  }
  return config;
}, (error) => Promise.reject(error));

// ✅ RESPONSE INTERCEPTOR: Global Error Handling (Optional par recommended)
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("🚨 Session Expired. Redirecting to login...");
      // localStorage.removeItem("token"); // Optional: Clear stale token
    }
    return Promise.reject(error);
  }
);

// --- 🏔️ DYNAMIC FUNCTIONS (TACTICAL EXPORTS) ---

/**
 * 1. Admin Dashboard Stats
 */
export const getDashboardStats = () => API.get('/admin/stats');

/**
 * 2. Referral System Functions (NEW)
 */
// GET: User ka code, credits aur invite count lane ke liye
export const getReferralStats = () => API.get('/user/referral');

// POST: Kisi aur ka code redeem karne ke liye
export const redeemReferralCode = (code) => API.post('/user/referral/redeem', { code });

/**
 * 3. Weather Intelligence
 */
export const getWeatherData = async (city) => {
  const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY; 
  if (!API_KEY || API_KEY === "undefined") return null;

  try {
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather`, {
        params: { q: city, units: 'metric', appid: API_KEY }
      }
    );
    return response.data;
  } catch (error) {
    console.error("❌ Weather Sync Error:", error.message);
    return null;
  }
};

/**
 * 4. Planner & AI Expedition Functions
 */
export const saveTrip = (tripData) => API.post('/trips', tripData);
export const getUserTrips = () => API.get('/trips/my-trips');
export const getAIRecommendations = (preferences) => API.post('/ai/recommend', preferences);

export default API;