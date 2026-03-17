import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Lock, UserPlus, Loader2, Sparkles } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useNotify } from "../context/NotificationContext";
import { supabase } from "../utils/supabase";

const Register = () => {
  const { notify } = useNotify();
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("password"); // password | otp
  const navigate = useNavigate();

  const emailRedirectTo = useMemo(() => `${window.location.origin}/login`, []);

  const handlePasswordRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: { name: formData.name },
          emailRedirectTo,
        },
      });
      if (error) throw error;
      notify("Account created. Check your email if confirmation is enabled.", "success");
      navigate('/login', { state: { from: "/explore-stays" } });
    } catch (err) {
      notify(err?.message || "Registration failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: formData.email,
        options: {
          emailRedirectTo,
          data: { name: formData.name },
        },
      });
      if (error) throw error;
      notify("Check your email for the sign-in link", "success");
      navigate('/login', { state: { from: "/explore-stays" } });
    } catch (err) {
      notify(err?.message || "OTP signup failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] px-6">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="max-w-md w-full bg-white/[0.03] backdrop-blur-3xl border border-white/10 p-12 rounded-[60px] shadow-2xl">
        <div className="text-center mb-10">
          <h2 className="text-5xl font-black text-white italic tracking-tighter uppercase leading-none">Join<br/><span className="text-orange-600">M-Mate.</span></h2>
        </div>

        <div className="mb-7 grid grid-cols-2 gap-2 p-2 bg-white/[0.03] border border-white/10 rounded-[28px]">
          <button
            type="button"
            onClick={() => setMode("password")}
            className={`py-3 rounded-[22px] font-black uppercase text-[10px] tracking-[0.25em] transition-all ${
              mode === "password" ? "bg-orange-600 text-white" : "text-white/40 hover:text-white"
            }`}
          >
            Password
          </button>
          <button
            type="button"
            onClick={() => setMode("otp")}
            className={`py-3 rounded-[22px] font-black uppercase text-[10px] tracking-[0.25em] transition-all ${
              mode === "otp" ? "bg-orange-600 text-white" : "text-white/40 hover:text-white"
            }`}
          >
            OTP Link
          </button>
        </div>

        <form onSubmit={mode === "password" ? handlePasswordRegister : handleOtpRegister} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[9px] font-black text-white/30 uppercase ml-4 tracking-widest flex items-center gap-2"><User size={12}/> Full Name</label>
            <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-white/5 border border-white/10 p-6 rounded-[30px] text-white outline-none focus:border-orange-600 transition-all font-bold" placeholder="Shardul" />
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black text-white/30 uppercase ml-4 tracking-widest flex items-center gap-2"><Mail size={12}/> Email</label>
            <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full bg-white/5 border border-white/10 p-6 rounded-[30px] text-white outline-none focus:border-orange-600 transition-all font-bold" placeholder="kedar@mate.com" />
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
                <label className="text-[9px] font-black text-white/30 uppercase ml-4 tracking-widest flex items-center gap-2"><Lock size={12}/> Password</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 p-6 rounded-[30px] text-white outline-none focus:border-orange-600 transition-all font-bold"
                  placeholder="••••••••"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <button disabled={loading} type="submit" className="w-full bg-orange-600 text-white p-6 rounded-[30px] font-black uppercase text-[11px] tracking-widest flex items-center justify-center gap-3 hover:bg-white hover:text-black transition-all">
            {loading ? <Loader2 className="animate-spin" /> : <UserPlus size={18} />}
            {loading ? "CREATING..." : (mode === "password" ? "CREATE ACCOUNT" : "SEND SIGN-IN LINK")}
          </button>
        </form>

        {mode === "otp" && (
          <p className="mt-5 text-center text-white/20 text-[10px] font-black uppercase tracking-widest">
            We’ll email you a secure sign-in link. <span className="text-white/30">No password needed.</span>
          </p>
        )}

        <p className="text-center mt-8 text-white/30 text-[10px] font-black uppercase tracking-widest">
          Already a member? <Link to="/login" className="text-white hover:text-orange-500">Login</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Register;