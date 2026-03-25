import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  Loader2,
  Lock,
  LogIn,
  Mail,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Phone,
  ArrowRight
} from "lucide-react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useNotify } from "../context/NotificationContext";
import { supabase } from "../utils/supabase";
import { Button } from "../components/ui/Button";

const Login = () => {
  const { notify } = useNotify();
  const navigate = useNavigate();
  const location = useLocation();

  const [identifier, setIdentifier] = useState(""); // Unified Email/Phone
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("password");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);

  const from = location.state?.from || "/explore-stays";

  // --- GOOGLE AUTH LOGIC ---
  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin + from }
      });
      if (error) throw error;
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (element, index) => {
    if (Number.isNaN(Number(element.value)) && element.value !== "") return;
    const newOtp = [...otp.map((digit, idx) => (idx === index ? element.value : digit))];
    setOtp(newOtp);

    if (element.nextSibling && element.value) {
      element.nextSibling.focus();
    }

    if (newOtp.join("").length === 6 && !loading) {
      setTimeout(() => {
        attemptOtpVerify(newOtp.join(""));
      }, 80);
    }
  };

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Check if identifier is phone or email
      const isPhone = /^\+?[1-9]\d{1,14}$/.test(identifier.replace(/\s/g, ""));
      
      const loginPayload = isPhone 
        ? { phone: identifier, password } 
        : { email: identifier, password };

      const { error } = await supabase.auth.signInWithPassword(loginPayload);
      if (error) throw error;
      
      notify("Uplink established. Welcome back.", "success");
      navigate(from, { replace: true });
    } catch (err) {
      notify(err?.message || "Invalid credentials.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpRequest = async (e) => {
    e.preventDefault();
    if (!identifier) return notify("Identifier required.", "error");
    setLoading(true);
    try {
      const isPhone = /^\+?[1-9]\d{1,14}$/.test(identifier.replace(/\s/g, ""));
      
      const { error } = isPhone 
        ? await supabase.auth.signInWithOtp({ phone: identifier })
        : await supabase.auth.signInWithOtp({ email: identifier });

      if (error) throw error;
      setMode("otp_verify");
      notify("Security code sent.", "success");
    } catch (err) {
      notify(err?.message || "Unable to send code.", "error");
    } finally {
      setLoading(false);
    }
  };

  const attemptOtpVerify = async (codeInput) => {
    if (loading) return;
    const code = (codeInput ?? otp.join("")).trim();
    if (code.length !== 6) return notify("Enter full code.", "error");

    setLoading(true);
    try {
      const isPhone = /^\+?[1-9]\d{1,14}$/.test(identifier.replace(/\s/g, ""));
      const { error } = await supabase.auth.verifyOtp({
        [isPhone ? 'phone' : 'email']: identifier,
        token: code,
        type: isPhone ? 'sms' : 'email',
      });
      if (error) throw error;
      notify("Access granted.", "success");
      navigate(from, { replace: true });
    } catch (err) {
      notify(err?.message || "Invalid OTP code.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#040404] px-4 py-10 text-white md:px-6">
      {/* BACKGROUND AURA */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[10%] top-[12%] h-[28rem] w-[28rem] rounded-full bg-orange-500/10 blur-[140px]" />
        <div className="absolute bottom-[5%] right-[8%] h-[24rem] w-[24rem] rounded-full bg-amber-300/5 blur-[140px]" />
      </div>

      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        {/* LEFT TEXT */}
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} className="hidden lg:block">
          <div className="max-w-xl">
            <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-xl">
              <Sparkles size={13} className="text-orange-400" />
              <span className="text-[9px] font-black uppercase tracking-[0.42em] text-white/60">Secure Expedition Gateway</span>
            </div>
            <h1 className="text-6xl font-black uppercase italic tracking-[-0.06em] text-white lg:text-[6.5rem] lg:leading-[0.85]">
              Return to<br />
              <span className="bg-gradient-to-b from-white via-amber-100 to-orange-500 bg-clip-text text-transparent">Command.</span>
            </h1>
          </div>
        </motion.div>

        {/* LOGIN CARD */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="cinematic-surface spotlight-border mx-auto w-full max-w-md rounded-[40px] p-6 md:p-10 bg-white/[0.02] backdrop-blur-3xl">
          <AnimatePresence mode="wait">
            {mode === "password" || mode === "otp_request" ? (
              <motion.div key="login-form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="mb-8 text-center">
                  <h2 className="text-4xl font-black uppercase italic tracking-tight text-white">Login.</h2>
                  <p className="mt-2 text-[8px] font-black uppercase tracking-[0.4em] text-white/20">Secure Uplink</p>
                </div>

                {/* MODE TOGGLE */}
                <div className="mb-8 grid grid-cols-2 gap-1 rounded-[20px] border border-white/5 bg-white/5 p-1">
                  {["password", "otp_request"].map((m) => (
                    <button key={m} onClick={() => setMode(m)} className={`rounded-[16px] py-3 text-[8px] font-black uppercase tracking-[0.2em] transition-all ${mode === m ? "bg-orange-600 text-white shadow-lg shadow-orange-600/20" : "text-white/30"}`}>
                      {m === "password" ? "Key Access" : "OTP Sync"}
                    </button>
                  ))}
                </div>

                <form onSubmit={mode === "password" ? handlePasswordLogin : handleOtpRequest} className="space-y-4">
                  <Field label="Identifier (Email or Phone)" icon={identifier.includes('@') ? <Mail size={16}/> : <Phone size={16}/>}>
                    <input
                      type="text"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="+91 or explorer@email.com"
                      className="w-full bg-transparent text-sm font-bold text-white outline-none placeholder:text-white/20"
                    />
                  </Field>

                  {mode === "password" && (
                    <Field label="Security Key" icon={<Lock size={16} />}>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-transparent text-sm font-bold text-white outline-none placeholder:text-white/20"
                      />
                    </Field>
                  )}

                  <Button disabled={loading} type="submit" size="lg" className="w-full rounded-[20px] text-[10px] tracking-[0.3em] bg-orange-600 hover:bg-orange-500 shadow-xl shadow-orange-600/10 h-14">
                    {loading ? <Loader2 className="animate-spin" size={18} /> : <ArrowRight size={18} />}
                    {mode === "password" ? "Establish Uplink" : "Transmit Code"}
                  </Button>
                </form>

                {/* --- GOOGLE UPLINK --- */}
                <div className="mt-8 space-y-6">
                  <div className="flex items-center gap-4 text-white/10">
                    <div className="h-px flex-1 bg-current" />
                    <span className="text-[7px] font-black uppercase tracking-[0.4em]">Alternative</span>
                    <div className="h-px flex-1 bg-current" />
                  </div>

                  <button 
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full h-14 rounded-[20px] bg-white/[0.03] border border-white/10 flex items-center justify-center gap-3 hover:bg-white/5 transition-all group active:scale-95"
                  >
                    <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/50 group-hover:text-white transition-colors">Authenticate with Google</span>
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div key="otp-verify" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10 text-center">
                <div className="space-y-4">
                  <ShieldCheck size={48} className="mx-auto text-orange-500" />
                  <h2 className="text-4xl font-black uppercase italic tracking-tight text-white">Verify Sync.</h2>
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20 italic">Transmission sent to {identifier}</p>
                </div>

                <div className="mx-auto grid w-full max-w-[340px] grid-cols-6 gap-2 sm:gap-3">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      type="text"
                      maxLength="1"
                      value={digit}
                      onChange={(e) => handleOtpChange(e.target, index)}
                      className="aspect-square w-full rounded-xl border border-white/10 bg-white/5 text-center text-lg font-black text-orange-500 outline-none transition-all focus:border-orange-500"
                    />
                  ))}
                </div>

                <Button onClick={() => attemptOtpVerify()} disabled={loading} className="w-full rounded-full text-[10px] tracking-[0.3em] h-14 bg-orange-600">
                  {loading ? "Verifying..." : "Confirm Identity"}
                </Button>

                <button onClick={() => setMode("password")} className="text-[8px] font-black uppercase tracking-widest text-white/20 hover:text-white transition-colors flex items-center justify-center gap-2 mx-auto">
                   <ChevronLeft size={12}/> Update Identity
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {(mode === "password" || mode === "otp_request") && (
            <div className="mt-8 border-t border-white/5 pt-6 text-center">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20">
                New scout? <Link to="/register" className="ml-2 text-orange-500 underline underline-offset-4 decoration-orange-500/20">Register now</Link>
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

function Field({ label, icon, children }) {
  return (
    <div className="space-y-2 text-left">
      <label className="ml-4 text-[8px] font-black uppercase tracking-[0.3em] text-white/30 italic">{label}</label>
      <div className="flex items-center gap-3 rounded-[20px] border border-white/5 bg-white/5 px-5 py-4 backdrop-blur-xl group-focus-within:border-orange-500/50 transition-all">
        <span className="text-orange-500/50 group-focus-within:text-orange-500 transition-colors">{icon}</span>
        {children}
      </div>
    </div>
  );
}

export default Login;