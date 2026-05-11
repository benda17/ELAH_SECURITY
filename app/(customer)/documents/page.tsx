import { FileText, Download, ShieldAlert } from "lucide-react";
import { requireCustomer } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/logging/logger";
import { tierPolicy } from "@/lib/auth/roles";
import { PageShell, SectionHeader } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UntrustedContent } from "@/components/ui/untrusted";
import { formatDate } from "@/lib/utils";
import { BulkButton, DownloadButton } from "./document-actions";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const user = await requireCustomer();
  const profile = user.customerProfile!;
  const tier = profile.tier as "basic" | "premium" | "vip";
  const allowed = new Set<string>(["basic"]);
  if (tier === "premium" || tier === "vip") allowed.add("premium");
  if (tier === "vip") allowed.add("vip");

  const documents = await prisma.document.findMany({
    where: { customerProfileId: profile.id },
    orderBy: { createdAt: "desc" },
  });

  const visible = documents.filter((d) =>
    allowed.has(d.availableToTier as string),
  );
  const restricted = documents.filter(
    (d) => !allowed.has(d.availableToTier as string),
  );

  await writeAuditLog({
    actionType: "document_list_view",
    page: "/documents",
    toolOrFeatureUsed: "document_list",
    riskLevel: "low",
    actionOutcome: "viewed",
    inputDataSummary: {
      visibleCount: visible.length,
      restrictedCount: restricted.length,
    },
  });

  return (
    <PageShell>
      <SectionHeader
        title="Documents"
        description="Statements, tax forms and investment reports available for your tier."
        action={<BulkButton />}
      />

      <Card>
        <ul className="divide-y divide-line">
          {visible.length === 0 ? (
            <li className="py-6 text-center text-sm text-ink-subtle">
              No documents available yet.
            </li>
          ) : null}
          {visible.map((doc) => {
            const meta = safeParse(doc.metadataSummary);
            return (
              <li key={doc.id} className="flex items-start justify-between gap-4 py-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <FileText className="size-4 text-accent-gold" />
                    <span className="font-medium text-ink">{doc.title}</span>
                    <Badge variant="default" className="uppercase">
                      {doc.documentType}
                    </Badge>
                    {doc.sensitivityLevel !== "standard" ? (
                      <Badge variant="warning">
                        {doc.sensitivityLevel}
                      </Badge>
                    ) : null}
                  </div>
                  <div className="mt-1 text-xs text-ink-subtle">
                    Created {formatDate(doc.createdAt)}
                  </div>
                  {doc.containsInjectionTest ? (
                    <UntrustedContent
                      variant="danger"
                      className="mt-3"
                      label="Document metadata flagged (simulation fixture)"
                    >
                      {meta?.note ?? JSON.stringify(meta)}
                    </UntrustedContent>
                  ) : null}
                </div>
                <DownloadButton id={doc.id} title={doc.title} />
              </li>
            );
          })}
        </ul>
      </Card>

      {restricted.length > 0 ? (
        <Card>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-ink">
            <ShieldAlert className="size-4 text-accent-amber" />
            Restricted documents
            <Badge variant="warning">
              Available in higher tier only
            </Badge>
          </div>
          <p className="text-xs text-ink-muted">
            Some documents linked to this customer are reserved for higher
            customer tiers. Attempting to access them would be blocked and
            logged.
          </p>
          <ul className="mt-3 space-y-1.5 text-xs text-ink-subtle">
            {restricted.map((d) => (
              <li key={d.id} className="flex items-center justify-between">
                <span>
                  {d.title} · <span className="uppercase">{d.documentType}</span>
                </span>
                <span className="text-ink-muted">
                  requires {d.availableToTier}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </PageShell>
  );
}

function safeParse(s: string) {
  try {
    return JSON.parse(s) as { note?: string };
  } catch {
    return null;
  }
}
