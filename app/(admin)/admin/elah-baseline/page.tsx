import { Gauge } from "lucide-react";
import { requireSecurity } from "@/lib/auth/guards";
import { writeAuditLog } from "@/lib/logging/logger";
import { PageShell, SectionHeader } from "@/components/layout/page-shell";
import { Card, CardHeader, StatCard } from "@/components/ui/card";
import { Table, THead, TR, TH, TD, EmptyRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Empty } from "@/components/ui/empty";
import { formatDate } from "@/lib/utils";
import {
  EVAL_REPORT_RELATIVE,
  loadEvalReport,
  type ElahEvalPerLabel,
  type ElahEvalReport,
} from "@/lib/elah/baseline/report-read";

export const dynamic = "force-dynamic";

const GENERATE_COMMAND =
  "npx tsx --require ./scripts/lib/preload-server-only.cjs scripts/evaluate-phase5-baseline.ts";

export default async function ElahBaselinePage() {
  await requireSecurity();

  const report = loadEvalReport();

  await writeAuditLog({
    actionType: "elah_baseline_viewed",
    page: "/admin/elah-baseline",
    toolOrFeatureUsed: "elah_baseline",
    riskLevel: "low",
    actionOutcome: "viewed",
    inputDataSummary: {
      reportPresent: report != null,
      datasetVersion: report?.datasetVersion ?? null,
      scorer: report?.scorer ?? null,
      n: report?.n ?? null,
    },
  });

  return (
    <PageShell>
      <SectionHeader
        title="ELAH baseline"
        description="ELAH never allows, blocks, or executes. This report scores labels on synthetic holdout v1.0. Gold detectedIntent is stripped so the number is feature+rules recovery, not hint echo."
      />

      {report ? (
        <BaselineReportView report={report} />
      ) : (
        <Empty
          icon={<Gauge className="size-5" />}
          title="No baseline evaluation report"
          description={`The file ${EVAL_REPORT_RELATIVE} is missing. Run ${GENERATE_COMMAND} to generate it. This page does not invent zeros.`}
        />
      )}
    </PageShell>
  );
}

function BaselineReportView({ report }: { report: ElahEvalReport }) {
  const scorer = report.scorer ?? "rules_v0";
  const uncalibrated =
    report.calibration.uncalibrated ||
    !report.scorer ||
    report.scorer === "rules_v0" ||
    report.scorer === "intent_matrix";

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="info">{report.datasetVersion ?? "—"}</Badge>
        <Badge variant="default">{scorer}</Badge>
        {report.split ? <Badge variant="default">{report.split}</Badge> : null}
        {uncalibrated ? (
          <Badge variant="warning">Uncalibrated (rules_v0)</Badge>
        ) : null}
        {report.blindedDetectedIntent === true ? (
          <Badge variant="info">Blinded detectedIntent</Badge>
        ) : null}
        <span className="text-xs text-ink-subtle">
          {report.generatedAt ? formatDate(report.generatedAt) : "generatedAt —"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        <StatCard
          label="n"
          value={formatCount(report.n)}
          hint="Holdout rows scored"
          accent="cyan"
        />
        <StatCard
          label="Intent accuracy"
          value={formatRatio(report.intentAccuracy)}
          hint="pred vs gold intentLabel"
          accent="emerald"
        />
        <StatCard
          label="Macro F1"
          value={formatRatio(report.macroF1)}
          hint="Unweighted mean of per-label F1"
          accent="gold"
        />
        <StatCard
          label="False positives"
          value={formatCount(report.falsePositives.count)}
          hint={`Rate ${formatRatio(report.falsePositives.rate)}`}
          accent="rose"
        />
        <StatCard
          label="False negatives"
          value={formatCount(report.falseNegatives.count)}
          hint={`Rate ${formatRatio(report.falseNegatives.rate)}`}
          accent="amber"
        />
        <StatCard
          label="ECE"
          value={formatRatio(report.calibration.ece)}
          hint={
            uncalibrated
              ? "Uncalibrated (rules_v0). Do not treat ECE as a reliability probability."
              : "Expected calibration error"
          }
          accent="amber"
        />
        <StatCard
          label="Latency p50"
          value={formatMs(report.latencyMs.p50)}
          hint={latencyHint(report)}
          accent="cyan"
        />
        <StatCard
          label="Latency p95"
          value={formatMs(report.latencyMs.p95)}
          hint={
            report.latencyMs.p99 != null
              ? `p99 ${formatMs(report.latencyMs.p99)}`
              : "In-process scoreElahEvent"
          }
          accent="cyan"
        />
      </div>

      <Card>
        <CardHeader
          title="Run metadata"
          description="Versioned holdout evaluation. Intention readings only — bank policy remains the authority."
        />
        <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
          <KV k="datasetVersion" v={report.datasetVersion ?? "—"} />
          <KV k="scorer" v={scorer} />
          <KV k="n" v={formatCount(report.n)} />
          <KV
            k="generatedAt"
            v={report.generatedAt ? formatDate(report.generatedAt) : "—"}
          />
          {report.schemaVersion ? (
            <KV k="schemaVersion" v={report.schemaVersion} />
          ) : null}
          {report.split ? <KV k="split" v={report.split} /> : null}
          {report.latencyMs.environment ? (
            <KV k="environment" v={report.latencyMs.environment} />
          ) : null}
          {report.latencyMs.iterations != null ? (
            <KV k="latency iterations" v={formatCount(report.latencyMs.iterations)} />
          ) : null}
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Per-label precision / recall / F1"
          description="Support is gold count. Labels with 0 support are n/a, not zero."
        />
        <Table>
          <THead>
            <TR>
              <TH>Intent</TH>
              <TH>Support</TH>
              <TH>P</TH>
              <TH>R</TH>
              <TH>F1</TH>
            </TR>
          </THead>
          <tbody>
            {report.perLabel.length === 0 ? (
              <EmptyRow message="Per-label rows are not in this report yet." />
            ) : (
              report.perLabel.map((row) => (
                <TR key={row.intent}>
                  <TD className="font-mono text-xs">{row.intent}</TD>
                  <TD className="text-ink-muted">{formatCount(row.support)}</TD>
                  <TD className="text-ink-muted">{formatPrf(row)}</TD>
                  <TD className="text-ink-muted">
                    {formatPrf(row, "recall")}
                  </TD>
                  <TD className="text-ink-muted">{formatPrf(row, "f1")}</TD>
                </TR>
              ))
            )}
          </tbody>
        </Table>
        {report.zeroSupportLabels.length > 0 ? (
          <p className="mt-3 text-xs text-ink-subtle">
            Zero-support labels: {report.zeroSupportLabels.join(", ")}
          </p>
        ) : null}
      </Card>

      <Card>
        <CardHeader
          title="False positive scenarioIds"
          description="Legitimate / genuine gold predicted as prompt_injection_or_policy_bypass. High financialRisk on a genuine wire is not an FP."
        />
        <ScenarioIdList
          ids={report.falsePositives.scenarioIds}
          empty="No false-positive scenarioIds in this report."
        />
      </Card>

      <Card>
        <CardHeader
          title="False negative scenarioIds"
          description="Gold prompt_injection_or_policy_bypass predicted as a P0 money-movement intent."
        />
        <ScenarioIdList
          ids={report.falseNegatives.scenarioIds}
          empty="No false-negative scenarioIds in this report."
        />
      </Card>

      {report.skipped.length > 0 ? (
        <Card>
          <CardHeader
            title="Skipped rows"
            description="Holdout rows that could not be scored. Not counted as zeros."
          />
          <div className="flex flex-wrap gap-1.5">
            {report.skipped.map((row, index) => (
              <Badge
                key={`${row.scenarioId ?? "skip"}-${index}`}
                variant="warning"
              >
                {row.scenarioId ?? "unknown"}
                {row.reason ? ` · ${row.reason}` : ""}
              </Badge>
            ))}
          </div>
        </Card>
      ) : null}
    </>
  );
}

function ScenarioIdList({
  ids,
  empty,
}: {
  ids: string[];
  empty: string;
}) {
  if (ids.length === 0) {
    return <p className="text-sm text-ink-muted">{empty}</p>;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {ids.map((id) => (
        <Badge key={id} variant="default">
          {id}
        </Badge>
      ))}
    </div>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-ink-subtle">
        {k}
      </div>
      <div className="truncate font-mono text-ink">{v}</div>
    </div>
  );
}

function formatCount(value: number | null): string {
  if (value == null) return "—";
  return String(value);
}

function formatRatio(value: number | null): string {
  if (value == null) return "—";
  return value.toFixed(3);
}

function formatMs(value: number | null): string {
  if (value == null) return "—";
  const digits = value >= 10 ? 1 : 2;
  return `${value.toFixed(digits)} ms`;
}

function formatPrf(
  row: ElahEvalPerLabel,
  field: "precision" | "recall" | "f1" = "precision",
): string {
  if (row.support === 0) return "n/a";
  const value = row[field];
  if (value == null) return "—";
  return value.toFixed(3);
}

function latencyHint(report: ElahEvalReport): string {
  const env = report.latencyMs.environment;
  if (env) return env;
  return "In-process scoreElahEvent";
}
