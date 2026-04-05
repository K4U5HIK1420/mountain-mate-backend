import React from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { Button } from "../components/ui/Button";

export default function PaymentResult({ ok }) {
  const location = useLocation();
  const isOk = ok ?? location.pathname.includes("success");

  return (
    <div className="min-h-screen pt-40 pb-24 px-6 text-white">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
        <div className="bg-white/[0.03] border border-white/10 rounded-[46px] p-10 md:p-14 backdrop-blur-2xl shadow-2xl text-center">
          <div
            className={`w-20 h-20 rounded-3xl mx-auto flex items-center justify-center border ${
              isOk ? "bg-green-500/10 border-green-500/20" : "bg-red-500/10 border-red-500/20"
            }`}
          >
            {isOk ? <CheckCircle2 size={36} className="text-green-400" /> : <XCircle size={36} className="text-red-400" />}
          </div>
          <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter mt-8">
            Payment{" "}
            <span
              className={`text-transparent bg-clip-text bg-gradient-to-r ${
                isOk ? "from-green-300 to-green-600" : "from-red-300 to-red-600"
              }`}
            >
              {isOk ? "Success" : "Failed"}
            </span>
          </h1>
          <p className="text-white/45 mt-4 text-sm">
            {isOk
              ? "Payment is complete. Your request is now waiting for owner or driver approval."
              : "Payment didn't go through. Please try again."}
          </p>

          <div className="mt-10 grid gap-3">
            <Button as={Link} to="/bookings" size="lg" className="w-full">
              Go to Bookings <ArrowRight size={16} />
            </Button>
            <Button as={Link} to="/explore-stays" variant="ghost" size="lg" className="w-full">
              Continue exploring
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
