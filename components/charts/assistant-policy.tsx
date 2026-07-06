"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { CHART_TOOLTIP_PROPS } from "./chart-primitives";

const COLORS: Record<string, string> = {
  allow: "#34d399",
  needs_confirmation: "#fbbf24",
  deny: "#fb7185",
};

const LABELS: Record<string, string> = {
  allow: "Allow",
  needs_confirmation: "Needs confirmation",
  deny: "Deny",
};

export function AssistantPolicyChart({
  data,
}: {
  data: { decision: string; count: number }[];
}) {
  const chartData = data
    .filter((d) => d.count > 0)
    .map((d) => ({
      ...d,
      name: LABELS[d.decision] ?? d.decision,
    }));

  if (chartData.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-ink-muted">
        No policy decisions recorded yet.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={chartData}
          dataKey="count"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={52}
          outerRadius={78}
          paddingAngle={3}
        >
          {chartData.map((d) => (
            <Cell key={d.decision} fill={COLORS[d.decision] ?? "#64748b"} />
          ))}
        </Pie>
        <Tooltip {...CHART_TOOLTIP_PROPS} />
      </PieChart>
    </ResponsiveContainer>
  );
}
