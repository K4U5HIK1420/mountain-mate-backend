import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Loader2, ShieldCheck, ArrowRight, RefreshCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "../utils/supabase";
import { useNotify } from "../context/NotificationContext";

export default function Register() {
  const { notify } = useNotify();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']); // 6 digit array
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const inputRefs = useRef([]);

  // Handle individual OTP input
  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1].focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  // Phase 1: Sign Up
  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: { data: { name: formData.name } }
      });
      if (error) throw error;
      setIsVerifying(true);
      notify("Tactical OTP sent to your inbox!", "success");
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // Phase 2: Verify
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    const fullOtp = otp.join('');
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: formData.email,
        token: fullOtp,
        type: 'signup'
      });
      if (error) throw error;
      notify("Access Granted. Welcome to the Expedition!", "success");
      navigate('/explore-stays');
    } catch (err) {
      notify("Invalid Code. Re-check your uplink.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] px-6 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-600/5 blur-[120px] rounded-full pointer-events-none" />
      
      <motion.div className="max-w-md w-full bg-white/[0.03] border border-white/10 p-10 rounded-[50px] backdrop-blur-3xl relative z-10">
        {!isVerifying ? (
          <form onSubmit={handleSignUp} className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-black italic uppercase text-white">New <span className="text-orange-600">Explorer.</span></h2>
              <p className="text-white/20 text-[9px] font-black tracking-[0.4em] uppercase mt-2 font-mono">Mission: Registration</p>
            </div>
            
            <input required className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white text-sm outline-none focus:border-orange-600" placeholder="Full Name" onChange={e => setFormData({...formData, name: e.target.value})} />
            <input type="email" required className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white text-sm outline-none focus:border-orange-600" placeholder="Email Identity" onChange={e => setFormData({...formData, email: e.target.value})} />
            <input type="password" required className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white text-sm outline-none focus:border-orange-600" placeholder="Security Key" onChange={e => setFormData({...formData, password: e.target.value})} />
            
            <button disabled={loading} className="w-full bg-orange-600 p-5 rounded-3xl font-black uppercase text-[10px] tracking-[0.3em] flex justify-center items-center gap-3 hover:bg-white hover:text-black transition-all">
              {loading ? <Loader2 className="animate-spin"/> : <><ArrowRight size={16}/> Initialize Uplink</>}
            </button>
          </form>
        ) : (
          <motion.form initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} onSubmit={handleVerifyOtp} className="space-y-8">
            <div className="text-center">
              <ShieldCheck className="mx-auto text-orange-500 mb-4" size={50} />
              <h2 className="text-2xl font-black uppercase text-white">Verify <span className="text-orange-600">Sync.</span></h2>
              <p className="text-white/30 text-[9px] mt-4 uppercase tracking-[0.2em] font-mono leading-relaxed">
                Transmission sent to:<br/>
                <span className="text-orange-400 font-bold">{formData.email}</span>
              </p>
            </div>
            
            <div className="flex justify-between gap-2">
              {otp.map((data, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength="1"
                  ref={el => inputRefs.current[index] = el}
                  className="w-12 h-16 bg-white/5 border border-white/10 rounded-xl text-center text-xl font-black text-orange-500 focus:border-orange-600 outline-none transition-all shadow-inner"
                  value={data}
                  onChange={e => handleOtpChange(index, e.target.value)}
                  onKeyDown={e => handleKeyDown(index, e)}
                />
              ))}
            </div>

            <button disabled={loading} className="w-full bg-white text-black p-5 rounded-3xl font-black uppercase text-[11px] tracking-[0.3em] shadow-2xl hover:bg-orange-600 hover:text-white transition-all">
              {loading ? <Loader2 className="animate-spin mx-auto"/> : "Confirm Identity"}
            </button>
            
            <div className="text-center space-y-4">
               <button type="button" onClick={() => setIsVerifying(false)} className="text-[9px] text-white/20 font-black uppercase tracking-widest hover:text-white block w-full transition-colors">
                Update Email Identity
              </button>
              <button type="button" onClick={handleSignUp} className="text-[9px] text-orange-500/50 font-black uppercase tracking-widest flex items-center justify-center gap-2 mx-auto hover:text-orange-500 transition-colors">
                <RefreshCcw size={10}/> Resend Code
              </button>
            </div>
          </motion.form>
        )}
      </motion.div>
    </div>
  );
}