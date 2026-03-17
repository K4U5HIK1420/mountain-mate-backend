import React from "react";
import ParticlesCanvas from "./ParticlesCanvas";

export default function AnimatedBackground({ variant = "default" }) {
  const base =
    "fixed inset-0 -z-10 overflow-hidden bg-[#050505] pointer-events-none";

  const tone =
    variant === "admin"
      ? "from-black via-[#06121a] to-[#050505]"
      : "from-black via-[#160b06] to-[#050505]";

  return (
    <div className={base} aria-hidden="true">
      {/* Deep vignette + gradient */}
      <div className={`absolute inset-0 bg-gradient-to-b ${tone}`} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_0%,rgba(0,0,0,0.65)_65%,rgba(0,0,0,0.9)_100%)]" />

      {/* Subtle animated aurora */}
      <div className="absolute -inset-[40%] bg-[conic-gradient(from_180deg_at_50%_50%,rgba(249,115,22,0.20),rgba(245,158,11,0.10),rgba(34,197,94,0.08),rgba(59,130,246,0.08),rgba(249,115,22,0.20))] opacity-35 blur-3xl animate-aurora" />

      {/* Floating light blobs */}
      <div className="absolute -left-32 top-20 h-[520px] w-[520px] rounded-full bg-orange-600/10 blur-3xl animate-float-slow" />
      <div className="absolute -right-40 top-40 h-[620px] w-[620px] rounded-full bg-amber-400/10 blur-3xl animate-float-slower" />
      <div className="absolute left-1/2 -translate-x-1/2 -bottom-60 h-[760px] w-[760px] rounded-full bg-emerald-500/5 blur-3xl animate-float-slowest" />

      {/* Interactive particle layer */}
      <ParticlesCanvas />

      {/* Fine grain/noise (very subtle) */}
      <div className="absolute inset-0 opacity-[0.06] mix-blend-overlay bg-noise" />
    </div>
  );
}

