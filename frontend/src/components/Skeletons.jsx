import React from "react";

const Card = ({ className = "" }) => (
  <div
    className={`animate-pulse rounded-[45px] border border-white/10 bg-white/[0.03] overflow-hidden shadow-2xl ${className}`}
  >
    <div className="h-64 bg-white/5" />
    <div className="p-8 space-y-4">
      <div className="h-3 w-24 rounded bg-white/10" />
      <div className="h-7 w-2/3 rounded bg-white/10" />
      <div className="h-3 w-1/2 rounded bg-white/10" />
      <div className="pt-6 border-t border-white/10 flex items-center justify-between">
        <div className="h-7 w-24 rounded bg-white/10" />
        <div className="h-10 w-10 rounded-full bg-white/10" />
      </div>
    </div>
  </div>
);

export const StaysGridSkeleton = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="h-[480px]" />
      ))}
    </div>
  );
};

export const RidesGridSkeleton = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} />
      ))}
    </div>
  );
};