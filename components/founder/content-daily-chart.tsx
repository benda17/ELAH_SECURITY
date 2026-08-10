"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_TOOLTIP_PROPS } from "@/components/charts/chart-primitives";

export type DailyPostPoint = {
  date: string;
  label: string;
  created: number;
  published: number;
  facebook: number;
};

export function ContentDailyChart({ data }: { data: DailyPostPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.06)" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
          minTickGap={24}
          tick={{ fontSize: 11, fill: "#9aa7bd" }}
        />
        <YAxis
          allowDecimals={false}
          tickLine={false}
          axisLine={false}
          width={36}
          tick={{ fontSize: 11, fill: "#9aa7bd" }}
        />
        <Tooltip
          cursor={{ stroke: "rgba(255,255,255,0.12)" }}
          {...CHART_TOOLTIP_PROPS}
          labelFormatter={(_, payload) => {
            const row = payload?.[0]?.payload as DailyPostPoint | undefined;
            return row?.date ?? "";
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, color: "#9aa7bd" }}
          iconType="circle"
          iconSize={8}
        />
        <Line
          type="monotone"
          dataKey="created"
          name="Created"
          stroke="#22d3ee"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="published"
          name="Published"
          stroke="#34d399"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="facebook"
          name="Facebook"
          stroke="#60a5fa"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
