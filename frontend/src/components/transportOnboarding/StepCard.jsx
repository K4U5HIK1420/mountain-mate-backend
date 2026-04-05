import React from "react";

export default function StepCard({ title, subtitle, children, rightSlot }) {
  return (
    <div className="rounded-[32px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl md:p-8">
      <div className="mb-6 flex items-start justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-white">{title}</h2>
          {subtitle ? <p className="mt-2 text-sm text-white/55">{subtitle}</p> : null}
        </div>
        {rightSlot ? <div>{rightSlot}</div> : null}
      </div>
      {children}
    </div>
  );
}
