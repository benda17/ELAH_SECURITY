import Link from "next/link";
import { ArrowLeft, Tags } from "lucide-react";
import { requireSecurity } from "@/lib/auth/guards";
import { writeAuditLog } from "@/lib/logging/logger";
import { PageShell, SectionHeader } from "@/components/layout/page-shell";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { JsonViewer } from "@/components/ui/json-viewer";
import { Empty } from "@/components/ui/empty";
import { ELAH_BANKING_INTENTS } from "@/lib/elah/types";
import {
  CONTEXTUAL_RISK_TAGS,
  getRecord,
} from "@/lib/elah/dataset/label-store";
import { LabelingForm } from "./labeling-form";

export const dynamic = "force-dynamic";

export default async function ElahLabelingDetailPage({
  params,
}: {
  params: { recordId: string };
}) {
  await requireSecurity();

  const recordId = decodeURIComponent(params.recordId);
  const record = getRecord(recordId);

  if (!record) {
    await writeAuditLog({
      actionType: "elah_labeling_opened",
      page: `/admin/elah-labeling/${recordId}`,
      toolOrFeatureUsed: "elah_labeling",
      riskLevel: "low",
      actionOutcome: "viewed",
      inputDataSummary: { recordId, found: false },
    });
    return (
      <PageShell>
        <SectionHeader
          title="Label record"
          description="Gold-label a single Phase 4 record. Security admin only."
          action={
            <Link
              href="/admin/elah-labeling"
              className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-accent-cyan"
            >
              <ArrowLeft className="size-4" />
              All labeling records
            </Link>
          }
        />
        <Empty
          icon={<Tags className="size-5" />}
          title="Record not found"
          description="No sample, pack, or gold-label row matches this id."
        />
      </PageShell>
    );
  }

  await writeAuditLog({
    actionType: "elah_labeling_opened",
    page: `/admin/elah-labeling/${record.recordId}`,
    toolOrFeatureUsed: "elah_labeling",
    riskLevel: "low",
    actionOutcome: "viewed",
    inputDataSummary: {
      recordId: record.recordId,
      pack: record.pack,
      found: true,
    },
  });

  const intentDefault =
    record.goldLabel?.intentLabel ??
    (record.intentLabel &&
    (ELAH_BANKING_INTENTS as readonly string[]).includes(record.intentLabel)
      ? record.intentLabel
      : ELAH_BANKING_INTENTS[0]);

  return (
    <PageShell>
      <SectionHeader
        title="Label record"
        description="Security-admin gold label. ELAH never allows, blocks, or executes. This form is not a customer page and does not require an elahScore."
        action={
          <Link
            href="/admin/elah-labeling"
            className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-accent-cyan"
          >
            <ArrowLeft className="size-4" />
            All labeling records
          </Link>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="info">{record.pack}</Badge>
        {record.intentLabel ? (
          <Badge variant="default">{record.intentLabel}</Badge>
        ) : null}
        <span className="font-mono text-xs text-ink-subtle">{record.recordId}</span>
      </div>

      <Card>
        <CardHeader
          title="Event JSON"
          description="Synthetic or pack payload for this record. Scores are not customer-visible."
        />
        <JsonViewer label="Event" data={record.event} />
      </Card>

      <Card>
        <CardHeader
          title="Gold label"
          description="Closed intent set from ELAH_BANKING_INTENTS. Coordinates are 0–1. Review notes must not include long digit sequences."
        />
        <LabelingForm
          intents={ELAH_BANKING_INTENTS}
          tags={CONTEXTUAL_RISK_TAGS}
          defaults={{
            recordId: record.recordId,
            intentLabel: intentDefault,
            annotatorConfidence: record.goldLabel?.annotatorConfidence ?? "medium",
            contextualRiskTags: record.goldLabel?.contextualRiskTags ?? [],
            reviewNotes: record.goldLabel?.reviewNotes ?? "",
            humanAgency: record.goldLabel?.humanAgency ?? record.humanAgency ?? 0.5,
            financialRisk:
              record.goldLabel?.financialRisk ?? record.financialRisk ?? 0.5,
            emotionalUrgency:
              record.goldLabel?.emotionalUrgency ??
              record.emotionalUrgency ??
              0.5,
            goldScore: record.goldScore,
          }}
        />
      </Card>
    </PageShell>
  );
}
