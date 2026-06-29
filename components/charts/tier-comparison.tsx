import { cn } from "@/lib/utils";

const TIER_COLORS: Record<string, string> = {
  basic: "border-accent-cyan/40 bg-accent-cyan/10 text-accent-cyan",
  premium: "border-accent-violet/40 bg-accent-violet/10 text-accent-violet",
  vip: "border-accent-gold/40 bg-accent-gold/10 text-accent-gold",
};

const fmtCurrency = (v: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 0,
  }).format(v);

export function TierComparison({
  data,
}: {
  data: {
    tier: string;
    customers: number;
    avgBalance: number;
    avgTxCount: number;
    avgActions: number;
  }[];
}) {
  // Find max per column for sparkline-style bars
  const max = {
    customers: Math.max(...data.map((d) => d.customers), 1),
    avgBalance: Math.max(...data.map((d) => d.avgBalance), 1),
    avgTxCount: Math.max(...data.map((d) => d.avgTxCount), 1),
    avgActions: Math.max(...data.map((d) => d.avgActions), 1),
  };

  const headers = [
    { key: "customers", label: "Customers", fmt: (v: number) => v.toFixed(0) },
    { key: "avgBalance", label: "Avg balance", fmt: fmtCurrency },
    { key: "avgTxCount", label: "Avg txns", fmt: (v: number) => v.toFixed(0) },
    { key: "avgActions", label: "Avg actions", fmt: (v: number) => v.toFixed(0) },
  ] as const;

  const tierColor: Record<string, string> = {
    basic: "#22d3ee",
    premium: "#a78bfa",
    vip: "#f6c453",
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[480px] text-sm">
        <thead>
          <tr className="text-[10px] uppercase tracking-wider text-ink-muted">
            <th className="pb-2 text-left font-medium">Tier</th>
            {headers.map((h) => (
              <th key={h.key} className="pb-2 pl-3 text-right font-medium">
                {h.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.tier} className="border-t border-surface-border/60">
              <td className="py-3">
                <span
                  className={cn(
                    "pill capitalize",
                    TIER_COLORS[row.tier] ?? "border-ink-muted/30 bg-ink-muted/10 text-ink-muted",
                  )}
                >
                  {row.tier}
                </span>
              </td>
              {headers.map((h) => {
                const v = (row as any)[h.key] as number;
                const pct = Math.max(2, (v / max[h.key as keyof typeof max]) * 100);
                return (
                  <td key={h.key} className="py-3 pl-3 text-right">
                    <div className="flex flex-col items-end gap-1">
                      <span className="tabular-nums text-ink">
                        {h.fmt(v)}
                      </span>
                      <span className="block h-1 w-20 overflow-hidden rounded-full bg-surface-border">
                        <span
                          className="block h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            background: tierColor[row.tier] ?? "#9aa7bd",
                          }}
                        />
                      </span>
                    </div>
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
