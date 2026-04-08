import React, { useEffect, useRef } from "react";

function prefersReducedMotion() {
  return typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function ParticlesCanvas({ density = 42 }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const resizeHandlerRef = useRef(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (typeof document !== "undefined" && document.visibilityState === "hidden") return;

    const particles = [];
    const mouse = { x: 0.5, y: 0.5 };
    let isRunning = true;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const { clientWidth, clientHeight } = canvas;
      canvas.width = Math.floor(clientWidth * dpr);
      canvas.height = Math.floor(clientHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const init = () => {
      particles.length = 0;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const count = Math.max(18, Math.floor((w * h) / 45000) + density);

      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25,
          r: 0.6 + Math.random() * 1.6,
          a: 0.06 + Math.random() * 0.08,
        });
      }
    };

    const draw = () => {
      if (!isRunning || document.visibilityState === "hidden") {
        rafRef.current = null;
        return;
      }

      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);

      // soft vignette
      const g = ctx.createRadialGradient(w * 0.5, h * 0.3, 0, w * 0.5, h * 0.3, Math.max(w, h));
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(1, "rgba(0,0,0,0.35)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      // particles
      for (const p of particles) {
        p.x += p.vx + (mouse.x - 0.5) * 0.06;
        p.y += p.vy + (mouse.y - 0.5) * 0.06;
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(249,115,22,${p.a})`;
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    const start = () => {
      if (rafRef.current || !isRunning || document.visibilityState === "hidden") return;
      rafRef.current = requestAnimationFrame(draw);
    };

    const stop = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };

    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = (e.clientX - rect.left) / rect.width;
      mouse.y = (e.clientY - rect.top) / rect.height;
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        stop();
        return;
      }

      resize();
      init();
      start();
    };

    resizeHandlerRef.current = () => {
      resize();
      init();
    };

    resize();
    init();
    start();

    window.addEventListener("resize", resizeHandlerRef.current, { passive: true });
    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("visibilitychange", handleVisibilityChange, { passive: true });

    return () => {
      isRunning = false;
      stop();
      if (resizeHandlerRef.current) {
        window.removeEventListener("resize", resizeHandlerRef.current);
      }
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [density]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full opacity-70"
      aria-hidden="true"
    />
  );
}

