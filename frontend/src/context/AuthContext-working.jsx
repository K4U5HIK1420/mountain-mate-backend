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

export function AuthProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [legacyUser, setLegacyUser] = useState(() => getLegacyAuth().user);

  useEffect(() => {
    let mounted = true;

    if (!supabase) {
      // Fallback when Supabase is not available
      setSession(null);
      setLoading(false);
      return () => {
        mounted = false;
      };
    }

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe();
    };
  }, []);

  const login = async ({ email, password }) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return { user: (await supabase.auth.getUser()).data.user };
    } catch (error) {
      throw error;
    }
  };

  const loginLegacy = async ({ email, password }) => {
    try {
      const res = await API.post("/auth/login", { email, password });
      if (res.data?.token) {
        localStorage.setItem(LEGACY_TOKEN_KEY, res.data.token);
        localStorage.setItem(LEGACY_USER_KEY, JSON.stringify(res.data.user));
        return { user: res.data.user };
      }
      throw new Error(res.data?.message || "Login failed");
    } catch (error) {
      throw error;
    }
  };

  const register = async ({ email, password, fullName }) => {
    try {
      const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } });
      if (error) throw error;
      return { user: (await supabase.auth.getUser()).data.user };
    } catch (error) {
      throw error;
    }
  };

  const registerLegacy = async ({ email, password, fullName }) => {
    try {
      const res = await API.post("/auth/register", { email, password, fullName });
      if (res.data?.user) {
        localStorage.setItem(LEGACY_TOKEN_KEY, res.data.token);
        localStorage.setItem(LEGACY_USER_KEY, JSON.stringify(res.data.user));
        return { user: res.data.user };
      }
      throw new Error(res.data?.message || "Registration failed");
    } catch (error) {
      throw error;
    }
  };

  const signOut = async () => {
    try {
      if (supabase) {
        await supabase.auth.signOut();
      }
      localStorage.removeItem(LEGACY_TOKEN_KEY);
      localStorage.removeItem(LEGACY_USER_KEY);
      setSession(null);
      setLegacyUser(null);
    } catch (error) {
      // Ignore signout errors
    }
  };

  const value = {
    user: session?.user || legacyUser,
    token: session?.access_token || localStorage.getItem(LEGACY_TOKEN_KEY),
    loading,
    session,
    login,
    register,
    registerLegacy,
    loginLegacy,
    signOut,
    isSupabaseAvailable: !!supabase
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
