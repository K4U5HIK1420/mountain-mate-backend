import React from "react";
import { cn } from "./cn";

export const Input = React.forwardRef(function Input(
  { className, leftIcon: LeftIcon, ...props },
  ref
) {
  const iconNode = React.isValidElement(LeftIcon)
    ? LeftIcon
    : LeftIcon
      ? <LeftIcon size={16} />
      : null;

  return (
    <div className={cn("relative group w-full", className)}>
      {iconNode ? (
        <div className="pointer-events-none absolute left-6 top-1/2 z-10 -translate-y-1/2 text-orange-600">
          {iconNode}
        </div>
      ) : null}

      <input
        ref={ref}
        className={cn(
          "w-full rounded-[30px] border border-white/10 bg-white/5 py-5 text-white outline-none transition-all font-bold placeholder:text-white/15",
          "focus:border-orange-600/60",
          iconNode ? "pl-14 pr-6" : "px-6",
          "disabled:cursor-not-allowed disabled:opacity-50"
        )}
        {...props}
      />
    </div>
  );
});

Input.displayName = "Input";
