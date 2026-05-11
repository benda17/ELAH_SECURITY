import { Wallet, Lock } from "lucide-react";
import { requireCustomer } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/logging/logger";
import { tierPolicy } from "@/lib/auth/roles";
import { PageShell, SectionHeader } from "@/components/layout/page-shell";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AccountsPage() {
  const user = await requireCustomer();
  const profile = user.customerProfile!;
  const tier = profile.tier as "basic" | "premium" | "vip";
  const policy = tierPolicy(tier);

  const accounts = await prisma.bankAccount.findMany({
    where: { customerProfileId: profile.id },
    orderBy: { openedAt: "asc" },
  });

  await writeAuditLog({
    actionType: "accounts_view",
    page: "/accounts",
    toolOrFeatureUsed: "account_list",
    riskLevel: "low",
    actionOutcome: "viewed",
    inputDataSummary: { accountsVisible: accounts.length },
  });

  return (
    <PageShell>
      <SectionHeader
        title="Your accounts"
        description={`${accounts.length} active · daily transfer limit ${formatCurrency(policy.dailyTransferLimit)}`}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {accounts.map((acct) => {
          const isInvestment = acct.accountType === "investment";
          return (
            <Card key={acct.id}>
              <CardHeader
                title={
                  <span className="inline-flex items-center gap-2 capitalize">
                    <Wallet className="size-4 text-accent-gold" />
                    {acct.accountType} account
                  </span>
                }
                description={acct.accountNumberMasked}
                action={
                  <Badge
                    variant={
                      acct.status === "active" ? "status-approved" : "warning"
                    }
                  >
                    {acct.status}
                  </Badge>
                }
              />
              <div className="space-y-3">
                <div>
                  <div className="text-xs uppercase tracking-widest text-ink-subtle">
                    Current balance
                  </div>
                  <div className="text-2xl font-semibold text-ink">
                    {formatCurrency(acct.currentBalance, acct.currency)}
                  </div>
                </div>
                <div className="flex justify-between text-xs text-ink-muted">
                  <span>Available</span>
                  <span className="text-ink">
                    {formatCurrency(acct.availableBalance, acct.currency)}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-ink-muted">
                  <span>Daily transfer limit</span>
                  <span className="text-ink">
                    {formatCurrency(acct.dailyTransferLimit, acct.currency)}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-ink-muted">
                  <span>Opened</span>
                  <span className="text-ink">{formatDate(acct.openedAt)}</span>
                </div>
                {isInvestment ? (
                  <p className="rounded-lg border border-accent-gold/30 bg-accent-gold/5 px-3 py-2 text-[11px] text-accent-gold">
                    Investment data is highly sensitive. Each view of this card
                    is logged.
                  </p>
                ) : null}
              </div>
            </Card>
          );
        })}

        {tier === "basic" ? (
          <Card className="opacity-80">
            <CardHeader
              title={
                <span className="inline-flex items-center gap-2">
                  <Lock className="size-4 text-ink-muted" />
                  Investment account
                </span>
              }
              description="Available for Premium and VIP customers"
            />
            <p className="text-sm text-ink-muted">
              Upgrade your tier to unlock investment accounts and richer
              portfolio dashboards.
            </p>
          </Card>
        ) : null}
      </div>
    </PageShell>
  );
}
