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

const ROW_HEIGHT = 28;
const MIN_INNER = 200;

const fmt = (v: number) =>
  new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(v);

export function TopCustomersChart({
  data,
  containerHeight = 320,
}: {
  data: { name: string; tier: string; total: number; count: number }[];
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
            <XAxis
              type="number"
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `$${fmt(v)}`}
            />
            <YAxis
              type="category"
              dataKey="name"
              tickLine={false}
              axisLine={false}
              width={150}
              tick={{ fontSize: 11 }}
              interval={0}
            />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.04)" }}
              {...CHART_TOOLTIP_PROPS}
              formatter={(value: number, _name, p: any) => [
                `$${value.toLocaleString()} · ${p.payload.count} txns`,
                "Spend",
              ]}
            />
            <Bar dataKey="total" radius={[0, 6, 6, 0]} barSize={16}>
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
