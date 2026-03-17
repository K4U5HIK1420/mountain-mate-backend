import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, LogIn, Loader2, ArrowRight } from 'lucide-react';
import { useNavigate, Link, useLocation } from 'react-router-dom'; // ✅ useLocation add kiya
import { useNotify } from "../context/NotificationContext";
import { supabase } from "../utils/supabase";

const Login = () => {
  const { notify } = useNotify();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("password"); // password | otp
  const navigate = useNavigate();
  const location = useLocation(); // ✅ Location track karne ke liye

  // Pehle wale page ka path dhoondo (agar user redirect hoke aaya hai)
  const from = location.state?.from || '/explore-stays';

  const emailRedirectTo = useMemo(() => {
    // Used for magic link / OTP redirect
    return `${window.location.origin}/login`;
  }, []);

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      notify("Logged in successfully", "success");
      navigate(from, { replace: true });
    } catch (err) {
      notify(err?.message || "Invalid credentials", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo },
      });
      if (error) throw error;
      notify("Check your email for the sign-in link", "success");
    } catch (err) {
      notify(err?.message || "OTP login failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] px-6 relative overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="relative z-10 max-w-md w-full bg-white/[0.03] backdrop-blur-3xl border border-white/10 p-12 rounded-[60px] shadow-2xl"
      >
        <div className="text-center mb-10">
          <h2 className="text-5xl font-black text-white italic tracking-tighter uppercase">Login.</h2>
          {/* ✅ Context sensitive message */}
          <p className="text-white/20 text-[10px] font-black tracking-[0.4em] uppercase mt-2">
            {location.state?.from ? "Login to unlock this feature" : "Access your M-Mate account"}
          </p>
        </div>

        <div className="mb-7 grid grid-cols-2 gap-2 p-2 bg-white/[0.03] border border-white/10 rounded-[28px]">
          <button
            type="button"
            onClick={() => setMode("password")}
            className={`py-3 rounded-[22px] font-black uppercase text-[10px] tracking-[0.25em] transition-all ${
              mode === "password" ? "bg-white text-black" : "text-white/40 hover:text-white"
            }`}
          >
            Password
          </button>
          <button
            type="button"
            onClick={() => setMode("otp")}
            className={`py-3 rounded-[22px] font-black uppercase text-[10px] tracking-[0.25em] transition-all ${
              mode === "otp" ? "bg-white text-black" : "text-white/40 hover:text-white"
            }`}
          >
            OTP Link
          </button>
        </div>

        <form onSubmit={mode === "password" ? handlePasswordLogin : handleOtpLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[9px] font-black text-white/30 uppercase ml-4 tracking-widest flex items-center gap-2">
              <Mail size={12}/> Email Address
            </label>
            <input 
              type="email" 
              required 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              className="w-full bg-white/5 border border-white/10 p-6 rounded-[30px] text-white outline-none focus:border-orange-600 transition-all font-bold placeholder:text-white/10" 
              placeholder="your@email.com" 
            />
          </div>

          <AnimatePresence initial={false}>
            {mode === "password" && (
              <motion.div
                key="password"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="space-y-2"
              >
                <label className="text-[9px] font-black text-white/30 uppercase ml-4 tracking-widest flex items-center gap-2">
                  <Lock size={12}/> Password
                </label>
                <input 
                  type="password"
                  required
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  className="w-full bg-white/5 border border-white/10 p-6 rounded-[30px] text-white outline-none focus:border-orange-600 transition-all font-bold placeholder:text-white/10" 
                  placeholder="••••••••" 
                />
              </motion.div>
            )}
          </AnimatePresence>

          <button 
            disabled={loading} 
            type="submit" 
            className="w-full bg-white text-black p-6 rounded-[30px] font-black uppercase text-[11px] tracking-widest flex items-center justify-center gap-3 hover:bg-orange-600 hover:text-white transition-all shadow-xl active:scale-95"
          >
            {loading ? <Loader2 className="animate-spin" /> : <LogIn size={18} />}
            {loading ? "AUTHENTICATING..." : (mode === "password" ? "ENTER VAULT" : "SEND SIGN-IN LINK")}
          </button>
        </form>

        {mode === "otp" && (
          <p className="mt-5 text-center text-white/20 text-[10px] font-black uppercase tracking-widest">
            We’ll email you a secure sign-in link. <span className="text-white/30">No password needed.</span>
          </p>
        )}

        <p className="text-center mt-8 text-white/30 text-[10px] font-black uppercase tracking-widest">
          New here? <Link to="/register" className="text-orange-500 hover:text-orange-400 transition-colors">Create Account</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;