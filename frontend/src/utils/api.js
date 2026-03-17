import axios from "axios";
import { getSupabaseAccessToken } from "./supabase";

const baseURL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:5000/api";

const API = axios.create({
  baseURL,
});

API.interceptors.request.use(async (config) => {
  const supabaseToken = await getSupabaseAccessToken();
  const legacyToken = localStorage.getItem("token");

  const token = supabaseToken || legacyToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;

  return config;
});

export default API;