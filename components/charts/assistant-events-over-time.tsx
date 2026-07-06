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
import { CHART_TOOLTIP_PROPS } from "./chart-primitives";

type Row = {
  label: string;
  tools: number;
  security: number;
  other: number;
  total: number;
};

export function AssistantEventsOverTimeChart({ data }: { data: Row[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="gTools" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f6c453" stopOpacity={0.55} />
            <stop offset="100%" stopColor="#f6c453" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gSec" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fb7185" stopOpacity={0.65} />
            <stop offset="100%" stopColor="#fb7185" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gOther" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.45} />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} />
        <YAxis tickLine={false} axisLine={false} width={36} />
        <Tooltip {...CHART_TOOLTIP_PROPS} />
        <Area
          type="monotone"
          dataKey="tools"
          name="Tool activity"
          stackId="1"
          stroke="#f6c453"
          fill="url(#gTools)"
          strokeWidth={1.8}
        />
        <Area
          type="monotone"
          dataKey="security"
          name="Security signals"
          stackId="1"
          stroke="#fb7185"
          fill="url(#gSec)"
          strokeWidth={1.8}
        />
        <Area
          type="monotone"
          dataKey="other"
          name="Other events"
          stackId="1"
          stroke="#22d3ee"
          fill="url(#gOther)"
          strokeWidth={1.8}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
