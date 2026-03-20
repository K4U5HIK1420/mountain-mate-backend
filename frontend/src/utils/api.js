import axios from "axios";
import { getSupabaseAccessToken } from "./supabase";

const baseURL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:5000/api";

const API = axios.create({
  baseURL,
});

// Interceptor for Authentication (Supabase + Legacy)
API.interceptors.request.use(async (config) => {
  const supabaseToken = await getSupabaseAccessToken();
  const legacyToken = localStorage.getItem("token");

  const token = supabaseToken || legacyToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;

  return config;
});

// --- YAHAN SE NAYE FUNCTIONS (Fixed & Optimized) ---

/**
 * 1. Weather Data Function (OpenWeatherMap)
 * Fetching real-time telemetry for Uttarakhand regions.
 */
export const getWeatherData = async (city) => {
  // Logic Fix: Matching the key name with your .env file
  const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY; 

  if (!API_KEY || API_KEY === "undefined") {
    console.error("🚨 Weather API Key is missing in .env file!");
    return null;
  }

  try {
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather`, {
        params: {
          q: city,
          units: 'metric',
          appid: API_KEY
        }
      }
    );
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      console.warn("⚠️ API Key is valid but might take 2 hours to activate on OpenWeather servers.");
    } else {
      console.error("❌ Weather API Error:", error.response?.data?.message || error.message);
    }
    return null;
  }
};

/**
 * 2. Planner/Trip Functions
 * Saving and retrieving tactical itineraries.
 */
export const saveTrip = (tripData) => API.post('/trips', tripData);
export const getUserTrips = () => API.get('/trips/my-trips');

/**
 * 3. AI Recommendation Engine
 * Fetches smart stays/rides based on user DNA.
 */
export const getAIRecommendations = (preferences) => API.post('/ai/recommend', preferences);

export default API;