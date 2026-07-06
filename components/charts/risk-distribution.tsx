"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { ChartTooltip, DonutWithLegend } from "./chart-primitives";

const COLORS: Record<string, string> = {
  low: "#22d3ee",
  medium: "#fbbf24",
  high: "#fb7185",
  critical: "#a78bfa",
};

export function RiskDistributionChart({
  data,
}: {
  data: { riskLevel: string; count: number }[];
}) {
  const filtered = data.filter((d) => d.count > 0);
  const total = filtered.reduce((acc, d) => acc + d.count, 0);

  return (
    <DonutWithLegend
      centerLabel="Total"
      centerValue={total}
      chart={
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <Pie
              data={filtered}
              dataKey="count"
              nameKey="riskLevel"
              cx="50%"
              cy="50%"
              innerRadius={62}
              outerRadius={92}
              paddingAngle={2}
              stroke="none"
            >
              {filtered.map((entry) => (
                <Cell key={entry.riskLevel} fill={COLORS[entry.riskLevel] ?? "#9aa7bd"} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      }
      legend={
        <ul className="flex flex-col gap-2 text-sm">
          {data.map((d) => (
            <li key={d.riskLevel} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2">
                <span
                  className="inline-block size-2.5 rounded-sm"
                  style={{ background: COLORS[d.riskLevel] ?? "#9aa7bd" }}
                />
                <span className="capitalize text-ink">{d.riskLevel}</span>
              </span>
              <span className="tabular-nums text-ink-muted">
                {d.count.toLocaleString()}{" "}
                <span className="text-ink-dim">
                  ({total ? ((d.count / total) * 100).toFixed(1) : 0}%)
                </span>
              </span>
            </li>
          ))}
        </ul>
      }
    />
  );
}
