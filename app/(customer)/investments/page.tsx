import { LineChart, Lock, Sparkles, TrendingUp } from "lucide-react";
import { requireCustomer } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/logging/logger";
import { tierPolicy } from "@/lib/auth/roles";
import { PageShell, SectionHeader } from "@/components/layout/page-shell";
import { Card, CardHeader, StatCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Empty } from "@/components/ui/empty";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function InvestmentsPage() {
  const user = await requireCustomer();
  const profile = user.customerProfile!;
  const tier = profile.tier as "basic" | "premium" | "vip";
  const policy = tierPolicy(tier);

  await writeAuditLog({
    actionType: "investments_view",
    page: "/investments",
    toolOrFeatureUsed: "investment_dashboard",
    riskLevel: tier === "vip" ? "high" : "medium",
    actionOutcome: "viewed",
    inputDataSummary: { tier, allowed: policy.canSeeInvestments },
  });

  if (!policy.canSeeInvestments) {
    return (
      <PageShell>
        <SectionHeader
          title="Investments"
          description="Investment dashboards are reserved for Premium and VIP customers."
        />
        <Empty
          icon={<Lock className="size-5" />}
          title="Investments unavailable on Basic tier"
          description="Upgrade to Premium for savings + investment overviews, or VIP for advanced private banking views."
        />
      </PageShell>
    );
  }

  const investmentAccount = await prisma.bankAccount.findFirst({
    where: { customerProfileId: profile.id, accountType: "investment" },
  });

  // Mock holdings — purely visual for the POC.
  const holdings =
    tier === "vip"
      ? [
          { name: "ELAH Reasoning Index", value: 1_140_500, change: 4.8 },
          { name: "Private Equity Fund III", value: 740_000, change: 2.1 },
          { name: "ELAH Cyber Bond 2030", value: 320_000, change: -0.6 },
          { name: "Diversified ESG VIP", value: 141_400, change: 1.3 },
        ]
      : [
          { name: "Premium Diversified ETF", value: 158_500, change: 1.9 },
          { name: "ELAH Growth Fund", value: 86_800, change: 3.4 },
        ];

  return (
    <PageShell>
      <SectionHeader
        title="Investments"
        description={
          tier === "vip"
            ? "Advanced private banking view — every read of this dashboard is logged with high sensitivity."
            : "Premium portfolio overview — sensitive data, all views are logged."
        }
        action={
          <Badge variant="warning" className="uppercase">
            High-sensitivity data
          </Badge>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          label="Portfolio value"
          value={
            investmentAccount
              ? formatCurrency(investmentAccount.currentBalance)
              : "—"
          }
          hint={investmentAccount?.accountNumberMasked ?? "No account"}
          icon={<TrendingUp className="size-4" />}
          accent="gold"
        />
        <StatCard
          label="Available cash"
          value={
            investmentAccount
              ? formatCurrency(investmentAccount.availableBalance)
              : "—"
          }
          hint="Free for new positions"
          icon={<Sparkles className="size-4" />}
          accent="cyan"
        />
        <StatCard
          label="Holdings"
          value={String(holdings.length)}
          hint="Diversification across positions"
          icon={<LineChart className="size-4" />}
          accent="emerald"
        />
      </div>

      <Card>
        <CardHeader title="Holdings" />
        <ul className="divide-y divide-line">
          {holdings.map((h) => (
            <li
              key={h.name}
              className="flex items-center justify-between py-3 text-sm"
            >
              <div>
                <div className="font-medium text-ink">{h.name}</div>
                <div className="text-xs text-ink-subtle">
                  Mock simulated position
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-ink">
                  {formatCurrency(h.value)}
                </div>
                <div
                  className={
                    h.change >= 0
                      ? "text-xs font-medium text-accent-emerald"
                      : "text-xs font-medium text-accent-rose"
                  }
                >
                  {h.change >= 0 ? "+" : ""}
                  {h.change.toFixed(1)}%
                </div>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </PageShell>
  );
}
