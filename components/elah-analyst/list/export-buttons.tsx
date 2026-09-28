import { Download } from "lucide-react";
import type { AnalystEventFilters } from "@/lib/elah/analyst/filters";
import { buildExportHref } from "./list-helpers";

const LINK_CLASS =
  "inline-flex h-8 items-center gap-2 rounded-lg border border-line-strong bg-bg-elevated px-3 text-xs font-medium text-ink hover:bg-bg-subtle focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan/60";

/** CSV / JSON export of the current filters. Render only for roles with `analyst:export`. */
export function ExportButtons({ filters }: { filters: AnalystEventFilters }) {
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Export current results">
      <a href={buildExportHref(filters, "csv")} download className={LINK_CLASS}>
        <Download aria-hidden className="size-3.5" />
        Export CSV
      </a>
      <a href={buildExportHref(filters, "json")} download className={LINK_CLASS}>
        <Download aria-hidden className="size-3.5" />
        Export JSON
      </a>
      <span className="text-xs text-ink-subtle">Same filters and row limit. Every export is audited.</span>
    </div>
  );
}
