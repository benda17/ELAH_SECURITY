import { Search } from "lucide-react";
import { requireCustomer } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/logging/logger";
import { detectInjectionLike } from "@/lib/risk/heuristics";
import { PageShell, SectionHeader } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { Table, THead, TR, TH, TD, EmptyRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UntrustedContent } from "@/components/ui/untrusted";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: { q?: string; direction?: string; just_submitted?: string };
}) {
  const user = await requireCustomer();
  const profile = user.customerProfile!;

  const q = (searchParams.q ?? "").trim();
  const direction = searchParams.direction;

  const transactions = await prisma.transaction.findMany({
    where: {
      customerProfileId: profile.id,
      ...(q
        ? {
            OR: [
              { description: { contains: q } },
              { merchantOrRecipient: { contains: q } },
              { reference: { contains: q } },
            ],
          }
        : {}),
      ...(direction && direction !== "all" ? { direction } : {}),
    },
    orderBy: { timestamp: "desc" },
    take: 100,
  });

  await writeAuditLog({
    actionType: q || direction ? "transactions_search" : "transactions_view",
    page: "/transactions",
    toolOrFeatureUsed: "transaction_table",
    riskLevel: "low",
    actionOutcome: "viewed",
    inputDataSummary: {
      filters: { query: q || null, direction: direction ?? "all" },
      resultCount: transactions.length,
    },
  });

  return (
    <PageShell>
      <SectionHeader
        title="Transactions"
        description="All activity across your accounts. Search and filters are logged."
      />

      {searchParams.just_submitted ? (
        <div className="rounded-lg border border-accent-emerald/40 bg-accent-emerald/10 p-3 text-sm text-accent-emerald">
          Transfer <span className="font-mono">{searchParams.just_submitted}</span>{" "}
          posted successfully.
        </div>
      ) : null}

      <Card>
        <form className="mb-4 flex flex-wrap items-center gap-3" method="get">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-subtle" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Search merchant, description or reference"
              className="block w-full rounded-lg border border-line bg-bg-panel/60 pl-9 pr-3 py-2 text-sm text-ink placeholder:text-ink-subtle focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan/40 focus:outline-none"
            />
          </div>
          <select
            name="direction"
            defaultValue={direction ?? "all"}
            className="rounded-lg border border-line bg-bg-panel/60 px-3 py-2 text-sm text-ink focus:border-accent-cyan focus:outline-none"
          >
            <option value="all">All</option>
            <option value="credit">Incoming</option>
            <option value="debit">Outgoing</option>
          </select>
          <button
            type="submit"
            className="rounded-lg border border-line-strong bg-bg-elevated px-3 py-2 text-sm text-ink hover:bg-bg-subtle"
          >
            Apply
          </button>
        </form>

        <Table>
          <THead>
            <TR>
              <TH>Date</TH>
              <TH>Description</TH>
              <TH>Category</TH>
              <TH className="text-right">Amount</TH>
              <TH className="text-right">Status</TH>
            </TR>
          </THead>
          <tbody>
            {transactions.length === 0 ? (
              <EmptyRow message="No transactions match your filters." />
            ) : (
              transactions.map((t) => {
                const injection = detectInjectionLike(t.description);
                return (
                  <TR key={t.id}>
                    <TD className="whitespace-nowrap text-ink-muted">
                      {formatDate(t.timestamp)}
                    </TD>
                    <TD>
                      <div className="font-medium text-ink">
                        {t.merchantOrRecipient}
                      </div>
                      {injection.matched ? (
                        <UntrustedContent
                          variant="danger"
                          className="mt-2"
                          label="Transaction description flagged"
                        >
                          {t.description}
                        </UntrustedContent>
                      ) : (
                        <div className="text-xs text-ink-subtle">
                          {t.description}
                        </div>
                      )}
                    </TD>
                    <TD className="capitalize text-ink-muted">{t.category}</TD>
                    <TD
                      className={
                        t.direction === "credit"
                          ? "text-right font-semibold text-accent-emerald"
                          : "text-right text-ink"
                      }
                    >
                      {t.direction === "credit" ? "+" : "−"}
                      {formatCurrency(t.amount)}
                    </TD>
                    <TD className="text-right">
                      <Badge
                        variant={
                          t.status === "posted"
                            ? "status-approved"
                            : t.status === "pending"
                              ? "status-pending"
                              : "status-rejected"
                        }
                      >
                        {t.status}
                      </Badge>
                    </TD>
                  </TR>
                );
              })
            )}
          </tbody>
        </Table>
      </Card>
    </PageShell>
  );
}
