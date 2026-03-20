import React from "react";
import { cn } from "./cn";

export function Container({ className, children, ...props }) {
  return (
    <div
      className={cn("max-w-7xl mx-auto px-6 sm:px-8 lg:px-12", className)}
      {...props}
    >
      {children}
    </div>
  );
}

