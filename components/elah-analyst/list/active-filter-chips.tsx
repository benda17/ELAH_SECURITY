import Link from "next/link";
import { X } from "lucide-react";
import { ELAH_EVENTS_PATH, type ActiveFilterChip } from "./list-helpers";

export function ActiveFilterChips({ chips }: { chips: ActiveFilterChip[] }) {
  if (chips.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium uppercase tracking-wider text-ink-subtle">Active filters</span>
      <ul className="flex flex-wrap gap-2" aria-label="Active filters">
        {chips.map((chip) => (
          <li key={chip.key}>
            <Link
              href={chip.removeHref}
              className="group inline-flex items-center gap-1.5 rounded-full border border-accent-cyan/30 bg-accent-cyan/10 px-2.5 py-0.5 text-xs text-accent-cyan hover:border-accent-cyan/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan/60"
              aria-label={`Remove filter ${chip.label} ${chip.value}`}
            >
              <span className="text-ink-muted">{chip.label}:</span>
              <span className="max-w-[14rem] truncate font-medium">{chip.value}</span>
              <X aria-hidden className="size-3 opacity-70 group-hover:opacity-100" />
            </Link>
          </li>
        ))}
      </ul>
      {chips.length > 1 ? (
        <Link href={ELAH_EVENTS_PATH} className="text-xs text-ink-muted underline-offset-2 hover:text-ink hover:underline">
          Clear all
        </Link>
      ) : null}
    </div>
  );
}
