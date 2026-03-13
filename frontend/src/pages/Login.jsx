import React, { useState } from 'react';
import API from '../utils/api';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, Loader2 } from 'lucide-react';
import { useNavigate, Link, useLocation } from 'react-router-dom'; // ✅ useLocation add kiya

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation(); // ✅ Location track karne ke liye

  // Pehle wale page ka path dhoondo (agar user redirect hoke aaya hai)
  const from = location.state?.from || '/explore-stays';

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await API.post('/auth/login', { email, password });
      
      // ✅ Token aur User data save
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));

      // ✅ SMART REDIRECT: Wapas wahi bhejo jahan se wo aaya tha
      navigate(from, { replace: true }); 
      
      // Navbar refresh ke liye simple approach
      window.location.reload(); 
      
    } catch (err) {
      alert(err.response?.data?.message || "Invalid Credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] px-6 relative overflow-hidden">
      {/* Background Image */}
      <img 
        src="https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=2500" 
        className="fixed inset-0 w-full h-full object-cover opacity-20 z-0" 
        alt="Mountain Background" 
      />
      
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

        <form onSubmit={handleLogin} className="space-y-6">
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

          <div className="space-y-2">
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
          </div>

          <button 
            disabled={loading} 
            type="submit" 
            className="w-full bg-white text-black p-6 rounded-[30px] font-black uppercase text-[11px] tracking-widest flex items-center justify-center gap-3 hover:bg-orange-600 hover:text-white transition-all shadow-xl active:scale-95"
          >
            {loading ? <Loader2 className="animate-spin" /> : <LogIn size={18} />}
            {loading ? "AUTHENTICATING..." : "ENTER VAULT"}
          </button>
        </form>

        <p className="text-center mt-8 text-white/30 text-[10px] font-black uppercase tracking-widest">
          New here? <Link to="/register" className="text-orange-500 hover:text-orange-400 transition-colors">Create Account</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;