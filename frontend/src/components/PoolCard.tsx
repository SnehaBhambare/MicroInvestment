"use client";

import { TrendingUp, Shield, Zap } from "lucide-react";
import clsx from "clsx";

interface Pool {
  id: string;
  name: string;
  risk: string;
  apy: number;
  totalValue: bigint;
  allocation: { stable: number; growth: number };
  color: string;
}

interface PoolCardProps {
  pool: Pool;
  onDeposit: (poolId: string) => void;
  isActive?: boolean;
}

const riskIcons: Record<string, React.ReactNode> = {
  Low:    <Shield size={14} />,
  Medium: <TrendingUp size={14} />,
  High:   <Zap size={14} />,
};

const riskColors: Record<string, string> = {
  Low:    "text-blue-400 bg-blue-500/10 border-blue-500/20",
  Medium: "text-brand-400 bg-brand-500/10 border-brand-500/20",
  High:   "text-amber-400 bg-amber-500/10 border-amber-500/20",
};

export default function PoolCard({ pool, onDeposit, isActive }: PoolCardProps) {
  const tvl = (Number(pool.totalValue) / 1e7).toLocaleString("en-US", {
    style: "currency", currency: "USD", maximumFractionDigits: 0,
  });

  return (
    <div className={clsx(
      "gradient-border rounded-xl p-5 flex flex-col gap-4 transition-all duration-200 hover:scale-[1.01]",
      isActive && "ring-1 ring-brand-500/40",
    )}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-white font-semibold text-sm">{pool.name}</h3>
          <div className={clsx(
            "inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-xs border",
            riskColors[pool.risk],
          )}>
            {riskIcons[pool.risk]}
            {pool.risk} Risk
          </div>
        </div>
        <div className="text-right">
          <div className="text-brand-400 font-bold text-lg">{pool.apy}%</div>
          <div className="text-xs text-slate-500">Est. APY</div>
        </div>
      </div>

      {/* Allocation bar */}
      <div>
        <div className="flex justify-between text-xs text-slate-500 mb-1.5">
          <span>Stable {pool.allocation.stable}%</span>
          <span>Growth {pool.allocation.growth}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden flex">
          <div
            className="h-full bg-blue-500 transition-all"
            style={{ width: `${pool.allocation.stable}%` }}
          />
          <div
            className="h-full bg-brand-500 transition-all"
            style={{ width: `${pool.allocation.growth}%` }}
          />
        </div>
      </div>

      {/* TVL */}
      <div className="flex justify-between items-center text-xs">
        <span className="text-slate-500">Total Value Locked</span>
        <span className="text-white font-mono font-medium">{tvl}</span>
      </div>

      {/* Action */}
      <button
        onClick={() => onDeposit(pool.id)}
        className="w-full py-2.5 rounded-lg bg-white/5 hover:bg-brand-500/20 hover:text-brand-400 text-slate-300 text-sm font-medium transition-colors border border-white/5 hover:border-brand-500/30"
      >
        Deposit
      </button>
    </div>
  );
}
