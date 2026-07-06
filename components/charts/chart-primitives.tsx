"use client";

import type { ReactNode } from "react";
import type { TooltipProps } from "recharts";
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";

export const CHART_TOOLTIP_STYLE = {
  background: "#111a2c",
  border: "1px solid #1f2b45",
  borderRadius: 10,
  fontSize: 12,
  color: "#e8eef6",
};

export const CHART_TOOLTIP_LABEL_STYLE = { color: "#9aa7bd" };
export const CHART_TOOLTIP_ITEM_STYLE = { color: "#e8eef6" };
export const CHART_TOOLTIP_PROPS = {
  contentStyle: CHART_TOOLTIP_STYLE,
  labelStyle: CHART_TOOLTIP_LABEL_STYLE,
  itemStyle: CHART_TOOLTIP_ITEM_STYLE,
};

export function ChartTooltip({
  active,
  payload,
  label,
}: TooltipProps<ValueType, NameType>) {
  if (!active || !payload?.length) return null;

  return (
    <div
      className="rounded-[10px] border border-surface-border bg-surface-raised px-3 py-2 text-xs shadow-lg"
      style={CHART_TOOLTIP_STYLE}
    >
      {label != null && label !== "" && (
        <p className="mb-1.5 font-medium text-ink-muted">{String(label)}</p>
      )}
      <ul className="space-y-1">
        {payload.map((entry) => (
          <li key={String(entry.name)} className="flex items-center gap-2 text-ink">
            <span
              className="inline-block size-2 rounded-sm"
              style={{ background: entry.color ?? "#22d3ee" }}
            />
            <span className="text-ink-muted">{entry.name}:</span>
            <span className="font-medium tabular-nums">{entry.value?.toLocaleString()}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DonutWithLegend({
  chart,
  centerLabel,
  centerValue,
  legend,
}: {
  chart: ReactNode;
  centerLabel: string;
  centerValue: string | number;
  legend: ReactNode;
}) {
  return (
    <div className="grid h-[240px] grid-cols-1 items-center gap-4 sm:grid-cols-[minmax(0,1fr)_auto]">
      <div className="relative mx-auto aspect-square h-full max-h-[220px] w-full max-w-[220px]">
        {chart}
        <div className="pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-0.5 text-center leading-none">
          <div className="text-[10px] uppercase tracking-wider text-ink-muted">{centerLabel}</div>
          <div className="text-2xl font-semibold tabular-nums text-ink">
            {typeof centerValue === "number" ? centerValue.toLocaleString() : centerValue}
          </div>
        </div>
      </div>
      <div className="min-w-[140px]">{legend}</div>
    </div>
  );
}
