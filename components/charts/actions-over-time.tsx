"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Row = {
  date: string;
  label: string;
  low: number;
  medium: number;
  high: number;
  critical: number;
  total: number;
};

export function ActionsOverTimeChart({ data }: { data: Row[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="gLow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.55} />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gMed" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.6} />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gHigh" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fb7185" stopOpacity={0.65} />
            <stop offset="100%" stopColor="#fb7185" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} />
        <YAxis tickLine={false} axisLine={false} width={36} />
        <Tooltip
          contentStyle={{
            background: "#111a2c",
            border: "1px solid #1f2b45",
            borderRadius: 10,
            fontSize: 12,
          }}
          labelStyle={{ color: "#9aa7bd" }}
        />
        <Area
          type="monotone"
          dataKey="low"
          name="Low risk"
          stackId="1"
          stroke="#22d3ee"
          fill="url(#gLow)"
          strokeWidth={1.8}
        />
        <Area
          type="monotone"
          dataKey="medium"
          name="Medium"
          stackId="1"
          stroke="#fbbf24"
          fill="url(#gMed)"
          strokeWidth={1.8}
        />
        <Area
          type="monotone"
          dataKey="high"
          name="High"
          stackId="1"
          stroke="#fb7185"
          fill="url(#gHigh)"
          strokeWidth={1.8}
        />
        <Area
          type="monotone"
          dataKey="critical"
          name="Critical"
          stackId="1"
          stroke="#a78bfa"
          fill="#a78bfa"
          fillOpacity={0.3}
          strokeWidth={1.8}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
