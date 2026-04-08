import React, { Suspense, useEffect, useState } from "react";

const ParticlesCanvas = React.lazy(() => import("./ParticlesCanvas"));

function supportsEnhancedBackground() {
  if (typeof window === "undefined") return false;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return false;
  if (!window.matchMedia?.("(min-width: 1024px)").matches) return false;
  if (window.matchMedia?.("(pointer: coarse)").matches) return false;
  return true;
}

export default function AnimatedBackground({ variant = "default" }) {
  const [showParticles, setShowParticles] = useState(false);

  useEffect(() => {
    if (!supportsEnhancedBackground()) return;

    let cancelled = false;
    const loadParticles = () => {
      if (!cancelled) {
        setShowParticles(true);
      }
    };

    if ("requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(loadParticles, { timeout: 1200 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback?.(idleId);
      };
    }

    const timeoutId = window.setTimeout(loadParticles, 350);
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, []);

  const base =
    "fixed inset-0 -z-10 overflow-hidden pointer-events-none bg-slate-50 dark:bg-[#050505]";

  const toneDark =
    variant === "admin"
      ? "from-black via-[#06121a] to-[#050505]"
      : "from-black via-[#160b06] to-[#050505]";

  const toneLight =
    variant === "admin"
      ? "from-slate-50 via-slate-100 to-slate-50"
      : "from-slate-50 via-orange-50 to-slate-50";

  return (
    <div className={base} aria-hidden="true">
      {/* Deep vignette + gradient */}
      <div className={`absolute inset-0 bg-gradient-to-b ${toneLight} dark:${toneDark}`} />
      <div className="absolute inset-0 dark:bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_0%,rgba(0,0,0,0.65)_65%,rgba(0,0,0,0.9)_100%)] bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0)_0%,rgba(255,255,255,0.55)_65%,rgba(255,255,255,0.85)_100%)]" />

      {/* Subtle animated aurora */}
      <div className="absolute -inset-[40%] bg-[conic-gradient(from_180deg_at_50%_50%,rgba(249,115,22,0.22),rgba(245,158,11,0.14),rgba(34,197,94,0.10),rgba(59,130,246,0.10),rgba(249,115,22,0.22))] opacity-30 dark:opacity-35 blur-3xl animate-aurora" />

      {/* Floating light blobs */}
      <div className="absolute -left-32 top-20 h-[520px] w-[520px] rounded-full bg-orange-600/10 dark:bg-orange-600/10 blur-3xl animate-float-slow" />
      <div className="absolute -right-40 top-40 h-[620px] w-[620px] rounded-full bg-amber-400/12 dark:bg-amber-400/10 blur-3xl animate-float-slower" />
      <div className="absolute left-1/2 -translate-x-1/2 -bottom-60 h-[760px] w-[760px] rounded-full bg-emerald-500/8 dark:bg-emerald-500/5 blur-3xl animate-float-slowest" />

      {/* Only load the canvas layer on larger, motion-capable devices after first paint. */}
      {showParticles ? (
        <Suspense fallback={null}>
          <ParticlesCanvas density={variant === "admin" ? 28 : 36} />
        </Suspense>
      ) : null}

      {/* Fine grain/noise (very subtle) */}
      <div className="absolute inset-0 opacity-[0.04] dark:opacity-[0.06] mix-blend-overlay bg-noise" />
    </div>
  );
}

