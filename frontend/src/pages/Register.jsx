import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Loader2,
  Lock,
  Mail,
  RefreshCcw,
  ShieldCheck,
  User,
  Phone,
  Sparkles,
  ChevronLeft
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../utils/supabase";
import API from "../utils/api";
import { useNotify } from "../context/NotificationContext";
import { Button } from "../components/ui/Button";

export default function Register() {
  const { notify } = useNotify();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [formData, setFormData] = useState({ name: "", identifier: "", password: "" });
  const inputRefs = useRef([]);

  // --- GOOGLE JOIN LOGIC ---
  const handleGoogleJoin = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin + "/explore-stays" }
      });
      if (error) throw error;
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (Number.isNaN(Number(value)) && value !== "") return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1].focus();

    if (newOtp.join("").length === 6 && !loading) {
      setTimeout(() => {
        attemptVerifyOtp(newOtp.join(""));
      }, 80);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const normalizedIdentifier = formData.identifier.trim();
      const isPhone = /^\+?[1-9]\d{1,14}$/.test(normalizedIdentifier.replace(/\s/g, ""));

      if (isPhone) {
        const { error } = await supabase.auth.signInWithOtp({
          phone: normalizedIdentifier,
          options: {
            shouldCreateUser: true,
            data: { full_name: formData.name },
          },
        });

        if (error) throw error;
        setIsVerifying(true);
        notify("Verification code dispatched.", "success");
        return;
      }

      const { data } = await API.post("/user/register", {
        name: formData.name.trim(),
        email: normalizedIdentifier.toLowerCase(),
        password: formData.password,
      });

      if (!data?.user) {
        throw new Error(data?.message || "Unable to register user.");
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: normalizedIdentifier.toLowerCase(),
        password: formData.password,
      });

      if (signInError) throw signInError;

      notify("Identity Authenticated. Welcome.", "success");
      navigate("/explore-stays");
    } catch (err) {
      notify(err?.response?.data?.message || err?.message || "Unable to register user.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    try {
      const isPhone = /^\+?[1-9]\d{1,14}$/.test(formData.identifier.replace(/\s/g, ""));
      const { error } = await supabase.auth.signInWithOtp({
        [isPhone ? 'phone' : 'email']: formData.identifier,
      });
      if (error) throw error;
      notify("New code transmitted.", "success");
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const attemptVerifyOtp = async (codeInput) => {
    if (loading) return;
    const fullOtp = (codeInput ?? otp.join("")).trim();
    if (fullOtp.length !== 6) return;

    setLoading(true);
    try {
      const isPhone = /^\+?[1-9]\d{1,14}$/.test(formData.identifier.replace(/\s/g, ""));
      const { error } = await supabase.auth.verifyOtp({
        [isPhone ? 'phone' : 'email']: formData.identifier,
        token: fullOtp,
        type: isPhone ? 'sms' : 'email',
      });
      if (error) throw error;
      notify("Identity Authenticated. Welcome.", "success");
      navigate("/explore-stays");
    } catch {
      notify("Invalid uplink code.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#040404] px-4 py-10 text-white md:px-6">
      {/* BACKGROUND AURA */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-[10%] top-[10%] h-[30rem] w-[30rem] rounded-full bg-orange-500/10 blur-[140px]" />
        <div className="absolute bottom-[0%] left-[6%] h-[24rem] w-[24rem] rounded-full bg-amber-300/5 blur-[140px]" />
      </div>

      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        {/* LEFT TEXT CONTENT */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="hidden lg:block">
          <div className="max-w-xl text-left">
            <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-xl">
              <ShieldCheck size={13} className="text-orange-400" />
              <span className="text-[9px] font-black uppercase tracking-[0.42em] text-white/60">Fleet Registration</span>
            </div>
            <h1 className="text-6xl font-black uppercase italic tracking-[-0.06em] text-white lg:text-[6.5rem] lg:leading-[0.85]">
              Join the<br />
              <span className="bg-gradient-to-b from-white via-amber-100 to-orange-500 bg-clip-text text-transparent">Fleet.</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-white/40 max-w-md italic">
              Establish your explorer credentials and unlock exclusive access to Uttarakhand's premier stays and fleet deployments.
            </p>
          </div>
        </motion.div>

        {/* REGISTRATION CARD */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="cinematic-surface spotlight-border mx-auto w-full max-w-md rounded-[40px] p-6 md:p-10 bg-white/[0.02] backdrop-blur-3xl">
          <AnimatePresence mode="wait">
            {!isVerifying ? (
              <motion.div key="reg-form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="mb-10 text-center">
                  <h2 className="text-4xl font-black uppercase italic tracking-tight text-white md:text-5xl">New Explorer.</h2>
                  <p className="mt-4 text-[9px] font-black uppercase tracking-[0.4em] text-white/20">Initialize your access profile</p>
                </div>

                <form onSubmit={handleSignUp} className="space-y-4">
                  <Field label="Full Name" icon={<User size={16} className="text-orange-500/50" />}>
                    <input
                      required
                      className="w-full bg-transparent text-sm font-bold text-white outline-none placeholder:text-white/20"
                      placeholder="e.g. Shardul Aswal"
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </Field>

                  <Field label="Email or Phone (+91)" icon={formData.identifier.includes('@') ? <Mail size={16}/> : <Phone size={16}/>}>
                    <input
                      required
                      className="w-full bg-transparent text-sm font-bold text-white outline-none placeholder:text-white/20"
                      placeholder="explorer@uplink.com"
                      onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                    />
                  </Field>

                  <Field label="Security Key" icon={<Lock size={16} />}>
                    <input
                      type="password"
                      required
                      className="w-full bg-transparent text-sm font-bold text-white outline-none placeholder:text-white/20"
                      placeholder="••••••••"
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </Field>

                  <Button disabled={loading} className="w-full rounded-[20px] text-[10px] tracking-[0.3em] bg-orange-600 hover:bg-orange-500 h-14 shadow-xl shadow-orange-600/10" size="lg">
                    {loading ? <Loader2 className="animate-spin" /> : <><ArrowRight size={16} /> Initialize Uplink</>}
                  </Button>
                </form>

                {/* GOOGLE JOIN */}
                <div className="mt-8 space-y-6">
                  <div className="flex items-center gap-4 text-white/10">
                    <div className="h-px flex-1 bg-current" />
                    <span className="text-[7px] font-black uppercase tracking-[0.4em]">Alternative</span>
                    <div className="h-px flex-1 bg-current" />
                  </div>

                  <button 
                    onClick={handleGoogleJoin}
                    disabled={loading}
                    className="w-full h-14 rounded-[20px] bg-white/[0.03] border border-white/10 flex items-center justify-center gap-3 hover:bg-white/5 transition-all group active:scale-95"
                  >
                    <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/50 group-hover:text-white transition-colors">Join with Google</span>
                  </button>
                  
                  <p className="text-center text-[9px] font-black uppercase tracking-[0.2em] text-white/20">
                    Existing Scout? <Link to="/login" className="text-orange-500 underline underline-offset-4 decoration-orange-500/20">Login Here</Link>
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8 text-center">
                <ShieldCheck className="mx-auto mb-4 text-orange-500" size={54} />
                <h2 className="text-3xl font-black uppercase italic tracking-tight text-white">Verify Sync.</h2>
                <p className="text-[9px] uppercase tracking-[0.25em] text-white/20 italic">Sent to {formData.identifier}</p>

                <div className="grid grid-cols-6 gap-2">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      type="text"
                      maxLength="1"
                      ref={(el) => (inputRefs.current[index] = el)}
                      className="h-16 w-full rounded-xl border border-white/10 bg-white/5 text-center text-xl font-black text-orange-500 outline-none focus:border-orange-500 transition-all"
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                    />
                  ))}
                </div>

                <Button onClick={() => attemptVerifyOtp()} disabled={loading} className="w-full rounded-full text-[11px] tracking-[0.3em] h-14 bg-orange-600 shadow-xl shadow-orange-600/20">
                  {loading ? "Syncing..." : "Confirm Identity"}
                </Button>

                <div className="pt-6 border-t border-white/5">
                  <button onClick={() => setIsVerifying(false)} className="text-[8px] font-black uppercase tracking-widest text-white/20 hover:text-white flex items-center justify-center gap-2 mx-auto transition-colors">
                    <ChevronLeft size={12}/> Correct Identity
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}

function Field({ label, icon, children }) {
  return (
    <div className="space-y-2 text-left group">
      <label className="ml-4 text-[8px] font-black uppercase tracking-[0.3em] text-white/30 italic transition-colors group-focus-within:text-orange-500/50">{label}</label>
      <div className="flex items-center gap-3 rounded-[20px] border border-white/5 bg-white/5 px-5 py-4 backdrop-blur-xl group-focus-within:border-orange-500/50 transition-all">
        <span className="text-orange-500/50 group-focus-within:text-orange-500 transition-colors">{icon}</span>
        {children}
      </div>
    </div>
  );
}
