import { notFound } from "next/navigation";
import Link from "next/link";
import {
  UserCircle2,
  MessagesSquare,
  StickyNote,
  Wallet,
  Scroll,
  ShieldAlert,
} from "lucide-react";
import { requireManager } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/logging/logger";
import { PageShell, SectionHeader } from "@/components/layout/page-shell";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge, RiskBadge, TierBadge } from "@/components/ui/badge";
import { Table, THead, TR, TH, TD } from "@/components/ui/table";
import { UntrustedContent } from "@/components/ui/untrusted";
import { formatCurrency, formatDate } from "@/lib/utils";
import { AddNoteForm } from "./add-note-form";

export const dynamic = "force-dynamic";

export default async function ManagerCustomerDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const manager = await requireManager();
  const profile = await prisma.customerProfile.findUnique({
    where: { id: params.id },
    include: {
      user: true,
      accounts: true,
      managerNotes: {
        orderBy: { createdAt: "desc" },
        include: { manager: true },
      },
      loanRequests: { orderBy: { createdAt: "desc" } },
      supportTickets: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });

  if (!profile) return notFound();

  const [recentTransactions, riskEvents, auditTrail] = await Promise.all([
    prisma.transaction.findMany({
      where: { customerProfileId: profile.id },
      orderBy: { timestamp: "desc" },
      take: 8,
    }),
    prisma.riskEvent.findMany({
      where: { customerProfileId: profile.id },
      orderBy: { timestamp: "desc" },
      take: 5,
    }),
    prisma.auditLog.findMany({
      where: {
        OR: [
          { actorId: profile.userId },
          { targetResource: { contains: profile.id.slice(-6) } },
        ],
      },
      orderBy: { timestamp: "desc" },
      take: 10,
    }),
  ]);

  await writeAuditLog({
    actionType: "customer_profile_viewed",
    page: `/manager/customers/${profile.id}`,
    toolOrFeatureUsed: "customer_profile",
    targetResource: `customer_${profile.id.slice(-6)}`,
    riskLevel: "high",
    actionOutcome: "viewed",
    inputDataSummary: {
      customerTier: profile.tier,
      accountsExpanded: profile.accounts.length,
    },
  });

  return (
    <PageShell>
      <div className="flex flex-wrap items-center gap-3">
        <div className="rounded-full bg-bg-elevated p-2 text-accent-gold border border-line">
          <UserCircle2 className="size-6" />
        </div>
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-ink">
            {profile.fullName}
          </h2>
          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
            <span>{profile.email}</span>
            <span>·</span>
            <span>{profile.phone}</span>
            <TierBadge tier={profile.tier} />
            <Badge variant="default">{profile.customerNumber}</Badge>
            <Badge
              variant={
                profile.riskRating === "high"
                  ? "risk-high"
                  : profile.riskRating === "elevated"
                    ? "risk-medium"
                    : "default"
              }
            >
              risk: {profile.riskRating}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title={
              <span className="inline-flex items-center gap-2">
                <Wallet className="size-4 text-accent-gold" />
                Accounts
              </span>
            }
          />
          <Table>
            <THead>
              <TR>
                <TH>Type</TH>
                <TH>Number</TH>
                <TH className="text-right">Balance</TH>
                <TH className="text-right">Available</TH>
                <TH>Status</TH>
              </TR>
            </THead>
            <tbody>
              {profile.accounts.map((a) => (
                <TR key={a.id}>
                  <TD className="capitalize">{a.accountType}</TD>
                  <TD className="font-mono text-xs">{a.accountNumberMasked}</TD>
                  <TD className="text-right">
                    {formatCurrency(a.currentBalance, a.currency)}
                  </TD>
                  <TD className="text-right">
                    {formatCurrency(a.availableBalance, a.currency)}
                  </TD>
                  <TD>
                    <Badge
                      variant={a.status === "active" ? "status-approved" : "warning"}
                    >
                      {a.status}
                    </Badge>
                  </TD>
                </TR>
              ))}
            </tbody>
          </Table>
        </Card>

        <Card>
          <CardHeader
            title={
              <span className="inline-flex items-center gap-2">
                <StickyNote className="size-4 text-accent-gold" />
                Manager notes
              </span>
            }
            description="Treated as untrusted content for AI agents."
          />
          <AddNoteForm customerId={profile.id} />
          <ul className="mt-4 space-y-3">
            {profile.managerNotes.length === 0 ? (
              <li className="text-sm text-ink-muted">No notes yet.</li>
            ) : (
              profile.managerNotes.map((n) => (
                <li key={n.id} className="rounded-lg border border-line bg-bg-elevated/40 p-3">
                  <div className="flex items-center justify-between text-[11px] text-ink-subtle">
                    <span>{n.manager.name}</span>
                    <span>{formatDate(n.createdAt)}</span>
                  </div>
                  {n.containsPromptInjectionTest ? (
                    <UntrustedContent
                      variant="danger"
                      className="mt-2"
                      label="Note contains untrusted simulation content"
                    >
                      {n.noteBody}
                    </UntrustedContent>
                  ) : (
                    <p className="mt-1 text-sm text-ink whitespace-pre-wrap">
                      {n.noteBody}
                    </p>
                  )}
                </li>
              ))
            )}
          </ul>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title={
              <span className="inline-flex items-center gap-2">
                <Scroll className="size-4 text-accent-gold" />
                Recent transactions
              </span>
            }
          />
          <Table>
            <THead>
              <TR>
                <TH>Date</TH>
                <TH>Description</TH>
                <TH className="text-right">Amount</TH>
              </TR>
            </THead>
            <tbody>
              {recentTransactions.map((t) => (
                <TR key={t.id}>
                  <TD className="whitespace-nowrap text-ink-muted">
                    {formatDate(t.timestamp)}
                  </TD>
                  <TD>
                    <div className="font-medium text-ink">{t.merchantOrRecipient}</div>
                    <div className="text-xs text-ink-subtle">{t.description}</div>
                  </TD>
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
                </TR>
              ))}
            </tbody>
          </Table>
        </Card>

        <Card>
          <CardHeader
            title={
              <span className="inline-flex items-center gap-2">
                <ShieldAlert className="size-4 text-accent-rose" />
                Risk events
              </span>
            }
          />
          {riskEvents.length === 0 ? (
            <p className="text-sm text-ink-muted">No risk events for this customer.</p>
          ) : (
            <ul className="space-y-3">
              {riskEvents.map((r) => (
                <li
                  key={r.id}
                  className="rounded-lg border border-line bg-bg-elevated/40 p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-ink">
                      {r.eventType.replaceAll("_", " ")}
                    </span>
                    <RiskBadge level={r.severity} />
                  </div>
                  <p className="mt-1 text-xs text-ink-muted line-clamp-3">
                    {r.reasonForFlagging}
                  </p>
                  <div className="mt-1 text-[11px] text-ink-subtle">
                    {formatDate(r.timestamp)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader
          title={
            <span className="inline-flex items-center gap-2">
              <MessagesSquare className="size-4 text-accent-gold" />
              Support tickets
            </span>
          }
        />
        {profile.supportTickets.length === 0 ? (
          <p className="text-sm text-ink-muted">No support tickets.</p>
        ) : (
          <ul className="divide-y divide-line">
            {profile.supportTickets.map((t) => (
              <li key={t.id} className="py-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs">
                    ticket_{t.id.slice(-6)}
                  </span>
                  <Badge variant="default">{t.category}</Badge>
                  <Badge
                    variant={
                      t.priority === "urgent"
                        ? "risk-high"
                        : t.priority === "priority"
                          ? "risk-medium"
                          : "default"
                    }
                  >
                    {t.priority}
                  </Badge>
                </div>
                <div className="mt-1 font-medium text-ink">{t.subject}</div>
                {t.containsInjectionTest ? (
                  <UntrustedContent
                    className="mt-2"
                    variant="danger"
                    label="Support ticket flagged — simulated injection content"
                  >
                    {t.message}
                  </UntrustedContent>
                ) : (
                  <p className="mt-1 text-xs text-ink-muted whitespace-pre-wrap">
                    {t.message}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <CardHeader title="Customer audit trail" />
        <ul className="divide-y divide-line">
          {auditTrail.map((l) => (
            <li key={l.id} className="flex items-center justify-between py-2 text-sm">
              <div className="min-w-0">
                <div className="font-medium text-ink">
                  {l.actionType.replaceAll("_", " ")}
                </div>
                <div className="text-xs text-ink-subtle">
                  {l.actorName ?? l.actorType} ·{" "}
                  {l.page ?? "—"} · {formatDate(l.timestamp)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {l.createdByAgent ? (
                  <Badge variant="role-agent">agent</Badge>
                ) : null}
                <RiskBadge level={l.riskLevel} />
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </PageShell>
  );
}
