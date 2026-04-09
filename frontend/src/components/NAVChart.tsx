"use client";

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import { MOCK_NAV_HISTORY } from "@/lib/mockData";

interface TooltipPayload {
  value: number;
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-lg px-3 py-2 text-sm border border-white/10">
      <div className="text-slate-400 text-xs">{label}</div>
      <div className="text-white font-semibold">NAV: {payload[0].value.toFixed(4)}</div>
    </div>
  );
}

export default function NAVChart() {
  return (
    <div className="gradient-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-white">NAV per Share</h3>
          <p className="text-xs text-slate-500 mt-0.5">30-day performance</p>
        </div>
        <div className="text-xs text-brand-400 font-medium bg-brand-500/10 px-2 py-1 rounded-md">
          +25.0%
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={MOCK_NAV_HISTORY} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="navGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis
            dataKey="date"
            tick={{ fill: "#64748b", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            interval={6}
          />
          <YAxis
            tick={{ fill: "#64748b", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            domain={["auto", "auto"]}
            tickFormatter={(v: number) => v.toFixed(2)}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="nav"
            stroke="#22c55e"
            strokeWidth={2}
            fill="url(#navGradient)"
            dot={false}
            activeDot={{ r: 4, fill: "#22c55e", strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
