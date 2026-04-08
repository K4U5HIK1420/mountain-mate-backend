import React from "react";
import { cn } from "./cn";
import { trackEvent } from "../../utils/analytics";

const variants = {
  primary:
    "bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 text-white hover:brightness-110 border-orange-400/30 shadow-[0_18px_44px_rgba(249,115,22,0.28)]",
  ghost: "bg-white/0 text-white/70 hover:bg-white/10 hover:text-white border-white/10",
  danger:
    "bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white border-red-600/20",
  neutral:
    "bg-white text-black hover:bg-orange-600 hover:text-white border-white/20 shadow-[0_18px_44px_rgba(255,255,255,0.12)]",
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
  onClick,
  analyticsEvent,
  analyticsParams,
  ...props
}) {
  const Comp = As || "button";

  const handleClick = (event) => {
    if (analyticsEvent) {
      trackEvent(analyticsEvent, analyticsParams || {});
    }
    onClick?.(event);
  };

  return (
    <Comp
      className={cn(
        "inline-flex items-center justify-center gap-3 border font-black uppercase leading-none transition-all duration-500 ease-out active:scale-[0.985] disabled:pointer-events-none disabled:opacity-40 backdrop-blur-xl hover:-translate-y-1",
        variants[variant] || variants.primary,
        sizes[size] || sizes.md,
        className
      )}
      onClick={handleClick}
      {...props}
    >
      {children}
    </Comp>
  );
}

