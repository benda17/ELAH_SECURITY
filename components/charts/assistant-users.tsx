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

const TIER_COLORS: Record<string, string> = {
  basic: "#22d3ee",
  premium: "#a78bfa",
  vip: "#f6c453",
};

const ROW_HEIGHT = 26;
const MIN_INNER = 200;

export function AssistantUsersChart({
  data,
  containerHeight = 320,
}: {
  data: { name: string; tier: string; count: number }[];
  containerHeight?: number;
}) {
  const innerHeight = Math.max(MIN_INNER, data.length * ROW_HEIGHT + 16);

  return (
    <div
      className="elah-scrollable-chart overflow-y-auto pr-1"
      style={{ maxHeight: containerHeight }}
    >
      <div style={{ height: innerHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 2, right: 18, left: 4, bottom: 4 }}
          >
            <CartesianGrid horizontal={false} />
            <XAxis type="number" tickLine={false} axisLine={false} />
            <YAxis
              type="category"
              dataKey="name"
              tickLine={false}
              axisLine={false}
              width={120}
              tick={{ fontSize: 11 }}
              interval={0}
            />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.04)" }}
              {...CHART_TOOLTIP_PROPS}
              formatter={(value, _name, item) => [
                `${value} events · ${(item.payload as { tier: string }).tier} tier`,
                "Activity",
              ]}
            />
            <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={14}>
              {data.map((d) => (
                <Cell key={d.name} fill={TIER_COLORS[d.tier] ?? "#9aa7bd"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
