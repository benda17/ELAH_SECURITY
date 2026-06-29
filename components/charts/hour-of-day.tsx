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

export function HourOfDayChart({
  data,
}: {
  data: { hour: number; count: number }[];
}) {
  const display = data.map((d) => ({
    ...d,
    label: `${String(d.hour).padStart(2, "0")}:00`,
  }));
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={display} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          interval={1}
          tick={{ fontSize: 10 }}
        />
        <YAxis tickLine={false} axisLine={false} width={36} />
        <Tooltip
          cursor={{ fill: "rgba(255,255,255,0.04)" }}
          contentStyle={{
            background: "#111a2c",
            border: "1px solid #1f2b45",
            borderRadius: 10,
            fontSize: 12,
          }}
        />
        <Bar dataKey="count" fill="#a78bfa" radius={[6, 6, 0, 0]} barSize={10} />
      </BarChart>
    </ResponsiveContainer>
  );
}
