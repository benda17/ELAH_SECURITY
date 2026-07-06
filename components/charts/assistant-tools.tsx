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
import { CHART_TOOLTIP_PROPS } from "./chart-primitives";

const COLORS = ["#22d3ee", "#fbbf24", "#fb7185"];

export function AssistantToolsChart({
  data,
}: {
  data: { toolName: string; count: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(220, data.length * 28)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 18, left: 8, bottom: 0 }}
      >
        <CartesianGrid horizontal={false} />
        <XAxis type="number" tickLine={false} axisLine={false} />
        <YAxis
          type="category"
          dataKey="toolName"
          tickLine={false}
          axisLine={false}
          width={130}
          tick={{ fontSize: 11 }}
        />
        <Tooltip
          cursor={{ fill: "rgba(255,255,255,0.04)" }}
          {...CHART_TOOLTIP_PROPS}
        />
        <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={14}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
