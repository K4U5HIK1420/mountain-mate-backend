import React from "react";
import { cn } from "./cn";

export function Field({ label, hint, error, icon: Icon, children, className }) {
  return (
    <div className={cn("space-y-2", className)}>
      {label ? (
        <label className="text-[9px] font-black text-white/30 uppercase ml-4 tracking-widest flex items-center gap-2">
          {Icon ? <Icon size={12} /> : null}
          {label}
        </label>
      ) : null}
      {children}
      {error ? (
        <p className="text-[10px] font-bold text-red-400/90 ml-4">{error}</p>
      ) : hint ? (
        <p className="text-[10px] font-bold text-white/25 ml-4">{hint}</p>
      ) : null}
    </div>
  );
}

