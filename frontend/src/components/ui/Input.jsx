import React from "react";
import { cn } from "./cn";

export const Input = React.forwardRef(function Input(
  { className, leftIcon: LeftIcon, ...props },
  ref
) {
<<<<<<< HEAD
  return (
    <div className={cn("relative group w-full", className)}>
      {/* Logic Update: Check if LeftIcon is a valid component before rendering */}
      {LeftIcon && typeof LeftIcon === 'function' ? (
        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-orange-600 pointer-events-none z-10">
          <LeftIcon size={16} />
        </div>
      ) : LeftIcon ? (
        /* Fallback if Icon is passed as an element instead of a component */
        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-orange-600 pointer-events-none z-10">
          {LeftIcon}
=======
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
>>>>>>> 340ae896844c3324af5d17ca2aa02f2c08e6427d
        </div>
      ) : null}

      <input
        ref={ref}
        className={cn(
          "w-full bg-white/5 border border-white/10 text-white outline-none transition-all font-bold placeholder:text-white/15",
          "focus:border-orange-600/60",
          LeftIcon ? "pl-14 pr-6" : "px-6",
          "py-5 rounded-[30px]",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
        {...props}
      />
    </div>
  );
});

<<<<<<< HEAD
Input.displayName = "Input";
=======
Input.displayName = "Input";
>>>>>>> 340ae896844c3324af5d17ca2aa02f2c08e6427d
