import React, { useState } from 'react';
import API from '../utils/api';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, Loader2, ArrowRight } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await API.post('/auth/login', { email, password });
      
      // ✅ Token save karna sabse zaroori hai
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));

      alert("Welcome back! 🏔️");
      navigate('/explore'); // Login ke baad redirection
    } catch (err) {
      alert(err.response?.data?.message || "Invalid Credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] px-6">
      <img src="https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=2500" className="fixed inset-0 w-full h-full object-cover opacity-30 z-0" alt="bg" />
      
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative z-10 max-w-md w-full bg-white/[0.03] backdrop-blur-3xl border border-white/10 p-12 rounded-[60px] shadow-2xl">
        <div className="text-center mb-10">
          <h2 className="text-5xl font-black text-white italic tracking-tighter uppercase">Login.</h2>
          <p className="text-white/20 text-[10px] font-black tracking-[0.4em] uppercase mt-2">Access your M-Mate account</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[9px] font-black text-white/30 uppercase ml-4 tracking-widest flex items-center gap-2"><Mail size={12}/> Email Address</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 p-6 rounded-[30px] text-white outline-none focus:border-orange-600 transition-all font-bold" placeholder="your@email.com" />
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black text-white/30 uppercase ml-4 tracking-widest flex items-center gap-2"><Lock size={12}/> Password</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-white/5 border border-white/10 p-6 rounded-[30px] text-white outline-none focus:border-orange-600 transition-all font-bold" placeholder="••••••••" />
          </div>

          <button disabled={loading} type="submit" className="w-full bg-white text-black p-6 rounded-[30px] font-black uppercase text-[11px] tracking-widest flex items-center justify-center gap-3 hover:bg-orange-600 hover:text-white transition-all shadow-xl">
            {loading ? <Loader2 className="animate-spin" /> : <LogIn size={18} />}
            {loading ? "AUTHENTICATING..." : "ENTER VAULT"}
          </button>
        </form>

        <p className="text-center mt-8 text-white/30 text-[10px] font-black uppercase tracking-widest">
          New here? <Link to="/register" className="text-orange-500 hover:underline">Create Account</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;