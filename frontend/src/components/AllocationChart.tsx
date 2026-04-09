"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

interface AllocationChartProps {
  stablePct: number;
  growthPct: number;
}

const COLORS = ["#3b82f6", "#22c55e"];

export default function AllocationChart({ stablePct, growthPct }: AllocationChartProps) {
  const data = [
    { name: "Stable Assets", value: stablePct },
    { name: "Growth Assets", value: growthPct },
  ];

  return (
    <div className="gradient-border rounded-xl p-5">
      <h3 className="text-sm font-medium text-white mb-1">Asset Allocation</h3>
      <p className="text-xs text-slate-500 mb-4">Current portfolio distribution</p>

      <div className="flex items-center gap-4">
        <ResponsiveContainer width={120} height={120}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={35}
              outerRadius={55}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i]} strokeWidth={0} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v: number) => `${v}%`}
              contentStyle={{
                background: "#0d1526",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "8px",
                fontSize: "12px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="flex flex-col gap-3 flex-1">
          {data.map((item, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i] }} />
                <span className="text-xs text-slate-400">{item.name}</span>
              </div>
              <span className="text-xs font-semibold text-white">{item.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
