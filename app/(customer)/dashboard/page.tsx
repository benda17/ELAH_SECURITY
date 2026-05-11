import Link from "next/link";
import {
  ArrowRight,
  Bell,
  Send,
  FileText,
  Landmark,
  MessagesSquare,
  ShieldAlert,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { requireCustomer } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/logging/logger";
import { tierFromRole, tierPolicy, TIER_LABEL } from "@/lib/auth/roles";
import { PageShell, SectionHeader } from "@/components/layout/page-shell";
import { Card, CardHeader, StatCard } from "@/components/ui/card";
import { Badge, TierBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CustomerDashboardPage() {
  const user = await requireCustomer();
  const profile = user.customerProfile;
  if (!profile) {
    throw new Error("Customer profile missing for user " + user.email);
  }
  const tier = profile.tier as "basic" | "premium" | "vip";
  const policy = tierPolicy(tier);

  const [accounts, transactions, pendingApprovals, pendingTickets] = await Promise.all([
    prisma.bankAccount.findMany({
      where: { customerProfileId: profile.id },
      orderBy: { openedAt: "asc" },
    }),
    prisma.transaction.findMany({
      where: { customerProfileId: profile.id },
      orderBy: { timestamp: "desc" },
      take: 6,
    }),
    prisma.approvalRequest.findMany({
      where: { customerProfileId: profile.id, status: "pending" },
    }),
    prisma.supportTicket.findMany({
      where: { customerProfileId: profile.id, status: { not: "closed" } },
    }),
  ]);

  await writeAuditLog({
    actionType: "dashboard_view",
    page: "/dashboard",
    toolOrFeatureUsed: "customer_dashboard",
    riskLevel: "low",
    actionOutcome: "viewed",
    inputDataSummary: {
      accountsVisible: accounts.length,
      pendingApprovals: pendingApprovals.length,
      pendingTickets: pendingTickets.length,
    },
  });

  const totalBalance = accounts.reduce((s, a) => s + a.currentBalance, 0);
  const checking = accounts.find((a) => a.accountType === "checking");
  const savings = accounts.find((a) => a.accountType === "savings");
  const investment = accounts.find((a) => a.accountType === "investment");

  return (
    <PageShell>
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-2xl font-semibold tracking-tight text-ink">
            Good day, {profile.fullName.split(" ")[0]}.
          </h2>
          <TierBadge tier={tier} />
          <Badge variant="default">
            Customer No. {profile.customerNumber}
          </Badge>
        </div>
        <p className="text-sm text-ink-muted">
          {TIER_LABEL[tier]} tier · daily transfer limit{" "}
          {formatCurrency(policy.dailyTransferLimit)} · loan ceiling{" "}
          {formatCurrency(policy.loanRequestLimit)}.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total balance"
          value={formatCurrency(totalBalance)}
          hint={`${accounts.length} active accounts`}
          icon={<Sparkles className="size-4" />}
          accent="gold"
        />
        <StatCard
          label="Checking available"
          value={
            checking
              ? formatCurrency(checking.availableBalance)
              : "—"
          }
          hint={checking?.accountNumberMasked ?? "No checking account"}
          icon={<Send className="size-4" />}
          accent="cyan"
        />
        <StatCard
          label="Savings"
          value={
            savings ? formatCurrency(savings.currentBalance) : "—"
          }
          hint={savings?.accountNumberMasked ?? "No savings account"}
          icon={<TrendingUp className="size-4" />}
          accent="emerald"
        />
        <StatCard
          label={investment ? "Investments" : "Investments (locked)"}
          value={
            investment
              ? formatCurrency(investment.currentBalance)
              : "Upgrade to Premium"
          }
          hint={
            investment
              ? investment.accountNumberMasked
              : "Available for Premium and VIP"
          }
          icon={<TrendingUp className="size-4" />}
          accent={investment ? "amber" : "rose"}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Recent transactions"
            description="Latest activity across your accounts."
            action={
              <Link href="/transactions">
                <Button variant="secondary" size="sm">
                  View all <ArrowRight className="size-3.5" />
                </Button>
              </Link>
            }
          />
          {transactions.length === 0 ? (
            <p className="text-sm text-ink-muted">No transactions yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {transactions.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between gap-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-ink">
                      {t.merchantOrRecipient}
                    </div>
                    <div className="text-xs text-ink-subtle">
                      {formatDate(t.timestamp)} · {t.category}
                    </div>
                  </div>
                  <div
                    className={
                      t.direction === "credit"
                        ? "text-sm font-semibold text-accent-emerald"
                        : "text-sm font-semibold text-ink"
                    }
                  >
                    {t.direction === "credit" ? "+" : "−"}
                    {formatCurrency(t.amount)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Alerts"
            description="Pending approvals, open tickets, and security notices."
            action={<Bell className="size-4 text-ink-muted" />}
          />
          <ul className="space-y-3">
            {pendingApprovals.length > 0 ? (
              <li className="rounded-lg border border-accent-amber/30 bg-accent-amber/5 p-3">
                <div className="flex items-center gap-2 text-sm font-medium text-accent-amber">
                  <ShieldAlert className="size-4" />
                  {pendingApprovals.length} pending approval
                  {pendingApprovals.length === 1 ? "" : "s"}
                </div>
                <p className="mt-1 text-xs text-ink-muted">
                  A bank manager is reviewing your high-risk request(s).
                </p>
              </li>
            ) : null}
            {pendingTickets.length > 0 ? (
              <li className="rounded-lg border border-line bg-bg-elevated/40 p-3">
                <div className="flex items-center gap-2 text-sm font-medium text-ink">
                  <MessagesSquare className="size-4 text-accent-cyan" />
                  {pendingTickets.length} open support ticket
                  {pendingTickets.length === 1 ? "" : "s"}
                </div>
                <Link
                  href="/support"
                  className="mt-1 inline-block text-xs text-accent-cyan hover:underline"
                >
                  Review tickets →
                </Link>
              </li>
            ) : null}
            {pendingApprovals.length === 0 && pendingTickets.length === 0 ? (
              <li className="rounded-lg border border-line bg-bg-elevated/40 p-3 text-sm text-ink-muted">
                No alerts. Your account is in good standing.
              </li>
            ) : null}
          </ul>
        </Card>
      </div>

      <SectionHeader title="Quick actions" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <QuickAction
          href="/transfer"
          label="Transfer"
          icon={<Send className="size-4" />}
        />
        <QuickAction
          href="/documents"
          label="Statements"
          icon={<FileText className="size-4" />}
        />
        <QuickAction
          href="/loans"
          label="Request loan"
          icon={<Landmark className="size-4" />}
        />
        <QuickAction
          href="/support"
          label="Contact support"
          icon={<MessagesSquare className="size-4" />}
        />
      </div>
    </PageShell>
  );
}

function QuickAction({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="elah-panel group flex items-center justify-between p-4 transition-colors hover:border-accent-gold/40"
    >
      <span className="inline-flex items-center gap-2 text-sm font-medium text-ink">
        <span className="rounded-md bg-bg-elevated p-1.5 text-accent-gold border border-line">
          {icon}
        </span>
        {label}
      </span>
      <ArrowRight className="size-4 text-ink-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-accent-gold" />
    </Link>
  );
}
