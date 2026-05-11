import { CreditCard } from "lucide-react";
import { requireCustomer } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/logging/logger";
import { PageShell, SectionHeader } from "@/components/layout/page-shell";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TR, TH, TD, EmptyRow } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { CardRequestForm } from "./card-request-form";

export const dynamic = "force-dynamic";

export default async function CardsPage() {
  const user = await requireCustomer();
  const profile = user.customerProfile!;

  const [accounts, cardRequests] = await Promise.all([
    prisma.bankAccount.findMany({
      where: { customerProfileId: profile.id, accountType: { not: "investment" } },
    }),
    prisma.cardRequest.findMany({
      where: { customerProfileId: profile.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  await writeAuditLog({
    actionType: "cards_view",
    page: "/cards",
    toolOrFeatureUsed: "cards_page",
    riskLevel: "low",
    actionOutcome: "viewed",
    inputDataSummary: { pendingRequests: cardRequests.length },
  });

  return (
    <PageShell>
      <SectionHeader
        title="Cards"
        description="Request a new card, a replacement, or report your card lost or stolen."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title={
              <span className="inline-flex items-center gap-2">
                <CreditCard className="size-4 text-accent-gold" />
                New card request
              </span>
            }
            description="A confirmation step is required before submission. The request is logged."
          />
          <CardRequestForm
            accounts={accounts.map((a) => ({
              id: a.id,
              label: `${a.accountType.toUpperCase()} · ${a.accountNumberMasked}`,
            }))}
            address={profile.address}
          />
        </Card>

        <Card>
          <CardHeader title="Recent requests" />
          <Table>
            <THead>
              <TR>
                <TH>Reference</TH>
                <TH>Reason</TH>
                <TH>Status</TH>
                <TH>Date</TH>
              </TR>
            </THead>
            <tbody>
              {cardRequests.length === 0 ? (
                <EmptyRow message="No card requests yet." />
              ) : (
                cardRequests.map((c) => (
                  <TR key={c.id}>
                    <TD className="font-mono text-xs text-ink">
                      card_{c.id.slice(-6)}
                    </TD>
                    <TD className="capitalize">{c.requestReason}</TD>
                    <TD>
                      <Badge
                        variant={
                          c.status === "approved"
                            ? "status-approved"
                            : c.status === "rejected"
                              ? "status-rejected"
                              : "status-pending"
                        }
                      >
                        {c.status}
                      </Badge>
                    </TD>
                    <TD className="text-ink-muted">
                      {formatDate(c.createdAt)}
                    </TD>
                  </TR>
                ))
              )}
            </tbody>
          </Table>
        </Card>
      </div>
    </PageShell>
  );
}
