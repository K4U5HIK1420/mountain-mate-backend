import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../utils/supabase";
import API from "../utils/api";

const AuthContext = createContext(null);

const LEGACY_TOKEN_KEY = "token";
const LEGACY_USER_KEY = "mm_user";

function getLegacyAuth() {
  try {
    const token = localStorage.getItem(LEGACY_TOKEN_KEY);
    const userRaw = localStorage.getItem(LEGACY_USER_KEY);
    const user = userRaw ? JSON.parse(userRaw) : null;
    return { token: token || null, user };
  } catch {
    return { token: null, user: null };
  }
}

function resolveRole(user) {
  if (!user) return null;
  return (
    user.role ||
    user.app_metadata?.role ||
    user.user_metadata?.role ||
    null
  );
}

export function AuthProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [supabaseUser, setSupabaseUser] = useState(null);
  const [legacyUser, setLegacyUser] = useState(() => getLegacyAuth().user);

  useEffect(() => {
    let mounted = true;

    const syncAuthState = async (sessionValue) => {
      if (!mounted) return;

      setSession(sessionValue ?? null);

      if (!sessionValue) {
        setSupabaseUser(null);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.getUser();
      if (!mounted) return;

      setSupabaseUser(error ? sessionValue.user ?? null : data.user ?? sessionValue.user ?? null);
      setLoading(false);
    };

    if (!supabase) {
      setSession(null);
      setSupabaseUser(null);
      setLoading(false);
      return () => {
        mounted = false;
      };
    }

    supabase.auth.getSession().then(({ data }) => {
      syncAuthState(data.session ?? null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      syncAuthState(newSession ?? null);
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe();
    };
  }, []);

  // 🔐 LOGIN
  const login = async ({ email, password }) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return { user: (await supabase.auth.getUser()).data.user };
  };

  // 📝 REGISTER (Email link sent automatically)
  const register = async ({ email, password, fullName }) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });
    if (error) throw error;
    return true;
  };

  // 🔢 SEND OTP (manual trigger)
  const sendOtp = async (email) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
    });
    if (error) throw error;
    return true;
  };

  // ✅ VERIFY OTP
  const verifyOtp = async (email, token) => {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });
    if (error) throw error;
    return true;
  };

  // 🧓 LEGACY LOGIN
  const loginLegacy = async ({ email, password }) => {
    const res = await API.post("/auth/login", { email, password });
    if (res.data?.token) {
      localStorage.setItem(LEGACY_TOKEN_KEY, res.data.token);
      localStorage.setItem(LEGACY_USER_KEY, JSON.stringify(res.data.user));
      return { user: res.data.user };
    }
    throw new Error(res.data?.message || "Login failed");
  };

  // 🧓 LEGACY REGISTER
  const registerLegacy = async ({ email, password, fullName }) => {
    const res = await API.post("/auth/register", { email, password, fullName });
    if (res.data?.user) {
      localStorage.setItem(LEGACY_TOKEN_KEY, res.data.token);
      localStorage.setItem(LEGACY_USER_KEY, JSON.stringify(res.data.user));
      return { user: res.data.user };
    }
    throw new Error(res.data?.message || "Registration failed");
  };

  // 🚪 SIGN OUT
  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem(LEGACY_TOKEN_KEY);
    localStorage.removeItem(LEGACY_USER_KEY);
    setSession(null);
    setSupabaseUser(null);
    setLegacyUser(null);
  };

  const user = supabaseUser || legacyUser;
  const role = resolveRole(user);

  const value = {
    user,
    role,
    token: session?.access_token || localStorage.getItem(LEGACY_TOKEN_KEY),
    loading,
    session,
    login,
    register,
    sendOtp,       // ✅ NEW
    verifyOtp,     // ✅ NEW
    registerLegacy,
    loginLegacy,
    signOut,
    isSupabaseAvailable: !!supabase,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
