import Link from "next/link";
import { Search } from "lucide-react";
import { requireManager } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/logging/logger";
import { PageShell, SectionHeader } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { Table, THead, TR, TH, TD, EmptyRow } from "@/components/ui/table";
import { TierBadge, Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function ManagerCustomersPage({
  searchParams,
}: {
  searchParams: { q?: string; tier?: string };
}) {
  await requireManager();

  const q = (searchParams.q ?? "").trim();
  const tier = searchParams.tier;

  const customers = await prisma.customerProfile.findMany({
    where: {
      ...(q
        ? {
            OR: [
              { fullName: { contains: q } },
              { customerNumber: { contains: q } },
              { email: { contains: q } },
              { accounts: { some: { accountNumberMasked: { contains: q } } } },
            ],
          }
        : {}),
      ...(tier && tier !== "all" ? { tier } : {}),
    },
    orderBy: { createdAt: "asc" },
    include: { accounts: true },
  });

  await writeAuditLog({
    actionType: q || (tier && tier !== "all") ? "customer_search" : "customer_list_view",
    page: "/manager/customers",
    toolOrFeatureUsed: "customer_search",
    riskLevel: "low",
    actionOutcome: "viewed",
    inputDataSummary: {
      query: q || null,
      tierFilter: tier ?? "all",
      resultCount: customers.length,
    },
  });

  return (
    <PageShell>
      <SectionHeader
        title="Customers"
        description="Search by name, email, customer number, or account number. Every search is logged."
      />

      <Card>
        <form className="mb-4 flex flex-wrap items-center gap-3" method="get">
          <div className="relative flex-1 min-w-[260px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-subtle" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Search name, email, customer no, or account number"
              className="block w-full rounded-lg border border-line bg-bg-panel/60 pl-9 pr-3 py-2 text-sm text-ink placeholder:text-ink-subtle focus:border-accent-cyan focus:outline-none"
            />
          </div>
          <select
            name="tier"
            defaultValue={tier ?? "all"}
            className="rounded-lg border border-line bg-bg-panel/60 px-3 py-2 text-sm text-ink focus:outline-none"
          >
            <option value="all">All tiers</option>
            <option value="basic">Basic</option>
            <option value="premium">Premium</option>
            <option value="vip">VIP</option>
          </select>
          <button
            type="submit"
            className="rounded-lg border border-line-strong bg-bg-elevated px-3 py-2 text-sm text-ink hover:bg-bg-subtle"
          >
            Search
          </button>
        </form>

        <Table>
          <THead>
            <TR>
              <TH>Customer</TH>
              <TH>Tier</TH>
              <TH>Customer no.</TH>
              <TH>Accounts</TH>
              <TH>Risk</TH>
              <TH></TH>
            </TR>
          </THead>
          <tbody>
            {customers.length === 0 ? (
              <EmptyRow message="No customers match your filters." />
            ) : (
              customers.map((c) => (
                <TR key={c.id}>
                  <TD>
                    <div className="font-medium text-ink">{c.fullName}</div>
                    <div className="text-xs text-ink-subtle">{c.email}</div>
                  </TD>
                  <TD>
                    <TierBadge tier={c.tier} />
                  </TD>
                  <TD className="font-mono text-xs text-ink-muted">
                    {c.customerNumber}
                  </TD>
                  <TD className="text-ink-muted">{c.accounts.length}</TD>
                  <TD>
                    <Badge
                      variant={
                        c.riskRating === "high"
                          ? "risk-high"
                          : c.riskRating === "elevated"
                            ? "risk-medium"
                            : "default"
                      }
                    >
                      {c.riskRating}
                    </Badge>
                  </TD>
                  <TD>
                    <Link
                      href={`/manager/customers/${c.id}`}
                      className="text-sm text-accent-cyan hover:underline"
                    >
                      Open →
                    </Link>
                  </TD>
                </TR>
              ))
            )}
          </tbody>
        </Table>
      </Card>
    </PageShell>
  );
}
