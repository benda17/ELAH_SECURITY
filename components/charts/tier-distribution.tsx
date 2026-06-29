"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

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
    <div className="relative flex h-[240px] items-center">
      <ResponsiveContainer width="60%" height="100%">
        <PieChart>
          <Pie
            data={filtered}
            dataKey="count"
            nameKey="tier"
            innerRadius={52}
            outerRadius={86}
            paddingAngle={2}
            stroke="none"
          >
            {filtered.map((entry) => (
              <Cell
                key={entry.tier}
                fill={COLORS[entry.tier] ?? "#9aa7bd"}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "#111a2c",
              border: "1px solid #1f2b45",
              borderRadius: 10,
              fontSize: 12,
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="absolute left-[15%] top-1/2 -translate-y-1/2 text-center">
        <div className="text-[10px] uppercase tracking-wider text-ink-muted">
          Customers
        </div>
        <div className="text-2xl font-semibold tabular-nums">{total}</div>
      </div>

      <ul className="ml-2 flex flex-1 flex-col gap-2 text-sm">
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
    </div>
  );
}
