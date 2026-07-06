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
import { CHART_TOOLTIP_PROPS } from "./chart-primitives";

export function AssistantEventTypesChart({
  data,
}: {
  data: { eventType: string; count: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(280, data.length * 24)}>
      <BarChart
        data={data.map((d) => ({
          ...d,
          label: d.eventType.replace(/_/g, " "),
        }))}
        layout="vertical"
        margin={{ top: 4, right: 18, left: 8, bottom: 0 }}
      >
        <CartesianGrid horizontal={false} />
        <XAxis type="number" tickLine={false} axisLine={false} />
        <YAxis
          type="category"
          dataKey="label"
          tickLine={false}
          axisLine={false}
          width={150}
          tick={{ fontSize: 11 }}
        />
        <Tooltip
          cursor={{ fill: "rgba(255,255,255,0.04)" }}
          {...CHART_TOOLTIP_PROPS}
        />
        <Bar dataKey="count" fill="#f6c453" radius={[0, 6, 6, 0]} barSize={14} />
      </BarChart>
    </ResponsiveContainer>
  );
}
