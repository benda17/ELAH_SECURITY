"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { CHART_TOOLTIP_PROPS } from "./chart-primitives";
import {
  type IntentMatrixPoint,
  RISK_COLORS,
  spreadIntentPoints,
} from "@/lib/intent-matrix-points";

export type { IntentMatrixPoint };

export function IntentMatrixScatter({ data }: { data: IntentMatrixPoint[] }) {
  const spread = useMemo(() => spreadIntentPoints(data), [data]);
  const fillOpacity = data.length > 400 ? 0.35 : data.length > 100 ? 0.55 : 0.75;

  return (
    <ResponsiveContainer width="100%" height={560}>
      <ScatterChart margin={{ top: 16, right: 24, left: 8, bottom: 32 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1f2b45" />
        <XAxis
          type="number"
          dataKey="x"
          name="Human Agency"
          domain={[0, 1]}
          tickCount={11}
          tickLine={false}
          axisLine={{ stroke: "#334155" }}
          tick={{ fontSize: 11, fill: "#94a3b8" }}
        >
          <Label
            value="Human Agency →"
            offset={-8}
            position="insideBottom"
            style={{ fill: "#22d3ee", fontSize: 12, fontWeight: 600 }}
          />
        </XAxis>
        <YAxis
          type="number"
          dataKey="y"
          name="Financial / Data Risk"
          domain={[0, 1]}
          tickCount={11}
          tickLine={false}
          axisLine={{ stroke: "#334155" }}
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          width={48}
        >
          <Label
            value="Financial / Data Risk →"
            angle={-90}
            position="insideLeft"
            style={{ fill: "#fbbf24", fontSize: 12, fontWeight: 600, textAnchor: "middle" }}
          />
        </YAxis>
        <ZAxis type="number" dataKey="z" range={[24, 220]} name="Emotional Urgency" />
        <Tooltip
          cursor={{ strokeDasharray: "3 3" }}
          content={({ payload }) => {
            if (!payload?.length) return null;
            const p = payload[0]?.payload as IntentMatrixPoint;
            return (
              <div className="max-w-xs rounded-lg border border-surface-border bg-[#111a2c] p-3 text-xs shadow-xl">
                <p className="font-semibold text-ink">{p.intentLabel}</p>
                <p className="mt-1 text-ink-muted">{p.messageSnippet}</p>
                <p className="mt-2 font-mono text-[10px] text-ink-dim">
                  x={p.x.toFixed(3)} · y={p.y.toFixed(3)} · z={p.z.toFixed(3)}
                </p>
                <p className="text-ink-dim capitalize">
                  {p.riskLevel} risk · {p.actionStatus.replace(/_/g, " ")}
                  {p.toolName ? ` · ${p.toolName}` : ""}
                </p>
                <p className="mt-1 text-[10px] text-ink-dim">
                  {new Date(p.timestamp).toLocaleString()}
                </p>
              </div>
            );
          }}
        />
        <Scatter data={spread} fill="#22d3ee" fillOpacity={fillOpacity}>
          {spread.map((entry) => (
            <Cell
              key={entry.id}
              fill={RISK_COLORS[entry.riskLevel] ?? "#94a3b8"}
              fillOpacity={fillOpacity}
            />
          ))}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
}

type DistRow = {
  intentId: string;
  label: string;
  count: number;
  baselineWeight: number;
};

export function IntentDistributionChart({ data }: { data: DistRow[] }) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data.slice(0, 12)} margin={{ top: 8, right: 12, left: -8, bottom: 48 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="intentId"
          tickLine={false}
          axisLine={false}
          angle={-35}
          textAnchor="end"
          height={70}
          interval={0}
          tick={{ fontSize: 10 }}
        />
        <YAxis tickLine={false} axisLine={false} width={36} />
        <Tooltip {...CHART_TOOLTIP_PROPS} />
        <Bar dataKey="count" name="Actual count" fill="#22d3ee" radius={[4, 4, 0, 0]} />
        <Bar
          dataKey="baselineWeight"
          name="Baseline weight"
          fill="#f6c453"
          radius={[4, 4, 0, 0]}
          opacity={0.65}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

type HeatCell = { intentId: string; riskLevel: string; count: number };

export function IntentRiskHeatmap({ data }: { data: HeatCell[] }) {
  const intents = [...new Set(data.map((d) => d.intentId))].slice(0, 12);
  const levels = ["low", "medium", "high", "critical"];
  const lookup = new Map(data.map((d) => [`${d.intentId}:${d.riskLevel}`, d.count]));
  const max = Math.max(1, ...data.map((d) => d.count));

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] text-left text-xs">
        <thead>
          <tr className="border-b border-surface-border text-ink-muted">
            <th className="py-2 pr-3 font-medium">Intent</th>
            {levels.map((level) => (
              <th key={level} className="px-2 py-2 font-medium capitalize">
                {level}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {intents.map((intentId) => (
            <tr key={intentId} className="border-b border-surface-border/60">
              <td className="py-2 pr-3 font-mono text-[11px] text-ink">{intentId}</td>
              {levels.map((level) => {
                const count = lookup.get(`${intentId}:${level}`) ?? 0;
                const alpha = count / max;
                return (
                  <td key={level} className="px-2 py-2">
                    <span
                      className="inline-flex min-w-8 justify-center rounded px-2 py-1 font-mono tabular-nums"
                      style={{
                        background: `rgba(34, 211, 238, ${0.12 + alpha * 0.55})`,
                        color: count ? "#e2e8f0" : "#64748b",
                      }}
                    >
                      {count}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
