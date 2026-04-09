"use client";

import { ReactNode } from "react";
import clsx from "clsx";

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  icon?: ReactNode;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  className?: string;
}

export default function StatCard({
  label, value, sub, icon, trend, trendValue, className,
}: StatCardProps) {
  return (
    <div className={clsx(
      "gradient-border p-5 rounded-xl flex flex-col gap-3",
      className,
    )}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500 uppercase tracking-wider font-medium">{label}</span>
        {icon && (
          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400">
            {icon}
          </div>
        )}
      </div>

      <div>
        <div className="text-2xl font-semibold text-white">{value}</div>
        {sub && <div className="text-xs text-slate-500 mt-0.5">{sub}</div>}
      </div>

      {trendValue && (
        <div className={clsx(
          "text-xs font-medium flex items-center gap-1",
          trend === "up"   && "text-brand-400",
          trend === "down" && "text-red-400",
          trend === "neutral" && "text-slate-400",
        )}>
          {trend === "up" && "↑"}
          {trend === "down" && "↓"}
          {trendValue}
        </div>
      )}
    </div>
  );
}
