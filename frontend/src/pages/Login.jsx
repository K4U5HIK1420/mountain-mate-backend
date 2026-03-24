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
} from "lucide-react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useNotify } from "../context/NotificationContext";
import { supabase } from "../utils/supabase";
import { Button } from "../components/ui/Button";

const Login = () => {
  const { notify } = useNotify();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("password");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);

  const from = location.state?.from || "/explore-stays";

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
      const { error } = await supabase.auth.signInWithPassword({ email, password });
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
    if (!email) return notify("Email required for OTP login.", "error");
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) throw error;
      setMode("otp_verify");
      notify("Security code sent to your inbox.", "success");
    } catch (err) {
      notify(err?.message || "Unable to send code.", "error");
    } finally {
      setLoading(false);
    }
  };

  const attemptOtpVerify = async (codeInput) => {
    if (loading) return;
    const code = (codeInput ?? otp.join("")).trim();
    if (code.length !== 6) {
      notify("Enter the full 6-digit code.", "error");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: "email",
      });
      if (error) throw error;
      notify("Identity verified. Access granted.", "success");
      navigate(from, { replace: true });
    } catch (err) {
      notify(err?.message || "Invalid OTP code.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerify = async (e) => {
    e.preventDefault();
    await attemptOtpVerify();
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#040404] px-4 py-10 text-white md:px-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[10%] top-[12%] h-[28rem] w-[28rem] rounded-full bg-orange-500/12 blur-[140px]" />
        <div className="absolute bottom-[5%] right-[8%] h-[24rem] w-[24rem] rounded-full bg-amber-300/10 blur-[140px]" />
      </div>

      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          className="hidden lg:block"
        >
          <div className="max-w-xl">
            <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/6 px-4 py-2 backdrop-blur-xl">
              <Sparkles size={13} className="text-orange-400" />
              <span className="text-[9px] font-black uppercase tracking-[0.42em] text-white/60">Secure Expedition Gateway</span>
            </div>
            <h1 className="text-6xl font-black uppercase italic tracking-[-0.06em] text-white lg:text-[6.5rem] lg:leading-[0.85]">
              Return to
              <br />
              <span className="bg-gradient-to-b from-white via-amber-100 to-orange-500 bg-clip-text text-transparent">
                Command.
              </span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-white/62">
              The auth flow now matches the product polish: stronger atmosphere, cleaner state transitions, and a more intentional sense of trust.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="cinematic-surface spotlight-border mx-auto w-full max-w-md rounded-[40px] p-6 md:p-10"
        >
          <AnimatePresence mode="wait">
            {mode === "password" || mode === "otp_request" ? (
              <motion.div key="login-form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="mb-10 text-center">
                  <div className="mb-5 inline-flex rounded-2xl bg-orange-500/12 p-3 text-orange-300">
                    <Sparkles size={20} />
                  </div>
                  <h2 className="text-4xl font-black uppercase italic tracking-tight text-white md:text-5xl">Login.</h2>
                  <p className="mt-4 text-[9px] font-black uppercase tracking-[0.4em] text-white/30">Secure expedition gateway</p>
                </div>

                <div className="mb-8 grid grid-cols-2 gap-1 rounded-[22px] border border-white/8 bg-white/5 p-1">
                  <button
                    onClick={() => setMode("password")}
                    className={`rounded-[18px] py-3.5 text-[9px] font-black uppercase tracking-[0.28em] transition-all ${mode === "password" ? "bg-gradient-to-r from-orange-500 to-amber-400 text-white shadow-[0_14px_34px_rgba(249,115,22,0.28)]" : "text-white/25"}`}
                  >
                    Password
                  </button>
                  <button
                    onClick={() => setMode("otp_request")}
                    className={`rounded-[18px] py-3.5 text-[9px] font-black uppercase tracking-[0.28em] transition-all ${mode === "otp_request" ? "bg-gradient-to-r from-orange-500 to-amber-400 text-white shadow-[0_14px_34px_rgba(249,115,22,0.28)]" : "text-white/25"}`}
                  >
                    OTP Login
                  </button>
                </div>

                <form onSubmit={mode === "password" ? handlePasswordLogin : handleOtpRequest} className="space-y-5">
                  <Field label="Identifier" icon={<Mail size={16} className="text-orange-300/65" />}>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="explorer@email.com"
                      className="w-full bg-transparent text-sm font-bold text-white outline-none placeholder:text-white/24"
                    />
                  </Field>

                  {mode === "password" && (
                    <Field label="Security Key" icon={<Lock size={16} className="text-orange-300/65" />}>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full bg-transparent text-sm font-bold text-white outline-none placeholder:text-white/24"
                      />
                    </Field>
                  )}

                  <Button disabled={loading} type="submit" size="lg" className="w-full rounded-[24px] text-[10px] tracking-[0.3em]">
                    {loading ? <Loader2 className="animate-spin" size={18} /> : <LogIn size={18} />}
                    {mode === "password" ? "Establish Uplink" : "Transmit Code"}
                  </Button>
                </form>
              </motion.div>
            ) : (
              <motion.form
                key="otp-verify"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleOtpVerify}
                className="space-y-10 text-center"
              >
                <div className="space-y-4">
                  <ShieldCheck size={48} className="mx-auto text-orange-400" />
                  <h2 className="text-4xl font-black uppercase italic tracking-tight text-white">
                    Verify <span className="text-orange-400">Sync.</span>
                  </h2>
                  <p className="px-4 text-[9px] font-black uppercase tracking-[0.3em] text-white/28">
                    Transmission sent to
                    <br />
                    <span className="mt-2 inline-block text-orange-300">{email}</span>
                  </p>
                </div>

                <div className="mx-auto grid w-full max-w-[340px] grid-cols-6 gap-2 sm:gap-3">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      type="text"
                      maxLength="1"
                      value={digit}
                      onChange={(e) => handleOtpChange(e.target, index)}
                      onFocus={(e) => e.target.select()}
                      className="aspect-square w-full rounded-xl border border-white/10 bg-white/5 text-center text-lg font-black text-orange-300 outline-none transition-all focus:border-orange-500"
                    />
                  ))}
                </div>

                <Button type="submit" disabled={loading} size="lg" variant="neutral" className="w-full rounded-full text-[11px] tracking-[0.34em]">
                  {loading ? "Verifying..." : "Confirm Identity"}
                </Button>

                <div className="flex flex-col gap-4 border-t border-white/8 pt-6">
                  <button
                    onClick={() => setMode("password")}
                    className="flex items-center justify-center gap-2 text-[8px] font-black uppercase tracking-[0.28em] text-white/28 transition-colors hover:text-white"
                  >
                    <ChevronLeft size={12} />
                    Update Email Identity
                  </button>
                  <button
                    type="button"
                    onClick={handleOtpRequest}
                    className="flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-[0.28em] text-orange-400 transition-colors hover:text-orange-300"
                  >
                    <RefreshCw size={12} />
                    Resend Security Code
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {(mode === "password" || mode === "otp_request") && (
            <div className="mt-8 border-t border-white/8 pt-6 text-center">
              <p className="text-[9px] font-black uppercase tracking-[0.28em] text-white/32">
                New scout?
                <Link to="/register" className="ml-2 text-orange-400 underline underline-offset-4 decoration-orange-400/20">
                  Register now
                </Link>
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
      <label className="ml-4 text-[9px] font-black uppercase tracking-[0.28em] text-white/32">{label}</label>
      <div className="flex items-center gap-3 rounded-[22px] border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-xl">
        {icon}
        {children}
      </div>
    </div>
  );
}

export default Login;
