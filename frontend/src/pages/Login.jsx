import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, LogIn, Loader2, Sparkles, Zap, ShieldCheck, RefreshCw, ChevronLeft } from 'lucide-react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useNotify } from "../context/NotificationContext";
import { supabase } from "../utils/supabase";

const Login = () => {
  const { notify } = useNotify();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("password"); // password | otp_verify
  const [otp, setOtp] = useState(['', '', '', '', '', '']);

  const from = location.state?.from || '/explore-stays';

  // --- OTP Input Logic (Responsive Fix) ---
  const handleOtpChange = (element, index) => {
    if (isNaN(element.value)) return false;
    const newOtp = [...otp.map((d, idx) => (idx === index ? element.value : d))];
    setOtp(newOtp);

    // Auto-focus next input field
    if (element.nextSibling && element.value) {
      element.nextSibling.focus();
    }
  };

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      notify("Uplink Established. Welcome, Explorer.", "success");
      navigate(from, { replace: true });
    } catch (err) {
      notify(err?.message || "Invalid security key.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpRequest = async (e) => {
    e.preventDefault();
    if (!email) return notify("Email required for transmission.", "error");
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) throw error;
      setMode("otp_verify");
      notify("Security code transmitted to your terminal.", "success");
    } catch (err) {
      notify(err?.message || "Transmission failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex items-center justify-center bg-[#050505] px-4 md:px-6 relative overflow-y-auto overflow-x-hidden font-sans">
      
      {/* --- BACKGROUND GLOWS --- */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-orange-600/10 blur-[120px] rounded-full pointer-events-none z-0" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="relative z-10 w-full max-w-md bg-white/[0.02] backdrop-blur-3xl border border-white/10 p-6 md:p-14 rounded-[40px] md:rounded-[60px] shadow-3xl my-auto"
      >
        <AnimatePresence mode="wait">
          {mode === "password" || mode === "otp_request" ? (
            <motion.div 
              key="login-form" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
            >
              <div className="text-center mb-10">
                <div className="inline-flex p-3 rounded-2xl bg-orange-600/10 text-orange-500 mb-6">
                  <Sparkles size={20} />
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-white italic tracking-tighter uppercase leading-none">Login.</h2>
                <p className="text-white/20 text-[9px] font-black tracking-[0.4em] uppercase mt-4 italic">Secure Expedition Gateway</p>
              </div>

              {/* Mode Switcher */}
              <div className="mb-8 grid grid-cols-2 gap-1 p-1 bg-white/[0.03] border border-white/5 rounded-[22px]">
                <button 
                  onClick={() => setMode("password")} 
                  className={`py-3.5 rounded-[18px] font-black uppercase text-[9px] tracking-widest transition-all ${mode === "password" ? "bg-orange-600 text-white shadow-xl" : "text-white/20"}`}
                >
                  Password
                </button>
                <button 
                  onClick={() => setMode("otp_request")} 
                  className={`py-3.5 rounded-[18px] font-black uppercase text-[9px] tracking-widest transition-all ${mode === "otp_request" ? "bg-orange-600 text-white shadow-xl" : "text-white/20"}`}
                >
                  OTP Login
                </button>
              </div>

              <form onSubmit={mode === "password" ? handlePasswordLogin : handleOtpRequest} className="space-y-5">
                <div className="space-y-2 text-left">
                  <label className="text-[9px] font-black text-white/30 uppercase tracking-widest ml-4">Identifier</label>
                  <div className="relative group">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-orange-500/40" size={16} />
                    <input 
                      type="email" 
                      required 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      placeholder="explorer@email.com" 
                      className="w-full bg-white/5 border border-white/10 p-4 md:p-5 pl-12 md:pl-14 rounded-[18px] md:rounded-[22px] font-bold text-white outline-none focus:border-orange-600/50 text-sm" 
                    />
                  </div>
                </div>

                {mode === "password" && (
                  <div className="space-y-2 text-left">
                    <label className="text-[9px] font-black text-white/30 uppercase tracking-widest ml-4">Security Key</label>
                    <div className="relative group">
                      <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-orange-500/40" size={16} />
                      <input 
                        type="password" 
                        required 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        placeholder="••••••••" 
                        className="w-full bg-white/5 border border-white/10 p-4 md:p-5 pl-12 md:pl-14 rounded-[18px] md:rounded-[22px] font-bold text-white outline-none focus:border-orange-600/50 text-sm" 
                      />
                    </div>
                  </div>
                )}

                <button 
                  disabled={loading} 
                  type="submit" 
                  className="w-full bg-orange-600 text-white py-5 md:py-6 rounded-[22px] font-black uppercase tracking-[0.3em] text-[10px] transition-all flex items-center justify-center gap-3 shadow-2xl active:scale-95 disabled:opacity-50 italic"
                >
                  {loading ? <Loader2 className="animate-spin" size={18} /> : <LogIn size={18} />}
                  {mode === "password" ? "ESTABLISH UPLINK" : "TRANSMIT CODE"}
                </button>
              </form>
            </motion.div>
          ) : (
            /* --- OTP VERIFICATION SCREEN (GRID FIX) --- */
            <motion.div 
              key="otp-verify" 
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }} 
              className="text-center space-y-10"
            >
              <div className="space-y-4">
                <ShieldCheck size={48} className="text-orange-600 mx-auto" />
                <h2 className="text-4xl font-black italic uppercase tracking-tighter text-white leading-none">VERIFY <span className="text-orange-600">SYNC.</span></h2>
                <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] leading-relaxed break-all px-4">
                  Transmission Sent To: <br/> <span className="text-orange-500/60 uppercase">{email}</span>
                </p>
              </div>

              {/* GRID FIX: Auto-resizing boxes */}
              <div className="grid grid-cols-6 gap-2 sm:gap-3 px-1 w-full max-w-[340px] mx-auto">
                {otp.map((data, index) => (
                  <input
                    key={index}
                    type="text"
                    maxLength="1"
                    value={data}
                    onChange={e => handleOtpChange(e.target, index)}
                    onFocus={e => e.target.select()}
                    className="w-full aspect-square text-center bg-white/5 border border-white/10 rounded-xl text-lg font-black text-orange-500 outline-none focus:border-orange-600 transition-all shadow-inner"
                  />
                ))}
              </div>

              <button className="w-full bg-white text-black py-5 rounded-full font-black uppercase text-[11px] tracking-[0.4em] shadow-3xl hover:bg-orange-600 hover:text-white transition-all active:scale-95 italic">
                Confirm Identity
              </button>

              <div className="flex flex-col gap-4 pt-6 border-t border-white/5">
                <button 
                  onClick={() => setMode("password")} 
                  className="text-[8px] font-black text-white/20 uppercase tracking-widest hover:text-white transition-all flex items-center justify-center gap-2"
                >
                  <ChevronLeft size={12}/> Update Email Identity
                </button>
                <button className="flex items-center justify-center gap-2 text-[9px] font-black text-orange-600 uppercase tracking-widest hover:text-orange-400 transition-all italic">
                   <RefreshCw size={12} /> Resend Security Code
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Register Footer (Visible in password/request modes) */}
        {(mode === "password" || mode === "otp_request") && (
          <div className="mt-8 text-center border-t border-white/5 pt-6">
            <p className="text-white/30 text-[9px] font-black uppercase tracking-widest">
              New Scout? <Link to="/register" className="text-orange-500 underline underline-offset-4 ml-2 decoration-orange-500/20">Register Now</Link>
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Login;