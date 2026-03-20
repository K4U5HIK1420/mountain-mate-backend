import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion"; // <--- Import Fixed
import { Copy, Gift, Loader2, Users, Target, Zap } from "lucide-react";
import API from "../utils/api";
import { useNotify } from "../context/NotificationContext";

export default function Referral() {
  const { notify } = useNotify();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [redeemCode, setRedeemCode] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await API.get("/user/referral");
      setData(res.data?.data || null);
    } catch (err) {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const copy = async () => {
    if (!data?.code) return;
    try {
      await navigator.clipboard.writeText(data.code);
      notify("Referral code copied to uplink", "success");
    } catch {
      notify("Uplink failed: Could not copy", "error");
    }
  };

  const redeem = async () => {
    if (!redeemCode.trim()) return notify("Enter a valid code", "error");
    try {
      await API.post("/user/referral/redeem", { code: redeemCode });
      notify("Tactical Referral applied!", "success");
      setRedeemCode("");
      load();
    } catch (e) {
      notify(e?.response?.data?.message || "Invalid extraction code", "error");
    }
  };

  return (
    <div className="min-h-screen pt-40 pb-24 px-6 text-white bg-[#050505] selection:bg-orange-600">
      {/* Background Accent */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-orange-600/5 blur-[120px] rounded-full pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="max-w-5xl mx-auto relative z-10"
      >
        {/* Header Section */}
        <div className="mb-16 border-b border-white/5 pb-12">
          <p className="text-orange-500 font-black tracking-[0.6em] text-[10px] uppercase italic mb-4">Network Growth</p>
          <h1 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter leading-none">
            Expand the <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-600 to-orange-900">Fleet.</span>
          </h1>
          <p className="mt-6 text-white/40 max-w-xl font-medium italic">
            Mountain Mate is built on trust. Invite your squad to the expedition and unlock tactical rewards.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* LEFT: YOUR UNIQUE CODE */}
          <div className="lg:col-span-7 space-y-8">
            <div className="bg-white/5 border border-white/10 rounded-[50px] p-12 backdrop-blur-3xl shadow-3xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:rotate-12 transition-transform">
                <Target size={120} />
              </div>
              
              <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] italic mb-8">Personal Extraction Code</p>
              
              {loading ? (
                <div className="flex items-center gap-4 text-orange-500 font-black italic uppercase tracking-widest text-sm">
                  <Loader2 className="animate-spin" size={20} /> Establishing Uplink...
                </div>
              ) : !data?.code ? (
                <div className="p-8 border border-dashed border-white/10 rounded-3xl text-center">
                  <p className="text-white/30 text-sm italic">Session not found. Login as Explorer to generate code.</p>
                </div>
              ) : (
                <div className="space-y-10">
                  <div className="flex items-center justify-between bg-black/40 border border-white/5 rounded-[30px] p-2 pl-10 shadow-inner">
                    <span className="text-4xl font-black tracking-[0.3em] text-white italic">{data.code}</span>
                    <button 
                      onClick={copy}
                      className="bg-orange-600 hover:bg-white hover:text-black text-white px-8 py-5 rounded-[24px] font-black uppercase text-[10px] tracking-widest transition-all italic flex items-center gap-2"
                    >
                      <Copy size={14} /> Copy Code
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-white/[0.02] border border-white/5 p-6 rounded-3xl">
                      <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Referrals</p>
                      <p className="text-3xl font-black italic text-white">{data.referralCount || 0}</p>
                    </div>
                    <div className="bg-white/[0.02] border border-white/5 p-6 rounded-3xl">
                      <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Credits Earned</p>
                      <p className="text-3xl font-black italic text-orange-500">₹{data.credits || 0}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: REDEEM BOX */}
          <div className="lg:col-span-5">
            <div className="bg-orange-600 p-12 rounded-[50px] shadow-[0_30px_70px_rgba(234,88,12,0.2)] relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-20"><Zap size={60} /></div>
              
              <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white mb-8">Redeem <br />Access.</h2>
              
              <div className="space-y-4 relative z-10">
                <div className="relative">
                  <Gift className="absolute left-6 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                  <input 
                    value={redeemCode} 
                    onChange={(e) => setRedeemCode(e.target.value)} 
                    placeholder="ENTER VOUCHER"
                    className="w-full bg-white/10 border border-white/20 rounded-3xl py-5 pl-16 pr-6 text-white font-black placeholder:text-white/30 outline-none focus:bg-white/20 transition-all uppercase tracking-widest"
                  />
                </div>
                
                <button 
                  onClick={redeem}
                  className="w-full bg-white text-black py-5 rounded-3xl font-black uppercase text-[11px] tracking-[0.3em] hover:bg-black hover:text-white transition-all italic shadow-2xl"
                >
                  Apply Code
                </button>
                
                <p className="text-white/40 text-[9px] font-black uppercase tracking-widest text-center italic mt-4">
                  * Single use deployment per explorer account
                </p>
              </div>
            </div>

            {/* QUICK TIP */}
            <div className="mt-8 p-8 border border-white/5 rounded-[40px] bg-white/[0.02]">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-orange-600/10 rounded-2xl text-orange-500"><Users size={20}/></div>
                <div>
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-white mb-1">Fleet Rules</h4>
                  <p className="text-[10px] text-white/30 font-medium leading-relaxed uppercase">
                    Your friend gets ₹100 on signup, and you get ₹50 when they book their first summit stay.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}