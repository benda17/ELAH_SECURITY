import { MessagesSquare } from "lucide-react";
import { requireCustomer } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/logging/logger";
import { PageShell, SectionHeader } from "@/components/layout/page-shell";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UntrustedContent } from "@/components/ui/untrusted";
import { formatDate } from "@/lib/utils";
import { SupportTicketForm } from "./support-form";

export const dynamic = "force-dynamic";

export default async function SupportPage() {
  const user = await requireCustomer();
  const profile = user.customerProfile!;

  const tickets = await prisma.supportTicket.findMany({
    where: { customerProfileId: profile.id },
    orderBy: { createdAt: "desc" },
  });

  await writeAuditLog({
    actionType: "support_view",
    page: "/support",
    toolOrFeatureUsed: "support_page",
    riskLevel: "low",
    actionOutcome: "viewed",
    inputDataSummary: { ticketCount: tickets.length },
  });

  return (
    <PageShell>
      <SectionHeader
        title="Support"
        description="Open a support ticket or review the status of an existing one. Messages are treated as untrusted data."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title={
              <span className="inline-flex items-center gap-2">
                <MessagesSquare className="size-4 text-accent-gold" />
                New ticket
              </span>
            }
          />
          <SupportTicketForm />
        </Card>

        <Card>
          <CardHeader title="Your tickets" />
          {tickets.length === 0 ? (
            <p className="text-sm text-ink-muted">No tickets yet.</p>
          ) : (
            <ul className="space-y-3">
              {tickets.map((t) => (
                <li
                  key={t.id}
                  className="rounded-lg border border-line bg-bg-elevated/40 p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-ink">
                      ticket_{t.id.slice(-6)}
                    </span>
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
                  <div className="mt-1 text-sm font-medium text-ink">
                    {t.subject}
                  </div>
                  <div className="text-xs text-ink-subtle">
                    {t.category} · {formatDate(t.createdAt)}
                  </div>
                  {t.containsInjectionTest ? (
                    <UntrustedContent
                      variant="danger"
                      className="mt-2"
                      label="Ticket flagged — simulated untrusted content"
                    >
                      {t.message}
                    </UntrustedContent>
                  ) : (
                    <p className="mt-2 text-xs text-ink-muted whitespace-pre-wrap">
                      {t.message}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </PageShell>
  );
}
