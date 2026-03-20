import React from "react";
import { cn } from "./cn";

export function Card({ className, children, ...props }) {
  return (
    <div
      className={cn(
        "bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[40px] shadow-2xl",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }) {
  return (
    <div className={cn("p-8 md:p-10 border-b border-white/10", className)} {...props}>
      {children}
    </div>
  );
}

export function CardContent({ className, children, ...props }) {
  return (
    <div className={cn("p-8 md:p-10", className)} {...props}>
      {children}
    </div>
  );
}

