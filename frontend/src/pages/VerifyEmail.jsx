import React, { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, Loader2, MailCheck, RotateCw } from "lucide-react";
import { supabase } from "../utils/supabase";
import { useNotify } from "../context/NotificationContext";
import { Button } from "../components/ui/Button";
import { isValidEmail, normalizeEmail } from "../utils/validation";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { notify } = useNotify();
  const initialEmail = useMemo(() => normalizeEmail(searchParams.get("email") || ""), [searchParams]);

  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const verifyCode = async (e) => {
    e.preventDefault();
    const normalizedEmail = normalizeEmail(email);
    if (!isValidEmail(normalizedEmail)) {
      notify("Enter a valid email.", "error");
      return;
    }
    if (!otp || otp.trim().length < 6) {
      notify("Enter the OTP from your email.", "error");
      return;
    }

    try {
      setLoading(true);
      if (!supabase) throw new Error("Authentication service is not configured.");

      const { error } = await supabase.auth.verifyOtp({
        email: normalizedEmail,
        token: otp.trim(),
        type: "signup",
      });
      if (error) throw error;

      notify("Email verified successfully.", "success");
      navigate("/explore-stays");
    } catch (err) {
      notify(err?.message || "Unable to verify OTP.", "error");
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    const normalizedEmail = normalizeEmail(email);
    if (!isValidEmail(normalizedEmail)) {
      notify("Enter a valid email to resend OTP.", "error");
      return;
    }

    try {
      setResending(true);
      if (!supabase) throw new Error("Authentication service is not configured.");
      const callbackUrl = new URL("/auth/callback", window.location.origin);
      callbackUrl.searchParams.set("next", "/explore-stays");
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: normalizedEmail,
        options: { emailRedirectTo: callbackUrl.toString() },
      });
      if (error) throw error;
      notify("New OTP sent to your email.", "success");
    } catch (err) {
      notify(err?.message || "Unable to resend OTP.", "error");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#040404] px-4 py-10 text-white md:px-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-[10%] top-[10%] h-[30rem] w-[30rem] rounded-full bg-orange-500/10 blur-[140px]" />
        <div className="absolute bottom-[0%] left-[6%] h-[24rem] w-[24rem] rounded-full bg-amber-300/5 blur-[140px]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center">
        <div className="cinematic-surface spotlight-border mx-auto w-full max-w-md rounded-[40px] bg-white/[0.02] p-6 backdrop-blur-3xl md:p-10">
          <div className="mb-8 text-center">
            <MailCheck size={28} className="mx-auto text-orange-400" />
            <h2 className="mt-4 text-4xl font-black uppercase italic tracking-tight text-white">Verify Email.</h2>
            <p className="mt-2 text-[9px] font-black uppercase tracking-[0.3em] text-white/30">Enter OTP To Continue</p>
          </div>

          <form onSubmit={verifyCode} className="space-y-4">
            <Field label="Email">
              <input
                type="email"
                required
                value={email}
                placeholder="you@example.com"
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent text-sm font-bold text-white outline-none"
              />
            </Field>

            <Field label="OTP Code">
              <input
                type="text"
                required
                value={otp}
                placeholder="Enter 6 digit OTP"
                onChange={(e) => setOtp(e.target.value)}
                className="w-full bg-transparent text-sm font-bold text-white outline-none"
              />
            </Field>

            <Button
              disabled={loading}
              type="submit"
              size="lg"
              className="h-14 w-full rounded-[20px] bg-orange-600 text-[10px] tracking-[0.3em] shadow-xl shadow-orange-600/10 hover:bg-orange-500"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <ArrowRight size={18} />}
              Verify OTP
            </Button>
          </form>

          <div className="mt-6 grid gap-3">
            <Button
              type="button"
              variant="ghost"
              disabled={resending}
              onClick={resendCode}
              className="rounded-[20px] text-[10px] tracking-[0.24em]"
            >
              {resending ? <Loader2 size={15} className="animate-spin" /> : <RotateCw size={15} />}
              Resend OTP
            </Button>
            <Link to="/login" className="text-center text-[9px] font-black uppercase tracking-[0.22em] text-white/45 hover:text-white">
              Back to Login
            </Link>
          </div>
        </div>
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
