import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Copy, Gift, Loader2, Users, Target, Zap, Check, Share2, TrendingUp } from "lucide-react";
import API from "../utils/api";
import { useNotify } from "../context/NotificationContext";

export default function Referral() {
  const { notify } = useNotify();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [redeemCode, setRedeemCode] = useState("");
  const [copied, setCopied] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await API.get("/user/referral");
      setData(res.data?.data || null);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const copyToClipboard = async () => {
    if (!data?.code) return;
    try {
      await navigator.clipboard.writeText(data.code);
      setCopied(true);
      notify("Referral code copied", "success");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      notify("Could not copy referral code", "error");
    }
  };

  const redeem = async () => {
    if (!redeemCode.trim()) return notify("Enter a valid code", "error");
    try {
      await API.post("/user/referral/redeem", { code: redeemCode });
      notify("Referral applied successfully", "success");
      setRedeemCode("");
      load();
    } catch (e) {
      notify(e?.response?.data?.message || "Invalid referral code", "error");
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-24 px-6 text-white bg-[#050505] overflow-hidden">
      <div className="fixed top-[-10%] right-[-5%] w-[600px] h-[600px] bg-orange-600/10 blur-[150px] rounded-full pointer-events-none animate-pulse" />
      <div className="fixed bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-orange-900/10 blur-[120px] rounded-full pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto relative z-10">
        <div className="mb-20 text-center md:text-left flex flex-col md:flex-row justify-between items-end gap-8 border-b border-white/5 pb-16">
          <div className="max-w-2xl">
            <motion.div initial={{ x: -20 }} animate={{ x: 0 }} className="flex items-center gap-2 text-orange-500 mb-6 justify-center md:justify-start">
              <span className="h-[1px] w-12 bg-orange-600" />
              <p className="font-black tracking-[0.5em] text-[10px] uppercase italic">Referral Program</p>
            </motion.div>
            <h1 className="text-7xl md:text-9xl font-black italic uppercase tracking-tighter leading-[0.85] mb-8">
              SHARE THE <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-600 to-white">JOURNEY.</span>
            </h1>
            <p className="text-white/40 font-medium italic text-lg leading-relaxed">
              Invite friends to Mountain Mate, track successful signups, and redeem referral codes directly from your account.
            </p>
          </div>

          <div className="hidden lg:flex gap-4">
            <div className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl">
              <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-1 italic">Status</p>
              <p className="text-xl font-bold italic">{loading ? "Syncing" : "Active"}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7">
            <div className="h-full bg-gradient-to-br from-white/10 to-transparent border border-white/10 rounded-[45px] p-1 shadow-2xl overflow-hidden group">
              <div className="bg-[#0a0a0a] h-full w-full rounded-[44px] p-10 md:p-14 relative overflow-hidden">
                <Target size={280} className="absolute -bottom-20 -right-20 text-white/[0.02] -rotate-12 group-hover:rotate-0 transition-transform duration-1000" />

                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-12">
                    <div>
                      <h3 className="text-2xl font-black italic uppercase tracking-tight text-white">Your Referral Code</h3>
                      <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em] mt-1">Share this with new users</p>
                    </div>
                    <Share2 className="text-white/20" size={20} />
                  </div>

                  {loading ? (
                    <div className="h-40 flex items-center justify-center">
                      <Loader2 className="animate-spin text-orange-600" size={40} />
                    </div>
                  ) : (
                    <div className="space-y-12">
                      <div className="relative group/btn">
                        <div className="absolute -inset-1 bg-gradient-to-r from-orange-600 to-orange-900 rounded-[30px] blur opacity-25 group-hover/btn:opacity-60 transition duration-1000" />
                        <div className="relative flex items-center justify-between bg-black rounded-[28px] p-3 border border-white/10">
                          <span className="text-4xl md:text-5xl font-black tracking-[0.2em] text-white italic pl-8 selection:bg-orange-600">
                            {data?.code || "Unavailable"}
                          </span>
                          <button
                            onClick={copyToClipboard}
                            disabled={!data?.code}
                            className={`flex items-center gap-3 px-10 py-5 rounded-[22px] font-black uppercase text-[11px] tracking-widest transition-all italic shadow-xl ${
                              copied ? "bg-green-600 text-white" : "bg-white text-black hover:bg-orange-600 hover:text-white"
                            } disabled:opacity-60`}
                          >
                            {copied ? <Check size={16} /> : <Copy size={16} />}
                            {copied ? "Copied" : "Copy"}
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <StatsBox icon={<Users size={18} />} label="Successful Referrals" val={data?.referralCount || 0} />
                        <StatsBox icon={<TrendingUp size={18} />} label="Credits Earned" val={`Rs ${data?.credits || 0}`} color="text-orange-500" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col gap-8">
            <div className="bg-orange-600 rounded-[45px] p-12 shadow-[0_40px_100px_rgba(234,88,12,0.15)] relative overflow-hidden flex-1 group">
              <Zap size={120} className="absolute -top-10 -right-10 text-black/10 group-hover:scale-110 transition-transform duration-700" />

              <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                  <h2 className="text-4xl font-black italic uppercase tracking-tighter text-white leading-none mb-4">
                    Redeem a <br />Code
                  </h2>
                  <p className="text-black/50 text-xs font-bold uppercase tracking-widest italic mb-10">
                    Apply someone else's referral code once
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="relative">
                    <Gift className="absolute left-6 top-1/2 -translate-y-1/2 text-black/40" size={20} />
                    <input
                      value={redeemCode}
                      onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                      placeholder="Enter referral code"
                      className="w-full bg-black/10 border border-white/20 rounded-3xl py-6 pl-16 pr-6 text-white font-black placeholder:text-black/25 outline-none focus:bg-black/20 transition-all uppercase tracking-[0.15em] text-lg"
                    />
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={redeem}
                    className="w-full bg-white text-black py-6 rounded-3xl font-black uppercase text-xs tracking-[0.3em] hover:bg-black hover:text-white transition-all italic shadow-2xl"
                  >
                    Redeem Code
                  </motion.button>
                </div>
              </div>
            </div>

            <div className="p-8 border border-white/5 rounded-[40px] bg-white/[0.02] backdrop-blur-md">
              <div className="flex items-center gap-6">
                <div className="p-4 bg-orange-600/10 rounded-2xl text-orange-500 shadow-inner">
                  <Zap size={24} className="animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-white/80">How it works</h4>
                  <p className="text-[10px] text-white/30 font-bold uppercase mt-1 leading-relaxed italic">
                    Share your code with friends. When they redeem it successfully, your referral stats and credits update here.
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

const StatsBox = ({ icon, label, val, color = "text-white" }) => (
  <div className="bg-white/[0.03] border border-white/5 p-8 rounded-[30px] hover:bg-white/[0.05] transition-colors">
    <div className="flex items-center gap-3 mb-4 text-white/20">
      {icon}
      <p className="text-[9px] font-black uppercase tracking-widest italic">{label}</p>
    </div>
    <p className={`text-4xl font-black italic tracking-tighter ${color}`}>{val}</p>
  </div>
);
