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

export function PhaseCompletionChart({
  data,
}: {
  data: { phase: string; percent: number }[];
}) {
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data.slice(0, 8)}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="phase"
            tickFormatter={(v: string) => v.match(/Phase (\d+)/)?.[1] ?? v}
            fontSize={10}
          />
          <YAxis domain={[0, 100]} fontSize={10} />
          <Tooltip />
          <Bar dataKey="percent" fill="#22d3ee" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
