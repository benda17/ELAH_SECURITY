"use client";

import {
  Bar,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardHeader } from "@/components/ui/card";
import type { ElahDisplayThresholds } from "@/lib/elah/analyst/bands";
import type { DashboardStats } from "@/lib/elah/analyst/stats";
import { formatBucketLabel, formatScore } from "./helpers";

const COLORS = {
  cyan: "#22d3ee",
  gold: "#d4af6a",
  rose: "#fb7185",
  amber: "#fbbf24",
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

export function TimeSeriesCard({
  series,
  thresholds,
}: {
  series: DashboardStats["series"];
  thresholds: ElahDisplayThresholds;
}) {
  const data = series.buckets.map((b) => ({
    label: formatBucketLabel(b.start, series.granularity),
    count: b.count,
    scoredCount: b.scoredCount,
    meanScore: b.meanScore,
  }));
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const peak = data.reduce((best, d) => (d.count > best.count ? d : best), data[0] ?? { label: "—", count: 0 });
  const unit = series.granularity === "hour" ? "hour" : "day";
  const summary = `Events per ${unit} (UTC) with mean ELAH score. ${data.length} buckets, ${total} events, peak ${peak.count} at ${peak.label}.`;

  return (
    <Card>
      <CardHeader
        title="Event volume & mean score"
        description={`Events per ${unit} (bars, left axis) and mean ELAH score of scored events (line, right axis 0–1). Dashed lines mark display thresholds. Times in UTC.`}
      />
      {data.length === 0 ? (
        <p className="text-sm text-ink-muted">No time buckets for this window.</p>
      ) : (
        <>
          <div role="img" aria-label={summary} className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 8, right: 0, left: -16, bottom: 0 }}>
                <XAxis
                  dataKey="label"
                  tick={{ fill: COLORS.subtle, fontSize: 11 }}
                  axisLine={{ stroke: COLORS.line }}
                  tickLine={false}
                  minTickGap={24}
                />
                <YAxis
                  yAxisId="count"
                  tick={{ fill: COLORS.subtle, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <YAxis
                  yAxisId="score"
                  orientation="right"
                  domain={[0, 1]}
                  ticks={[0, 0.25, 0.5, 0.75, 1]}
                  tick={{ fill: COLORS.subtle, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={36}
                />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  labelStyle={{ color: COLORS.muted }}
                  cursor={{ fill: "rgba(255,255,255,0.04)" }}
                  formatter={(value, name) =>
                    name === "Mean score"
                      ? [typeof value === "number" ? value.toFixed(3) : "—", name]
                      : [value, name]
                  }
                />
                <Legend wrapperStyle={{ fontSize: 11, color: COLORS.muted }} iconType="circle" iconSize={8} />
                <ReferenceLine
                  yAxisId="score"
                  y={thresholds.reviewBelow}
                  stroke={COLORS.rose}
                  strokeDasharray="4 4"
                  label={{ value: `review < ${formatScore(thresholds.reviewBelow)}`, fill: COLORS.rose, fontSize: 10, position: "insideTopLeft" }}
                />
                <ReferenceLine
                  yAxisId="score"
                  y={thresholds.watchBelow}
                  stroke={COLORS.amber}
                  strokeDasharray="4 4"
                  label={{ value: `watch < ${formatScore(thresholds.watchBelow)}`, fill: COLORS.amber, fontSize: 10, position: "insideTopLeft" }}
                />
                <Bar yAxisId="count" dataKey="count" name="Events" fill={COLORS.cyan} fillOpacity={0.6} radius={[4, 4, 0, 0]} />
                <Line
                  yAxisId="score"
                  dataKey="meanScore"
                  name="Mean score"
                  stroke={COLORS.gold}
                  strokeWidth={2}
                  dot={{ r: 2 }}
                  connectNulls={false}
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <details className="mt-3 text-sm">
            <summary className="cursor-pointer text-xs text-ink-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan">
              Show data table
            </summary>
            <div className="mt-2 max-h-64 overflow-auto rounded-lg border border-line">
              <table className="w-full text-xs">
                <caption className="sr-only">{summary}</caption>
                <thead className="bg-bg-subtle/60 text-ink-subtle">
                  <tr>
                    <th scope="col" className="px-3 py-2 text-left font-medium">
                      {unit === "hour" ? "Hour (UTC)" : "Day (UTC)"}
                    </th>
                    <th scope="col" className="px-3 py-2 text-right font-medium">Events</th>
                    <th scope="col" className="px-3 py-2 text-right font-medium">Scored</th>
                    <th scope="col" className="px-3 py-2 text-right font-medium">Mean score</th>
                  </tr>
                </thead>
                <tbody>
                  {series.buckets.map((b, i) => (
                    <tr key={b.start} className="border-t border-line">
                      <td className="px-3 py-1.5 font-mono text-ink-muted">{data[i].label}</td>
                      <td className="px-3 py-1.5 text-right text-ink">{b.count}</td>
                      <td className="px-3 py-1.5 text-right text-ink">{b.scoredCount}</td>
                      <td className="px-3 py-1.5 text-right font-mono text-ink">{formatScore(b.meanScore, 3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}
    </Card>
  );
}
