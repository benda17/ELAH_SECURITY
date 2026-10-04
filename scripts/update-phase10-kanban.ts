/**
 * Mark evidenced Phase 10 cards done after the 28 Sep 2026 eval pack.
 * Honest: demo-ready, not production; security card is unit tests not a pentest;
 * load is in-process not HTTP; rollback is offline; usability has zero sessions.
 */
import { PrismaClient } from "@prisma/client";
import { recomputeMilestoneProgress } from "../lib/roadmap/seed";

const prisma = new PrismaClient();

const DONE_AT = new Date("2026-09-28T18:00:00.000Z");
const DOC = "docs/Phase 10 - Evaluation and MVP readiness";

type Patch = {
  id: string;
  notes: string;
  deliverables: string;
  links: string[];
};

const patches: Patch[] = [
  {
    id: "task-10-define-the-golden-evaluation-set",
    notes:
      "Done 28 Sep 2026. Banking gold v1.0 holdout n=100 is the yardstick. CS/CRM gold is a different datasetVersion. Live simulator logs are not this set.",
    deliverables: `${DOC}/ELAH_GOLDEN_SET.md (ELAH-P10-GOLD-001)`,
    links: [`${DOC}/ELAH_GOLDEN_SET.md`],
  },
  {
    id: "task-10-define-minimum-acceptable-accuracy",
    notes:
      "Done 28 Sep 2026. Proposed demo bar: do not regress below rules_v0 holdout 0.79. Not a customer SLA. CatBoost 0.90 is offline.",
    deliverables: `${DOC}/ELAH_ACCEPTANCE_METRICS.md §accuracy`,
    links: [`${DOC}/ELAH_ACCEPTANCE_METRICS.md`],
  },
  {
    id: "task-10-define-minimum-acceptable-calibration",
    notes:
      "Done 28 Sep 2026. rules_v0 stays uncalibrated. ECE 0.153 measured. Badge required. Not a production reliability claim.",
    deliverables: `${DOC}/ELAH_ACCEPTANCE_METRICS.md §calibration`,
    links: [`${DOC}/ELAH_ACCEPTANCE_METRICS.md`],
  },
  {
    id: "task-10-define-acceptable-false-positive-rates",
    notes:
      "Done 28 Sep 2026. Proposed: 0 legitimate-as-injection on v1.0 holdout (measured 0). High FR on a genuine wire is not FP.",
    deliverables: `${DOC}/ELAH_ACCEPTANCE_METRICS.md §FP`,
    links: [`${DOC}/ELAH_ACCEPTANCE_METRICS.md`],
  },
  {
    id: "task-10-define-acceptable-false-negative-rates",
    notes:
      "Done 28 Sep 2026. Proposed: FN hook ≤1 (measured 1, azb-0005). Injection recall 0.59 is not a CS/CRM refund claim.",
    deliverables: `${DOC}/ELAH_ACCEPTANCE_METRICS.md §FN`,
    links: [`${DOC}/ELAH_ACCEPTANCE_METRICS.md`],
  },
  {
    id: "task-10-define-acceptable-latency",
    notes:
      "Done 28 Sep 2026. Frozen 250 ms fail-open. Server p95 ≤200 ms. In-process p95 0.0066 ms. Ceiling not raised. HTTP p95 not measured.",
    deliverables: `${DOC}/ELAH_ACCEPTANCE_METRICS.md §latency`,
    links: [`${DOC}/ELAH_ACCEPTANCE_METRICS.md`],
  },
  {
    id: "task-10-define-acceptable-availability",
    notes:
      "Done 28 Sep 2026. Fail-open when scorer down. Demo SLO-1 99.0% is Proposed; no production % invented.",
    deliverables: `${DOC}/ELAH_ACCEPTANCE_METRICS.md §availability`,
    links: [`${DOC}/ELAH_ACCEPTANCE_METRICS.md`],
  },
  {
    id: "task-10-define-explainability-acceptance-criteria",
    notes:
      "Done 28 Sep 2026. Checklist: analyst panel fields, no CoT, Jane score-free. Understandability interviews still zero.",
    deliverables: `${DOC}/ELAH_EXPLAINABILITY_BAR.md (ELAH-P10-XAI-001)`,
    links: [`${DOC}/ELAH_EXPLAINABILITY_BAR.md`],
  },
  {
    id: "task-10-define-banking-analyst-usability-criteria",
    notes:
      "Done 28 Sep 2026 as later-vertical protocol. First human-test path is CS/CRM (Phase 7). Zero sessions. No invented quotes.",
    deliverables: `${DOC}/ELAH_ANALYST_USABILITY.md (ELAH-P10-USE-001)`,
    links: [`${DOC}/ELAH_ANALYST_USABILITY.md`],
  },
  {
    id: "task-10-run-end-to-end-tests",
    notes:
      "Done 28 Sep 2026. npm run test:phase10-eval — 9 files, 33 passed. No Playwright. Manual demo checklist in the memo.",
    deliverables: `${DOC}/ELAH_E2E_TESTS.md; tests/elah/phase10-*.test.ts`,
    links: [`${DOC}/ELAH_E2E_TESTS.md`],
  },
  {
    id: "task-10-run-load-tests",
    notes:
      "Done 28 Sep 2026 as in-process bench only. p50 0.004 ms / p95 0.0066 ms / 139581 events/sec. HTTP load NOT-RUN. Do not quote as hosted RPS.",
    deliverables: `${DOC}/ELAH_LOAD_TESTS.md; data/phase10/load-report.json`,
    links: [`${DOC}/ELAH_LOAD_TESTS.md`, "data/phase10/load-report.json"],
  },
  {
    id: "task-10-run-failure-mode-tests",
    notes:
      "Done 28 Sep 2026. Hang/503 → scoring_unavailable, no throw. Policy still allow/deny/confirm.",
    deliverables: `${DOC}/ELAH_FAILURE_MODES.md; tests/elah/client-failopen.test.ts`,
    links: [`${DOC}/ELAH_FAILURE_MODES.md`],
  },
  {
    id: "task-10-run-security-tests",
    notes:
      "Done 28 Sep 2026 as POINTER + unit tests (trust-boundary, RBAC, contract, Jane score-free). NOT a pentest. Phase 8 red team NOT executed.",
    deliverables: `${DOC}/ELAH_SECURITY_TESTS.md (ELAH-P10-SEC-001)`,
    links: [`${DOC}/ELAH_SECURITY_TESTS.md`],
  },
  {
    id: "task-10-run-data-loss-tests",
    notes:
      "Done 28 Sep 2026. envelopeForDisplay strips elahScore; ScoreResponse does not put score on the envelope; customer routes clean.",
    deliverables: `${DOC}/ELAH_FAILURE_MODES.md §data-loss; tests/elah/phase10-data-loss.test.ts`,
    links: [`${DOC}/ELAH_FAILURE_MODES.md`],
  },
  {
    id: "task-10-run-service-timeout-tests",
    notes:
      "Done 28 Sep 2026. 250 ms client timeout fixtures pass. Ceiling not raised.",
    deliverables: `${DOC}/ELAH_FAILURE_MODES.md §timeout; tests/elah/client-failopen.test.ts`,
    links: [`${DOC}/ELAH_FAILURE_MODES.md`],
  },
  {
    id: "task-10-run-model-rollback-tests",
    notes:
      "Done 28 Sep 2026 as OFFLINE only (elah-model artifacts/versions). Live POST /v1/score remains rules_v0. Live rollback not wired.",
    deliverables: `${DOC}/ELAH_MODEL_ROLLBACK.md; docs/Phase 6 - ELAH model development/ELAH_MODEL_VERSIONING.md`,
    links: [
      `${DOC}/ELAH_MODEL_ROLLBACK.md`,
      "docs/Phase 6 - ELAH model development/ELAH_MODEL_VERSIONING.md",
    ],
  },
  {
    id: "task-10-validate-monitoring-and-alerting",
    notes:
      "Done 28 Sep 2026 as honest gap: structured score logs + admin UI. No PagerDuty, no invented uptime %.",
    deliverables: `${DOC}/ELAH_MONITORING.md (ELAH-P10-MON-001)`,
    links: [`${DOC}/ELAH_MONITORING.md`],
  },
  {
    id: "task-10-validate-dashboard-correctness",
    notes:
      "Done 28 Sep 2026. Analyst snapshots vs Jane score-free. Customer-route grep in CI. Hosted pixel click-test still founder.",
    deliverables: `${DOC}/ELAH_DASHBOARD_QA.md (ELAH-P10-DASH-001)`,
    links: [`${DOC}/ELAH_DASHBOARD_QA.md`],
  },
  {
    id: "task-10-validate-score-consistency",
    notes:
      "Done 28 Sep 2026. rules_v0 deterministic on fixtures 8.1/8.3 (three repeats). scoredAt may differ on HTTP.",
    deliverables: `${DOC}/ELAH_SCORE_CONSISTENCY.md; tests/elah/phase10-score-consistency.test.ts`,
    links: [`${DOC}/ELAH_SCORE_CONSISTENCY.md`],
  },
  {
    id: "task-10-validate-threshold-separation",
    notes:
      "Done 28 Sep 2026. Display bands change labels only; elahScore 0.87 unchanged when cuts tighten.",
    deliverables: `${DOC}/ELAH_THRESHOLD_SEPARATION.md; tests/elah/phase10-threshold-separation.test.ts`,
    links: [`${DOC}/ELAH_THRESHOLD_SEPARATION.md`],
  },
  {
    id: "task-10-document-release-procedures",
    notes:
      "Done 28 Sep 2026. Banking vs CRM vs founder deploys. No prisma db push on Vercel. Do not mix Neon.",
    deliverables: `${DOC}/ELAH_RELEASE.md (ELAH-P10-REL-001)`,
    links: [`${DOC}/ELAH_RELEASE.md`],
  },
  {
    id: "task-10-document-incident-procedures",
    notes:
      "Done 28 Sep 2026. Scorer down = fail-open, not “ELAH blocked the bank.” Jane score leak is S1.",
    deliverables: `${DOC}/ELAH_INCIDENT.md (ELAH-P10-INC-001)`,
    links: [`${DOC}/ELAH_INCIDENT.md`],
  },
  {
    id: "task-10-document-known-limitations",
    notes:
      "Done 28 Sep 2026. Reuses Phase 5/6 limits. No production claim. Synthetic gold, uncalibrated, no pentest, no interviews.",
    deliverables: `${DOC}/ELAH_MVP_LIMITATIONS.md (ELAH-P10-LIM-001)`,
    links: [`${DOC}/ELAH_MVP_LIMITATIONS.md`],
  },
  {
    id: "task-10-prepare-the-mvp-demo",
    notes:
      "Done 28 Sep 2026. CS/CRM opens; banking encore. Index of existing scripts. Freeze language required.",
    deliverables: `${DOC}/ELAH_DEMO_READINESS.md; docs/Phase 13 - Fundraising and investor outreach/ELAH_DEMO_SCRIPT.md`,
    links: [
      `${DOC}/ELAH_DEMO_READINESS.md`,
      "docs/Phase 13 - Fundraising and investor outreach/ELAH_DEMO_SCRIPT.md",
    ],
  },
  {
    id: "task-10-create-repeatable-demo-scenarios",
    notes:
      "Done 28 Sep 2026 as pointer to Phase 1 scenario pack + DemoPass123! paths. No live customer.",
    deliverables: `${DOC}/ELAH_DEMO_READINESS.md §repeatable; docs/Phase 1 - Banking Simulator Stabilization/ELAH_PHASE1_SCENARIOS.md`,
    links: [
      `${DOC}/ELAH_DEMO_READINESS.md`,
      "docs/Phase 1 - Banking Simulator Stabilization/ELAH_PHASE1_SCENARIOS.md",
    ],
  },
  {
    id: "task-10-create-a-technical-demo-script",
    notes:
      "Done 28 Sep 2026 as pointer to Phase 13 technical banking script. Keep freeze language.",
    deliverables: `${DOC}/ELAH_DEMO_READINESS.md §technical; docs/Phase 13 - Fundraising and investor outreach/ELAH_DEMO_SCRIPT.md`,
    links: [
      `${DOC}/ELAH_DEMO_READINESS.md`,
      "docs/Phase 13 - Fundraising and investor outreach/ELAH_DEMO_SCRIPT.md",
    ],
  },
  {
    id: "task-10-create-a-non-technical-demo-script",
    notes:
      "Done 28 Sep 2026 as pointer to Phase 16 CS/CRM demo script (first-buyer story). Banking is encore.",
    deliverables: `${DOC}/ELAH_DEMO_READINESS.md §non-technical; elah-analytics-dashboard docs/Phase 16 - B2B SaaS CS CRM wedge/ELAH_CS_CRM_DEMO_SCRIPT.md`,
    links: [
      `${DOC}/ELAH_DEMO_READINESS.md`,
      "docs/Phase 16 - B2B SaaS CS CRM wedge/ELAH_CS_CRM_DEMO_SCRIPT.md",
    ],
  },
  {
    id: "task-10-produce-an-mvp-readiness-report",
    notes:
      "Done 28 Sep 2026. Proposed: DEMO GO / PRODUCTION NO-GO. No customers, no ARR, HTTP load not-run, Phase 8 not a pentest.",
    deliverables: `${DOC}/ELAH_MVP_READINESS.md (ELAH-P10-READY-001); ${DOC}/ELAH_PHASE10_EXECUTIVE_SUMMARY.md`,
    links: [
      `${DOC}/ELAH_MVP_READINESS.md`,
      `${DOC}/ELAH_PHASE10_EXECUTIVE_SUMMARY.md`,
      `${DOC}/README.md`,
    ],
  },
];

async function main() {
  for (const p of patches) {
    const existing = await prisma.roadmapTask.findUnique({ where: { id: p.id } });
    if (!existing) {
      console.error("missing task", p.id);
      process.exitCode = 1;
      continue;
    }
    await prisma.roadmapTask.update({
      where: { id: p.id },
      data: {
        status: "done",
        progressPercentage: 100,
        completedAt: existing.completedAt ?? DONE_AT,
        notes: p.notes,
        deliverables: p.deliverables,
        links: JSON.stringify(p.links),
      },
    });
    console.log("done", p.id);
  }

  await recomputeMilestoneProgress();
  const phase10 = await prisma.roadmapTask.findMany({
    where: { phase: { startsWith: "Phase 10" } },
    orderBy: { order: "asc" },
  });
  const byStatus: Record<string, number> = {};
  for (const t of phase10) {
    byStatus[t.status] = (byStatus[t.status] ?? 0) + 1;
  }
  console.log("phase10 counts", byStatus, "total", phase10.length);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
