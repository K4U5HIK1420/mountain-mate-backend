import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
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

  // Keep legacy user in sync across tabs
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === LEGACY_USER_KEY || e.key === LEGACY_TOKEN_KEY) {
        setLegacyUser(getLegacyAuth().user);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const value = useMemo(() => {
    const sbUser = session?.user ?? null;
    const accessToken = session?.access_token ?? null;
    const sbRole =
      sbUser?.app_metadata?.role || sbUser?.user_metadata?.role || sbUser?.role || null;

    const legacyToken = localStorage.getItem(LEGACY_TOKEN_KEY);
    const isLegacy = !!legacyToken && !!legacyUser;

    const user = sbUser || legacyUser || null;
    const role = sbRole || legacyUser?.role || null;

    return {
      loading,
      session,
      user,
      accessToken,
      role,
      isSupabase: !!sbUser,
      isLegacy,
      signOut: async () => {
        // sign out both systems safely
        try {
          if (sbUser) await supabase.auth.signOut();
        } catch {
          // ignore signout errors
        }
        localStorage.removeItem(LEGACY_TOKEN_KEY);
        localStorage.removeItem(LEGACY_USER_KEY);
        setLegacyUser(null);
      },
      loginLegacy: async ({ email, password }) => {
        const res = await API.post("/user/login", { email, password });
        const token = res.data?.token;
        const u = res.data?.user;
        if (!token || !u) throw new Error(res.data?.message || "Login failed");
        localStorage.setItem(LEGACY_TOKEN_KEY, token);
        localStorage.setItem(LEGACY_USER_KEY, JSON.stringify(u));
        setLegacyUser(u);
        return u;
      },
      registerLegacy: async ({ name, email, password }) => {
        const res = await API.post("/user/register", { name, email, password });
        const token = res.data?.token;
        const u = res.data?.user;
        if (!token || !u) throw new Error(res.data?.message || "Registration failed");
        localStorage.setItem(LEGACY_TOKEN_KEY, token);
        localStorage.setItem(LEGACY_USER_KEY, JSON.stringify(u));
        setLegacyUser(u);
        return u;
      },
      refreshLegacyMe: async () => {
        const token = localStorage.getItem(LEGACY_TOKEN_KEY);
        if (!token) return null;
        const res = await API.get("/user/me");
        const u = res.data?.user;
        if (u) {
          localStorage.setItem(LEGACY_USER_KEY, JSON.stringify(u));
          setLegacyUser(u);
        }
        return u || null;
      },
    };
  }, [loading, session, legacyUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

