"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const TIER_COLORS: Record<string, string> = {
  basic: "#22d3ee",
  premium: "#a78bfa",
  vip: "#f6c453",
};

export function CustomerActivityChart({
  data,
}: {
  data: { name: string; tier: string; count: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(220, data.length * 56)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 18, left: 8, bottom: 0 }}
      >
        <CartesianGrid horizontal={false} />
        <XAxis type="number" tickLine={false} axisLine={false} />
        <YAxis
          type="category"
          dataKey="name"
          tickLine={false}
          axisLine={false}
          width={150}
        />
        <Tooltip
          cursor={{ fill: "rgba(255,255,255,0.04)" }}
          contentStyle={{
            background: "#111a2c",
            border: "1px solid #1f2b45",
            borderRadius: 10,
            fontSize: 12,
          }}
        />
        <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={22}>
          {data.map((d) => (
            <Cell key={d.name} fill={TIER_COLORS[d.tier] ?? "#9aa7bd"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
