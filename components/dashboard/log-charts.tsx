"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AnalyticsSnapshot } from "@/lib/logging/analytics";

const COLORS = {
  low: "#34d399",
  medium: "#fbbf24",
  high: "#fb7185",
  critical: "#f43f5e",
  cyan: "#22d3ee",
  gold: "#d4af6a",
  rose: "#fb7185",
  amber: "#fbbf24",
  emerald: "#34d399",
  ink: "#e7ecf7",
  muted: "#94a0c2",
  subtle: "#6b7799",
  line: "#1f2a52",
  panel: "rgba(15,23,51,0.95)",
};

const TOOLTIP_STYLE = {
  background: COLORS.panel,
  border: `1px solid ${COLORS.line}`,
  borderRadius: 8,
  color: COLORS.ink,
  fontSize: 12,
};

export function ActivityTimelineChart({
  data,
}: {
  data: AnalyticsSnapshot["timeline"];
}) {
  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
        >
          <defs>
            {(["low", "medium", "high", "critical"] as const).map((k) => (
              <linearGradient
                key={k}
                id={`grad-${k}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={COLORS[k]} stopOpacity={0.5} />
                <stop offset="100%" stopColor={COLORS[k]} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <XAxis
            dataKey="label"
            tick={{ fill: COLORS.subtle, fontSize: 11 }}
            axisLine={{ stroke: COLORS.line }}
            tickLine={false}
            minTickGap={24}
          />
          <YAxis
            tick={{ fill: COLORS.subtle, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            labelStyle={{ color: COLORS.muted }}
            cursor={{ stroke: COLORS.line, strokeDasharray: 3 }}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, color: COLORS.muted }}
            iconType="circle"
            iconSize={8}
          />
          <Area
            type="monotone"
            stackId="1"
            dataKey="low"
            name="Low"
            stroke={COLORS.low}
            fill="url(#grad-low)"
            strokeWidth={1.5}
          />
          <Area
            type="monotone"
            stackId="1"
            dataKey="medium"
            name="Medium"
            stroke={COLORS.medium}
            fill="url(#grad-medium)"
            strokeWidth={1.5}
          />
          <Area
            type="monotone"
            stackId="1"
            dataKey="high"
            name="High"
            stroke={COLORS.high}
            fill="url(#grad-high)"
            strokeWidth={1.5}
          />
          <Area
            type="monotone"
            stackId="1"
            dataKey="critical"
            name="Critical"
            stroke={COLORS.critical}
            fill="url(#grad-critical)"
            strokeWidth={1.5}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RiskDonutChart({
  data,
}: {
  data: AnalyticsSnapshot["riskDistribution"];
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="relative h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={2}
            stroke="none"
          >
            {data.map((e) => (
              <Cell
                key={e.name}
                fill={COLORS[e.name as keyof typeof COLORS] ?? COLORS.cyan}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            labelStyle={{ color: COLORS.muted }}
          />
          <Legend
            verticalAlign="bottom"
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 11, color: COLORS.muted, paddingTop: 8 }}
            formatter={(v: string) =>
              v.charAt(0).toUpperCase() + v.slice(1)
            }
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pb-8">
        <div className="text-[10px] uppercase tracking-widest text-ink-subtle">
          Total logs
        </div>
        <div className="text-xl font-semibold text-ink">{total}</div>
      </div>
    </div>
  );
}

export function HumanVsAgentChart({
  data,
}: {
  data: AnalyticsSnapshot["humanVsAgent"];
}) {
  const colors = [COLORS.cyan, COLORS.amber];
  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={40}
            outerRadius={70}
            paddingAngle={2}
            stroke="none"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={colors[i % colors.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            labelStyle={{ color: COLORS.muted }}
          />
          <Legend
            verticalAlign="bottom"
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 11, color: COLORS.muted, paddingTop: 8 }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ActorBreakdownChart({
  data,
}: {
  data: AnalyticsSnapshot["actorBreakdown"];
}) {
  const palette: Record<string, string> = {
    customer: COLORS.cyan,
    manager: COLORS.emerald,
    admin: COLORS.rose,
    ai_agent: COLORS.amber,
    anonymous: COLORS.subtle,
  };
  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
        >
          <XAxis
            type="number"
            tick={{ fill: COLORS.subtle, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <YAxis
            type="category"
            dataKey="actorType"
            tick={{ fill: COLORS.muted, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={88}
            tickFormatter={(v: string) => v.replaceAll("_", " ")}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
          />
          <Bar dataKey="count" radius={[0, 6, 6, 0]}>
            {data.map((d) => (
              <Cell
                key={d.actorType}
                fill={palette[d.actorType] ?? COLORS.cyan}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TopActionsChart({
  data,
}: {
  data: AnalyticsSnapshot["topActions"];
}) {
  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
        >
          <XAxis
            type="number"
            tick={{ fill: COLORS.subtle, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <YAxis
            type="category"
            dataKey="actionType"
            tick={{ fill: COLORS.muted, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={160}
            tickFormatter={(v: string) => v.replaceAll("_", " ")}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
          />
          <Bar dataKey="count" fill={COLORS.gold} radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RiskPatternChart({
  data,
}: {
  data: AnalyticsSnapshot["riskByPattern"];
}) {
  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
        >
          <XAxis
            type="number"
            tick={{ fill: COLORS.subtle, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <YAxis
            type="category"
            dataKey="pattern"
            tick={{ fill: COLORS.muted, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={180}
            tickFormatter={(v: string) => v.replaceAll("_", " ")}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
          />
          <Bar dataKey="count" fill={COLORS.rose} radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
