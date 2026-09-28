import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { IndicatorLevel, RiskIndicator } from "./helpers";

const LEVEL_META: Record<IndicatorLevel, { text: string; variant: "warning" | "status-approved" | "info"; value: string }> = {
  attention: { text: "Needs attention", variant: "warning", value: "text-accent-amber" },
  ok: { text: "None", variant: "status-approved", value: "text-ink" },
  info: { text: "Info", variant: "info", value: "text-ink" },
};

export function RiskIndicatorsPanel({ indicators }: { indicators: RiskIndicator[] }) {
  return (
    <Card className="h-full">
      <CardHeader
        title="Risk indicators"
        description="What deserves a human look in this window. Triage signals only — bank policy decides allow, deny, or confirm."
      />
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {indicators.map((ind) => {
          const meta = LEVEL_META[ind.level];
          const body = (
            <>
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-medium text-ink-muted">{ind.label}</span>
                <Badge variant={meta.variant} className="shrink-0 text-[10px]">
                  {meta.text}
                </Badge>
              </div>
              <div className="mt-1 flex items-baseline justify-between gap-2">
                <span className={cn("text-xl font-semibold", meta.value)}>{ind.value}</span>
                {ind.href ? (
                  <ArrowUpRight className="size-3.5 text-ink-subtle group-hover:text-accent-cyan" aria-hidden />
                ) : null}
              </div>
              <p className="mt-0.5 text-[11px] text-ink-subtle">{ind.detail}</p>
            </>
          );
          const boxClass = "block h-full rounded-lg border border-line bg-bg-subtle/40 px-3 py-2";
          return (
            <li key={ind.key}>
              {ind.href ? (
                <Link
                  href={ind.href}
                  aria-label={`${ind.label}: ${ind.value}. ${meta.text}. View these events`}
                  className={cn(
                    boxClass,
                    "group transition-colors hover:border-line-strong hover:bg-bg-elevated",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan",
                  )}
                >
                  {body}
                </Link>
              ) : (
                <div className={boxClass}>{body}</div>
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
