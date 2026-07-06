"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_TOOLTIP_PROPS } from "./chart-primitives";

const TYPE_COLORS: Record<string, string> = {
  suspicious_prompt: "#fb7185",
  policy_failed: "#fbbf24",
  unauthorized: "#a78bfa",
  agent_error: "#64748b",
};

type TimelineRow = {
  label: string;
  suspicious_prompt: number;
  policy_failed: number;
  unauthorized: number;
  agent_error: number;
  total: number;
};

export function AssistantSecurityTimelineChart({ data }: { data: TimelineRow[] }) {
  if (data.every((d) => d.total === 0)) {
    return (
      <p className="py-8 text-center text-sm text-ink-muted">
        No assistant security events recorded yet.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} />
        <YAxis tickLine={false} axisLine={false} width={32} allowDecimals={false} />
        <Tooltip {...CHART_TOOLTIP_PROPS} />
        <Area
          type="monotone"
          dataKey="suspicious_prompt"
          name="Suspicious prompt"
          stackId="1"
          stroke={TYPE_COLORS.suspicious_prompt}
          fill={TYPE_COLORS.suspicious_prompt}
          fillOpacity={0.55}
        />
        <Area
          type="monotone"
          dataKey="policy_failed"
          name="Policy blocked"
          stackId="1"
          stroke={TYPE_COLORS.policy_failed}
          fill={TYPE_COLORS.policy_failed}
          fillOpacity={0.55}
        />
        <Area
          type="monotone"
          dataKey="unauthorized"
          name="Unauthorized access"
          stackId="1"
          stroke={TYPE_COLORS.unauthorized}
          fill={TYPE_COLORS.unauthorized}
          fillOpacity={0.55}
        />
        <Area
          type="monotone"
          dataKey="agent_error"
          name="Assistant error"
          stackId="1"
          stroke={TYPE_COLORS.agent_error}
          fill={TYPE_COLORS.agent_error}
          fillOpacity={0.45}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function AssistantSecurityReasonsChart({
  data,
}: {
  data: { label: string; count: number }[];
}) {
  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-ink-muted">
        No detection labels recorded yet.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(220, data.length * 28)}>
      <BarChart
        data={data.map((d) => ({
          ...d,
          display: d.label.replace(/_/g, " "),
        }))}
        layout="vertical"
        margin={{ top: 4, right: 18, left: 8, bottom: 0 }}
      >
        <CartesianGrid horizontal={false} />
        <XAxis type="number" tickLine={false} axisLine={false} allowDecimals={false} />
        <YAxis
          type="category"
          dataKey="display"
          tickLine={false}
          axisLine={false}
          width={150}
          tick={{ fontSize: 11 }}
        />
        <Tooltip
          cursor={{ fill: "rgba(255,255,255,0.04)" }}
          {...CHART_TOOLTIP_PROPS}
        />
        <Bar dataKey="count" fill="#fb7185" radius={[0, 6, 6, 0]} barSize={14} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function AssistantSecurityRiskScoreChart({
  data,
}: {
  data: { band: string; count: number }[];
}) {
  const filtered = data.filter((d) => d.count > 0);
  const total = filtered.reduce((s, d) => s + d.count, 0);
  const COLORS: Record<string, string> = {
    low: "#22d3ee",
    medium: "#fbbf24",
    high: "#fb7185",
    critical: "#a78bfa",
  };

  if (total === 0) {
    return (
      <p className="py-8 text-center text-sm text-ink-muted">
        No risk scores recorded for security events.
      </p>
    );
  }

  return (
    <ul className="space-y-3 py-2">
      {data.map((d) => (
        <li key={d.band}>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="capitalize text-ink">{d.band} risk</span>
            <span className="tabular-nums text-ink-muted">
              {d.count.toLocaleString()}
              <span className="text-ink-dim">
                {" "}
                ({total ? ((d.count / total) * 100).toFixed(0) : 0}%)
              </span>
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-subtle">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${total ? (d.count / total) * 100 : 0}%`,
                background: COLORS[d.band] ?? "#64748b",
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
