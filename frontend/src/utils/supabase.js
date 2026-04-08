import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || "").trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();

export const hasSupabaseEnv = !!(supabaseUrl && supabaseAnonKey);

if (!hasSupabaseEnv) {
  // Supabase environment variables missing
}

export const supabase = hasSupabaseEnv
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

let cachedAccessToken = null;
let sessionLoadPromise = null;

if (supabase) {
  sessionLoadPromise = supabase.auth.getSession().then(({ data, error }) => {
    cachedAccessToken = error ? null : data?.session?.access_token || null;
    return cachedAccessToken;
  });

  supabase.auth.onAuthStateChange((_event, session) => {
    cachedAccessToken = session?.access_token || null;
  });
}

export async function getSupabaseAccessToken() {
  if (!supabase) return null;
  if (cachedAccessToken) return cachedAccessToken;
  if (sessionLoadPromise) return sessionLoadPromise;

  const { data, error } = await supabase.auth.getSession();
  cachedAccessToken = error ? null : data?.session?.access_token || null;
  return cachedAccessToken;
}

