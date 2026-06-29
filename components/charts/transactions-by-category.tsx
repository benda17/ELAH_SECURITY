"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const PALETTE = [
  "#22d3ee",
  "#a78bfa",
  "#f6c453",
  "#34d399",
  "#fb7185",
  "#fbbf24",
  "#60a5fa",
  "#f472b6",
  "#94a3b8",
  "#f97316",
];

export function TransactionsByCategoryChart({
  data,
}: {
  data: { category: string; count: number; total: number }[];
}) {
  return (
    <div className="flex h-[260px] items-center">
      <ResponsiveContainer width="55%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="category"
            innerRadius={50}
            outerRadius={92}
            paddingAngle={2}
            stroke="none"
          >
            {data.map((entry, i) => (
              <Cell key={entry.category} fill={PALETTE[i % PALETTE.length]} />
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

      <ul className="ml-2 flex flex-1 flex-col gap-1.5 text-xs">
        {data.map((d, i) => (
          <li key={d.category} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              <span
                className="inline-block size-2.5 rounded-sm"
                style={{ background: PALETTE[i % PALETTE.length] }}
              />
              <span className="capitalize text-ink">{d.category}</span>
            </span>
            <span className="tabular-nums text-ink-muted">{d.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
