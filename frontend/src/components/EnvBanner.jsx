import React from "react";

export default function EnvBanner({ title, lines }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-2xl w-full bg-white/[0.04] border border-white/10 rounded-[34px] p-10 backdrop-blur-2xl">
        <h1 className="text-white font-black text-2xl tracking-tight">{title}</h1>
        <div className="mt-6 space-y-2">
          {lines.map((l, i) => (
            <p key={i} className="text-white/60 text-sm font-medium leading-relaxed">
              {l}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

