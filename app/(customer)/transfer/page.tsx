import { Send } from "lucide-react";
import { requireCustomer } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { tierPolicy } from "@/lib/auth/roles";
import { PageShell, SectionHeader } from "@/components/layout/page-shell";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { TransferForm } from "./transfer-form";

export const dynamic = "force-dynamic";

export default async function TransferPage() {
  const user = await requireCustomer();
  const profile = user.customerProfile!;
  const tier = profile.tier as "basic" | "premium" | "vip";
  const policy = tierPolicy(tier);

  const accounts = await prisma.bankAccount.findMany({
    where: { customerProfileId: profile.id, accountType: { not: "investment" } },
    orderBy: { openedAt: "asc" },
  });

  return (
    <PageShell>
      <SectionHeader
        title="Transfer funds"
        description="Move money between your accounts or to an external beneficiary. All transfers are simulated."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title={
              <span className="inline-flex items-center gap-2">
                <Send className="size-4 text-accent-gold" />
                New transfer
              </span>
            }
            description="A confirmation step is required before any transfer is submitted."
          />
          <TransferForm
            accounts={accounts.map((a) => ({
              id: a.id,
              type: a.accountType,
              masked: a.accountNumberMasked,
              available: a.availableBalance,
            }))}
            policy={policy}
            tier={tier}
          />
        </Card>

        <Card>
          <CardHeader title="Your tier policy" />
          <ul className="space-y-3 text-sm">
            <PolicyRow
              label="Per-transfer limit"
              value={formatCurrency(policy.perTransferLimit)}
            />
            <PolicyRow
              label="Approval required above"
              value={formatCurrency(policy.approvalRequiredAbove)}
            />
            <PolicyRow
              label="Daily limit"
              value={formatCurrency(policy.dailyTransferLimit)}
            />
            <li className="rounded-lg border border-line bg-bg-elevated/40 p-3 text-xs text-ink-muted">
              Transfers above the approval threshold create a pending request
              that a bank manager reviews in the manager portal. Memos
              containing instruction-like text are blocked and logged as risk
              events.
            </li>
          </ul>
        </Card>
      </div>
    </PageShell>
  );
}

function PolicyRow({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex items-center justify-between">
      <span className="text-ink-muted">{label}</span>
      <Badge variant="default">{value}</Badge>
    </li>
  );
}
