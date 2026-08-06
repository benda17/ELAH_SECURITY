"use client";

import { useRouter, usePathname } from "next/navigation";
import type { TrainingDatasetFilters } from "@/lib/queries";

export function TrainingDatasetFilters({
  options,
  active,
}: {
  options: {
    intents: string[];
    labelSources: string[];
    actionOutcomes: string[];
  };
  active: TrainingDatasetFilters;
}) {
  const router = useRouter();
  const pathname = usePathname();

  function update(key: string, value: string) {
    const params = new URLSearchParams();
    const next = { ...active, [key]: value || undefined };
    if (next.finalIntent) params.set("finalIntent", next.finalIntent);
    if (next.labelSource) params.set("labelSource", next.labelSource);
    if (next.actionOutcome) params.set("actionOutcome", next.actionOutcome);
    if (next.minScore != null) params.set("minScore", String(next.minScore));
    if (next.maxScore != null) params.set("maxScore", String(next.maxScore));
    if (next.daysBack != null && next.daysBack !== 30) {
      params.set("daysBack", String(next.daysBack));
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="panel grid gap-3 md:grid-cols-2 lg:grid-cols-5">
      <FilterSelect
        label="finalIntent"
        value={active.finalIntent ?? ""}
        options={options.intents}
        onChange={(v) => update("finalIntent", v)}
      />
      <FilterSelect
        label="labelSource"
        value={active.labelSource ?? ""}
        options={options.labelSources}
        onChange={(v) => update("labelSource", v)}
      />
      <FilterSelect
        label="actionOutcome"
        value={active.actionOutcome ?? ""}
        options={options.actionOutcomes}
        onChange={(v) => update("actionOutcome", v)}
      />
      <label className="text-xs">
        <span className="mb-1 block text-ink-dim">Min score</span>
        <input
          type="number"
          min={0}
          max={1}
          step={0.05}
          defaultValue={active.minScore ?? ""}
          onBlur={(e) => update("minScore", e.target.value)}
          className="w-full rounded-lg border border-surface-border bg-surface-subtle px-2 py-1.5 text-ink"
        />
      </label>
      <label className="text-xs">
        <span className="mb-1 block text-ink-dim">Max score</span>
        <input
          type="number"
          min={0}
          max={1}
          step={0.05}
          defaultValue={active.maxScore ?? ""}
          onBlur={(e) => update("maxScore", e.target.value)}
          className="w-full rounded-lg border border-surface-border bg-surface-subtle px-2 py-1.5 text-ink"
        />
      </label>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="text-xs">
      <span className="mb-1 block text-ink-dim">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-surface-border bg-surface-subtle px-2 py-1.5 text-ink"
      >
        <option value="">All</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </label>
  );
}
