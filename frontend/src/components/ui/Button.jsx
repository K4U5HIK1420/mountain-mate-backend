import React from "react";
import { cn } from "./cn";

const variants = {
  primary:
    "bg-orange-600 text-white hover:bg-white hover:text-black border-orange-500/20",
  ghost: "bg-white/0 text-white/70 hover:bg-white/10 hover:text-white border-white/10",
  danger:
    "bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white border-red-600/20",
  neutral:
    "bg-white text-black hover:bg-orange-600 hover:text-white border-white/20",
};

const sizes = {
  sm: "px-4 py-2.5 rounded-2xl text-[10px] tracking-[0.25em]",
  md: "px-6 py-4 rounded-[24px] text-[11px] tracking-[0.3em]",
  lg: "px-8 py-5 rounded-[30px] text-[12px] tracking-[0.35em]",
};

export function Button({
  as: As,
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}) {
  const Comp = As || "button";
  return (
    <Comp
      className={cn(
        "inline-flex items-center justify-center gap-3 font-black uppercase leading-none transition-all active:scale-[0.99] disabled:opacity-40 disabled:pointer-events-none border",
        variants[variant] || variants.primary,
        sizes[size] || sizes.md,
        className
      )}
      {...props}
    >
      {children}
    </Comp>
  );
}

