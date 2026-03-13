import React, { useState } from 'react';
import API from '../utils/api';
import { motion } from 'framer-motion';
import { User, Mail, Lock, UserPlus, Loader2 } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useNotify } from "../context/NotificationContext";

const Register = () => {
  const { notify } = useNotify();
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/auth/register', formData);
      notify("Account Created! Now Login. 🏔️", "success");
      navigate('/login');
    } catch (err) {
      notify(err.response?.data?.message || "Registration Failed", "error");
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

        <form onSubmit={handleRegister} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[9px] font-black text-white/30 uppercase ml-4 tracking-widest flex items-center gap-2"><User size={12}/> Full Name</label>
            <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-white/5 border border-white/10 p-6 rounded-[30px] text-white outline-none focus:border-orange-600 transition-all font-bold" placeholder="Shardul" />
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black text-white/30 uppercase ml-4 tracking-widest flex items-center gap-2"><Mail size={12}/> Email</label>
            <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full bg-white/5 border border-white/10 p-6 rounded-[30px] text-white outline-none focus:border-orange-600 transition-all font-bold" placeholder="kedar@mate.com" />
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black text-white/30 uppercase ml-4 tracking-widest flex items-center gap-2"><Lock size={12}/> Password</label>
            <input type="password" required value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full bg-white/5 border border-white/10 p-6 rounded-[30px] text-white outline-none focus:border-orange-600 transition-all font-bold" placeholder="••••••••" />
          </div>

          <button disabled={loading} type="submit" className="w-full bg-orange-600 text-white p-6 rounded-[30px] font-black uppercase text-[11px] tracking-widest flex items-center justify-center gap-3 hover:bg-white hover:text-black transition-all">
            {loading ? <Loader2 className="animate-spin" /> : <UserPlus size={18} />}
            {loading ? "CREATING..." : "CREATE ACCOUNT"}
          </button>
        </form>

        <p className="text-center mt-8 text-white/30 text-[10px] font-black uppercase tracking-widest">
          Already a member? <Link to="/login" className="text-white hover:text-orange-500">Login</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Register;