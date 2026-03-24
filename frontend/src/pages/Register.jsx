import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Loader2,
  Lock,
  Mail,
  RefreshCcw,
  ShieldCheck,
  User,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabase";
import { useNotify } from "../context/NotificationContext";
import { Button } from "../components/ui/Button";

export default function Register() {
  const { notify } = useNotify();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const inputRefs = useRef([]);

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
      const { error } = await supabase.auth.signInWithOtp({
        email: formData.email,
        options: {
          shouldCreateUser: true,
          data: {
            full_name: formData.name,
          },
        },
      });

      if (error) throw error;

      setIsVerifying(true);
      notify("OTP sent to your email.", "success");
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: formData.email,
      });

      if (error) throw error;

      notify("OTP sent successfully.", "success");
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const attemptVerifyOtp = async (codeInput) => {
    if (loading) return;
    const fullOtp = (codeInput ?? otp.join("")).trim();
    if (fullOtp.length !== 6) {
      notify("Enter complete 6-digit code.", "error");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: formData.email,
        token: fullOtp,
        type: "email",
      });
      if (error) throw error;
      notify("Access granted. Welcome to the expedition.", "success");
      navigate("/explore-stays");
    } catch {
      notify("Invalid code. Re-check your uplink.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    await attemptVerifyOtp();
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#040404] px-4 py-10 text-white md:px-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-[10%] top-[10%] h-[30rem] w-[30rem] rounded-full bg-orange-500/12 blur-[140px]" />
        <div className="absolute bottom-[0%] left-[6%] h-[24rem] w-[24rem] rounded-full bg-amber-300/9 blur-[140px]" />
      </div>

      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          className="hidden lg:block"
        >
          <div className="max-w-xl">
            <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/6 px-4 py-2 backdrop-blur-xl">
              <ShieldCheck size={13} className="text-orange-400" />
              <span className="text-[9px] font-black uppercase tracking-[0.42em] text-white/60">Mission Registration</span>
            </div>
            <h1 className="text-6xl font-black uppercase italic tracking-[-0.06em] text-white lg:text-[6.5rem] lg:leading-[0.85]">
              Join the
              <br />
              <span className="bg-gradient-to-b from-white via-amber-100 to-orange-500 bg-clip-text text-transparent">
                Fleet.
              </span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-white/62">
              Registration now feels like part of the product experience, not a separate utility screen: stronger trust cues, cleaner layout, and smoother verification flow.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="cinematic-surface spotlight-border mx-auto w-full max-w-md rounded-[40px] p-6 md:p-10"
        >
          {!isVerifying ? (
            <form onSubmit={handleSignUp} className="space-y-6">
              <div className="mb-8 text-center">
                <h2 className="text-4xl font-black uppercase italic tracking-tight text-white md:text-5xl">
                  New <span className="text-orange-400">Explorer.</span>
                </h2>
                <p className="mt-4 text-[9px] font-black uppercase tracking-[0.4em] text-white/30">Create your access profile</p>
              </div>

              <Field label="Full Name" icon={<User size={16} className="text-orange-300/65" />}>
                <input
                  required
                  className="w-full bg-transparent text-sm font-bold text-white outline-none placeholder:text-white/24"
                  placeholder="Full Name"
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </Field>

              <Field label="Email Identity" icon={<Mail size={16} className="text-orange-300/65" />}>
                <input
                  type="email"
                  required
                  className="w-full bg-transparent text-sm font-bold text-white outline-none placeholder:text-white/24"
                  placeholder="Email Identity"
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </Field>

              <Field label="Security Key" icon={<Lock size={16} className="text-orange-300/65" />}>
                <input
                  type="password"
                  required
                  className="w-full bg-transparent text-sm font-bold text-white outline-none placeholder:text-white/24"
                  placeholder="Security Key"
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </Field>

              <Button disabled={loading} className="w-full rounded-[24px] text-[10px] tracking-[0.3em]" size="lg">
                {loading ? <Loader2 className="animate-spin" /> : <><ArrowRight size={16} /> Initialize Uplink</>}
              </Button>
            </form>
          ) : (
            <motion.form
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              onSubmit={handleVerifyOtp}
              className="space-y-8"
            >
              <div className="text-center">
                <ShieldCheck className="mx-auto mb-4 text-orange-400" size={50} />
                <h2 className="text-3xl font-black uppercase italic tracking-tight text-white">
                  Verify <span className="text-orange-400">Sync.</span>
                </h2>
                <p className="mt-4 text-[9px] uppercase tracking-[0.25em] text-white/30">
                  Transmission sent to
                  <br />
                  <span className="mt-2 inline-block text-orange-300">{formData.email}</span>
                </p>
              </div>

              <div className="grid grid-cols-6 gap-2">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    type="text"
                    maxLength="1"
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    className="h-16 w-full rounded-xl border border-white/10 bg-white/5 text-center text-xl font-black text-orange-300 outline-none transition-all focus:border-orange-500"
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                  />
                ))}
              </div>

              <Button disabled={loading} variant="neutral" className="w-full rounded-[24px] text-[11px] tracking-[0.3em]" size="lg">
                {loading ? <Loader2 className="mx-auto animate-spin" /> : "Confirm Identity"}
              </Button>

              <div className="space-y-4 text-center">
                <button
                  type="button"
                  onClick={() => setIsVerifying(false)}
                  className="block w-full text-[9px] font-black uppercase tracking-[0.28em] text-white/28 transition-colors hover:text-white"
                >
                  Update Email Identity
                </button>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="mx-auto flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-[0.28em] text-orange-400/70 transition-colors hover:text-orange-300"
                >
                  <RefreshCcw size={10} />
                  Resend Code
                </button>
              </div>
            </motion.form>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function Field({ label, icon, children }) {
  return (
    <div className="space-y-2 text-left">
      <label className="ml-4 text-[9px] font-black uppercase tracking-[0.28em] text-white/32">{label}</label>
      <div className="flex items-center gap-3 rounded-[22px] border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-xl">
        {icon}
        {children}
      </div>
    </div>
  );
}
