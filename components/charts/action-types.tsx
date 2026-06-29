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

export function ActionTypesChart({
  data,
}: {
  data: { actionType: string; count: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(280, data.length * 24)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 18, left: 8, bottom: 0 }}
      >
        <CartesianGrid horizontal={false} />
        <XAxis type="number" tickLine={false} axisLine={false} />
        <YAxis
          type="category"
          dataKey="actionType"
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
        />
        <Bar dataKey="count" fill="#22d3ee" radius={[0, 6, 6, 0]} barSize={14} />
      </BarChart>
    </ResponsiveContainer>
  );
}
