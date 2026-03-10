import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Lock, User, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const Login = ({ setToken }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // Backend Auth Endpoint
      const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });
      const token = res.data.token;
      
      localStorage.setItem('adminToken', token); // Store JWT
      setToken(token);
      navigate('/'); // Redirect to Dashboard
    } catch (err) {
      alert('Invalid Credentials, Bhai!');
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7fe] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white rounded-[40px] shadow-2xl p-12 border border-gray-100"
      >
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-green-900 rounded-2xl mx-auto mb-6 flex items-center justify-center text-white shadow-xl">
            <Lock size={28} />
          </div>
          <h2 className="text-3xl font-black tracking-tighter text-gray-900 uppercase">Admin Access</h2>
          <p className="text-gray-400 font-bold text-xs mt-2 tracking-widest">MOUNTAIN MATE CONTROL PANEL</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="relative group">
            <User className="absolute left-5 top-5 text-gray-300 group-focus-within:text-green-700 transition" size={20} />
            <input 
              type="email" placeholder="Admin Email" required
              className="w-full bg-gray-50 border-none p-5 pl-14 rounded-2xl outline-none focus:ring-2 ring-green-700 transition font-semibold"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="relative group">
            <Lock className="absolute left-5 top-5 text-gray-300 group-focus-within:text-green-700 transition" size={20} />
            <input 
              type="password" placeholder="Password" required
              className="w-full bg-gray-50 border-none p-5 pl-14 rounded-2xl outline-none focus:ring-2 ring-green-700 transition font-semibold"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="w-full bg-gray-900 text-white py-5 rounded-2xl font-black hover:bg-green-800 transition-all flex items-center justify-center gap-3 shadow-xl">
            AUTHENTICATE <ArrowRight size={20} />
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default Login;