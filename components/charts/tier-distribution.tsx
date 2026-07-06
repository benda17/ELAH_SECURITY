"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { ChartTooltip, DonutWithLegend } from "./chart-primitives";

const COLORS: Record<string, string> = {
  basic: "#22d3ee",
  premium: "#a78bfa",
  vip: "#f6c453",
};

export function TierDistributionChart({
  data,
}: {
  data: { tier: string; count: number }[];
}) {
  const filtered = data.filter((d) => d.count > 0);
  const total = filtered.reduce((s, d) => s + d.count, 0);

  return (
    <DonutWithLegend
      centerLabel="Customers"
      centerValue={total}
      chart={
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <Pie
              data={filtered}
              dataKey="count"
              nameKey="tier"
              cx="50%"
              cy="50%"
              innerRadius={52}
              outerRadius={86}
              paddingAngle={2}
              stroke="none"
            >
              {filtered.map((entry) => (
                <Cell key={entry.tier} fill={COLORS[entry.tier] ?? "#9aa7bd"} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      }
      legend={
        <ul className="flex flex-col gap-2 text-sm">
          {data.map((d) => (
            <li key={d.tier} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2">
                <span
                  className="inline-block size-2.5 rounded-sm"
                  style={{ background: COLORS[d.tier] ?? "#9aa7bd" }}
                />
                <span className="capitalize text-ink">{d.tier}</span>
              </span>
              <span className="tabular-nums text-ink-muted">
                {d.count}{" "}
                <span className="text-ink-dim">
                  ({total ? ((d.count / total) * 100).toFixed(0) : 0}%)
                </span>
              </span>
            </li>
          ))}
        </ul>
      }
    />
  );
}
