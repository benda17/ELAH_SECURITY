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

const COLORS: Record<string, string> = {
  checking: "#22d3ee",
  savings: "#34d399",
  investment: "#f6c453",
};

const fmt = (v: number) =>
  new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(v);

export function BalancesByAccountTypeChart({
  data,
}: {
  data: { accountType: string; total: number; count: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart
        data={data}
        margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="accountType"
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: string) =>
            String(v).charAt(0).toUpperCase() + String(v).slice(1)
          }
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={56}
          tickFormatter={(v) => `$${fmt(v)}`}
        />
        <Tooltip
          cursor={{ fill: "rgba(255,255,255,0.04)" }}
          {...CHART_TOOLTIP_PROPS}
          formatter={(value: number, _n, p: any) => [
            `$${value.toLocaleString()} across ${p.payload.count} accounts`,
            "Total balance",
          ]}
        />
        <Bar dataKey="total" radius={[8, 8, 0, 0]} barSize={56}>
          {data.map((d) => (
            <Cell
              key={d.accountType}
              fill={COLORS[d.accountType] ?? "#9aa7bd"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
