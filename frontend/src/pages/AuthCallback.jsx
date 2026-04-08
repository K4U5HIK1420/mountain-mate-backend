import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "../utils/supabase";

function resolveNextPath(raw) {
  if (!raw || typeof raw !== "string") return "/explore-stays";
  if (!raw.startsWith("/")) return "/explore-stays";
  if (raw.startsWith("//")) return "/explore-stays";
  return raw;
}

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [errorMessage, setErrorMessage] = useState("");

  const nextPath = useMemo(() => resolveNextPath(searchParams.get("next")), [searchParams]);

  useEffect(() => {
    let active = true;

    const finishOAuth = async () => {
      try {
        if (!supabase) {
          throw new Error("Authentication service is not configured.");
        }

        const initialSessionResult = await supabase.auth.getSession();
        if (initialSessionResult.error) {
          throw initialSessionResult.error;
        }

        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        if (!initialSessionResult.data?.session && code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }

        const hash = window.location.hash.replace(/^#/, "");
        if (hash) {
          const hashParams = new URLSearchParams(hash);
          const accessToken = hashParams.get("access_token");
          const refreshToken = hashParams.get("refresh_token");
          if (accessToken && refreshToken) {
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (error) throw error;
          }
        }

        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (!data?.session) {
          throw new Error("Google login could not be completed. Please try again.");
        }

        window.history.replaceState({}, document.title, `/auth/callback?next=${encodeURIComponent(nextPath)}`);
        if (active) navigate(nextPath, { replace: true });
      } catch (err) {
        if (active) {
          setErrorMessage(err?.message || "Unable to complete Google login.");
        }
      }
    };

    finishOAuth();

    return () => {
      active = false;
    };
  }, [navigate, nextPath]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050505] px-6 text-white">
      <div className="w-full max-w-lg rounded-[32px] border border-white/10 bg-white/[0.03] p-8 text-center backdrop-blur-2xl">
        {errorMessage ? (
          <>
            <p className="text-sm font-bold text-red-300">{errorMessage}</p>
            <Link
              to="/login"
              className="mt-6 inline-flex text-[10px] font-black uppercase tracking-[0.24em] text-orange-400 hover:text-orange-300"
            >
              Back to Login
            </Link>
          </>
        ) : (
          <>
            <Loader2 size={20} className="mx-auto animate-spin text-orange-400" />
            <p className="mt-4 text-[10px] font-black uppercase tracking-[0.3em] text-white/60">
              Completing Google Login
            </p>
          </>
        )}
      </div>
    </div>
  );
}
