"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const fmt = (v: number) =>
  new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(v);

export function TopMerchantsChart({
  data,
}: {
  data: { merchant: string; total: number; count: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(240, data.length * 36)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 18, left: 8, bottom: 0 }}
      >
        <CartesianGrid horizontal={false} />
        <XAxis
          type="number"
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `$${fmt(v)}`}
        />
        <YAxis
          type="category"
          dataKey="merchant"
          tickLine={false}
          axisLine={false}
          width={170}
          tick={{ fontSize: 11 }}
        />
        <Tooltip
          cursor={{ fill: "rgba(255,255,255,0.04)" }}
          contentStyle={{
            background: "#111a2c",
            border: "1px solid #1f2b45",
            borderRadius: 10,
            fontSize: 12,
          }}
          formatter={(value: number) => `$${value.toLocaleString()}`}
        />
        <Bar dataKey="total" fill="#f6c453" radius={[0, 6, 6, 0]} barSize={16} />
      </BarChart>
    </ResponsiveContainer>
  );
}
