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

const COLOR_WEEKDAY = "#22d3ee";
const COLOR_WEEKEND = "#a78bfa";

export function WeekdayActivityChart({
  data,
}: {
  data: { label: string; count: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} />
        <YAxis tickLine={false} axisLine={false} width={42} />
        <Tooltip
          cursor={{ fill: "rgba(255,255,255,0.04)" }}
          contentStyle={{
            background: "#111a2c",
            border: "1px solid #1f2b45",
            borderRadius: 10,
            fontSize: 12,
          }}
        />
        <Bar dataKey="count" radius={[8, 8, 0, 0]} barSize={28}>
          {data.map((d) => (
            <Cell
              key={d.label}
              fill={
                d.label === "Sat" || d.label === "Sun"
                  ? COLOR_WEEKEND
                  : COLOR_WEEKDAY
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
