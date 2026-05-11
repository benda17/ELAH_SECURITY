import { Landmark } from "lucide-react";
import { requireCustomer } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/logging/logger";
import { tierPolicy } from "@/lib/auth/roles";
import { PageShell, SectionHeader } from "@/components/layout/page-shell";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge, RiskBadge } from "@/components/ui/badge";
import { Table, THead, TR, TH, TD, EmptyRow } from "@/components/ui/table";
import { UntrustedContent } from "@/components/ui/untrusted";
import { formatCurrency, formatDate } from "@/lib/utils";
import { LoanRequestForm } from "./loan-request-form";

export const dynamic = "force-dynamic";

export default async function LoansPage() {
  const user = await requireCustomer();
  const profile = user.customerProfile!;
  const tier = profile.tier as "basic" | "premium" | "vip";
  const policy = tierPolicy(tier);

  const loans = await prisma.loanRequest.findMany({
    where: { customerProfileId: profile.id },
    orderBy: { createdAt: "desc" },
  });

  await writeAuditLog({
    actionType: "loans_view",
    page: "/loans",
    toolOrFeatureUsed: "loan_dashboard",
    riskLevel: "low",
    actionOutcome: "viewed",
  });

  return (
    <PageShell>
      <SectionHeader
        title="Loans"
        description={`Your ${tier} tier loan ceiling is ${formatCurrency(policy.loanRequestLimit)}. All loan requests require manager approval.`}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title={
              <span className="inline-flex items-center gap-2">
                <Landmark className="size-4 text-accent-gold" />
                Request a loan
              </span>
            }
          />
          <LoanRequestForm ceiling={policy.loanRequestLimit} />
        </Card>

        <Card>
          <CardHeader title="Your loan history" />
          {loans.length === 0 ? (
            <p className="text-sm text-ink-muted">No loan requests yet.</p>
          ) : (
            <ul className="space-y-3">
              {loans.map((l) => (
                <li key={l.id} className="rounded-lg border border-line bg-bg-elevated/40 p-3">
                  <div className="flex items-center justify-between">
                    <div className="font-mono text-xs text-ink">
                      loan_{l.id.slice(-6)}
                    </div>
                    <Badge
                      variant={
                        l.status === "approved"
                          ? "status-approved"
                          : l.status === "rejected"
                            ? "status-rejected"
                            : "status-pending"
                      }
                    >
                      {l.status}
                    </Badge>
                  </div>
                  <div className="mt-1 text-sm font-semibold text-ink">
                    {formatCurrency(l.requestedAmount)} · {l.termMonths} months
                  </div>
                  <div className="text-xs text-ink-muted">{l.purpose}</div>
                  <div className="mt-2 flex items-center gap-2 text-[11px] text-ink-subtle">
                    <RiskBadge level={l.riskLevel} />
                    <span>{formatDate(l.createdAt)}</span>
                  </div>
                  {l.containsInjectionTest && l.notes ? (
                    <UntrustedContent
                      variant="danger"
                      className="mt-3"
                      label="Notes flagged — simulated injection content"
                    >
                      {l.notes}
                    </UntrustedContent>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </PageShell>
  );
}
