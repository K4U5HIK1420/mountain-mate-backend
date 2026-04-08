import React, { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Loader2, Lock, Mail, Sparkles } from "lucide-react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useNotify } from "../context/NotificationContext";
import { supabase } from "../utils/supabase";
import { Button } from "../components/ui/Button";
import { isValidEmail, normalizeEmail } from "../utils/validation";

const Login = () => {
  const { notify } = useNotify();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || "/explore-stays";

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      if (!supabase) {
        throw new Error("Authentication service is not configured.");
      }
      const callbackUrl = new URL("/auth/callback", window.location.origin);
      callbackUrl.searchParams.set("next", from);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: callbackUrl.toString() },
      });
      if (error) throw error;
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    const normalizedEmail = normalizeEmail(email);
    if (!isValidEmail(normalizedEmail)) {
      notify("Enter a valid email address.", "warning");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) throw error;
      notify("Uplink established. Welcome back.", "success");
      navigate(from, { replace: true });
    } catch (err) {
      notify(err?.message || "Invalid credentials.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const normalizedEmail = normalizeEmail(email);
    if (!isValidEmail(normalizedEmail)) {
      notify("Enter your account email first.", "warning");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      notify("Password reset link sent to your email.", "success");
    } catch (err) {
      notify(err?.message || "Unable to send reset link.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#040404] px-4 py-10 text-white md:px-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[10%] top-[12%] h-[28rem] w-[28rem] rounded-full bg-orange-500/10 blur-[140px]" />
        <div className="absolute bottom-[5%] right-[8%] h-[24rem] w-[24rem] rounded-full bg-amber-300/5 blur-[140px]" />
      </div>

      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} className="hidden lg:block">
          <div className="max-w-xl">
            <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-xl">
              <Sparkles size={13} className="text-orange-400" />
              <span className="text-[9px] font-black uppercase tracking-[0.42em] text-white/60">Secure Expedition Gateway</span>
            </div>
            <h1 className="text-6xl font-black uppercase italic tracking-[-0.06em] text-white lg:text-[6.5rem] lg:leading-[0.85]">
              Return to
              <br />
              <span className="bg-gradient-to-b from-white via-amber-100 to-orange-500 bg-clip-text text-transparent">Command.</span>
            </h1>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="cinematic-surface spotlight-border mx-auto w-full max-w-md rounded-[40px] bg-white/[0.02] p-6 backdrop-blur-3xl md:p-10"
        >
          <div className="mb-8 text-center">
            <h2 className="text-4xl font-black uppercase italic tracking-tight text-white">Login.</h2>
            <p className="mt-2 text-[8px] font-black uppercase tracking-[0.4em] text-white/20">Secure Uplink</p>
          </div>

          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <Field label="Email" icon={<Mail size={16} />}>
              <input
                type="email"
                required
                value={email}
                placeholder="johndoe123@gmail.com"
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent text-sm font-bold text-white outline-none"
              />
            </Field>

            <Field label="Password" icon={<Lock size={16} />}>
              <input
                type="password"
                required
                value={password}
                placeholder="••••••••"
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent text-sm font-bold text-white outline-none"
              />
            </Field>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={loading}
                className="text-[8px] font-black uppercase tracking-[0.28em] text-orange-400/80 transition hover:text-orange-300 disabled:opacity-60"
              >
                Forgot Password?
              </button>
            </div>

            <Button
              disabled={loading}
              type="submit"
              size="lg"
              className="h-14 w-full rounded-[20px] bg-orange-600 text-[10px] tracking-[0.3em] shadow-xl shadow-orange-600/10 hover:bg-orange-500"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <ArrowRight size={18} />}
              Login
            </Button>
          </form>

          <div className="mt-8 space-y-6">
            <div className="flex items-center gap-4 text-white/10">
              <div className="h-px flex-1 bg-current" />
              <span className="text-[7px] font-black uppercase tracking-[0.4em]">Alternative</span>
              <div className="h-px flex-1 bg-current" />
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="group flex h-14 w-full items-center justify-center gap-3 rounded-[20px] border border-white/10 bg-white/[0.03] transition-all hover:bg-white/5 active:scale-95"
            >
              <svg className="h-5 w-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span className="text-[9px] font-black uppercase tracking-widest text-white/50 transition-colors group-hover:text-white">
                Authenticate with Google
              </span>
            </button>
          </div>

          <div className="mt-8 border-t border-white/5 pt-6 text-center">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20">
              New scout?
              <Link to="/register" className="ml-2 text-orange-500 underline decoration-orange-500/20 underline-offset-4">
                Register now
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

function Field({ label, icon, children }) {
  return (
    <div className="space-y-2 text-left">
      <label className="ml-4 text-[8px] font-black uppercase tracking-[0.3em] text-white/30 italic">{label}</label>
      <div className="flex items-center gap-3 rounded-[20px] border border-white/5 bg-white/5 px-5 py-4 backdrop-blur-xl transition-all group-focus-within:border-orange-500/50">
        <span className="text-orange-500/50 transition-colors group-focus-within:text-orange-500">{icon}</span>
        {children}
      </div>
    </div>
  );
}

export default Login;
