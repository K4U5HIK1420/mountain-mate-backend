import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, KeyRound, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabase";
import { useNotify } from "../context/NotificationContext";
import { Button } from "../components/ui/Button";

export default function ResetPassword() {
  const navigate = useNavigate();
  const { notify } = useNotify();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [recoveryReady, setRecoveryReady] = useState(false);

  useEffect(() => {
    let active = true;

    const bootstrapRecovery = async () => {
      const hash = window.location.hash.replace(/^#/, "");
      const params = new URLSearchParams(hash);
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      const type = params.get("type");

      if (type === "recovery" && accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          notify(error.message || "Recovery link is invalid or expired.", "error");
          return;
        }

        if (active) {
          setRecoveryReady(true);
          window.history.replaceState({}, document.title, window.location.pathname);
        }
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (active && data.session) {
        setRecoveryReady(true);
      }
    };

    bootstrapRecovery();

    return () => {
      active = false;
    };
  }, [notify]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!recoveryReady) {
      notify("Open this page from the reset email link.", "warning");
      return;
    }

    if (password.length < 6) {
      notify("Password should be at least 6 characters.", "warning");
      return;
    }

    if (password !== confirmPassword) {
      notify("Passwords do not match.", "error");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      notify("Password updated successfully.", "success");
      navigate("/login", { replace: true });
    } catch (err) {
      notify(err?.message || "Unable to update password.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#040404] px-4 py-10 text-white md:px-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[10%] top-[15%] h-[24rem] w-[24rem] rounded-full bg-orange-500/10 blur-[140px]" />
        <div className="absolute bottom-[8%] right-[12%] h-[20rem] w-[20rem] rounded-full bg-amber-300/5 blur-[140px]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="cinematic-surface spotlight-border w-full max-w-xl rounded-[40px] bg-white/[0.02] p-8 backdrop-blur-3xl md:p-12"
        >
          <div className="text-center">
            <div className="mx-auto inline-flex rounded-full border border-orange-500/20 bg-orange-500/10 p-4 text-orange-400">
              <KeyRound size={24} />
            </div>
            <h1 className="mt-6 text-4xl font-black uppercase italic tracking-tight text-white md:text-5xl">Reset Password.</h1>
            <p className="mt-4 text-sm leading-7 text-white/50">
              Set a new password for your Mountain Mate account, then head back to login.
            </p>
          </div>

          {!recoveryReady ? (
            <div className="mt-10 rounded-[28px] border border-white/10 bg-white/[0.03] p-6 text-center">
              <CheckCircle2 size={22} className="mx-auto text-orange-400" />
              <p className="mt-4 text-[10px] font-black uppercase tracking-[0.28em] text-white/35">Recovery Link Required</p>
              <p className="mt-4 text-sm leading-7 text-white/55">
                Open the password reset email and use the link there to continue.
              </p>
              <Link to="/login" className="mt-6 inline-flex text-[9px] font-black uppercase tracking-[0.28em] text-orange-400 hover:text-orange-300">
                Back to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-10 space-y-5">
              <Field label="New Password">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full bg-transparent text-sm font-bold text-white outline-none placeholder:text-white/20"
                />
              </Field>

              <Field label="Confirm Password">
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full bg-transparent text-sm font-bold text-white outline-none placeholder:text-white/20"
                />
              </Field>

              <Button
                type="submit"
                size="lg"
                disabled={loading}
                className="h-14 w-full rounded-[20px] bg-orange-600 text-[10px] tracking-[0.3em] shadow-xl shadow-orange-600/10 hover:bg-orange-500"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <ArrowRight size={18} />}
                Update Password
              </Button>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="space-y-2 text-left">
      <label className="ml-4 text-[8px] font-black uppercase tracking-[0.3em] text-white/30 italic">{label}</label>
      <div className="flex items-center gap-3 rounded-[20px] border border-white/5 bg-white/5 px-5 py-4 backdrop-blur-xl">
        {children}
      </div>
    </div>
  );
}
