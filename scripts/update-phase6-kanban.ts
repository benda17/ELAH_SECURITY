/**
 * Mark evidenced Phase 6 cards done after the 30 Aug 2026 CatBoost run.
 * Does not mark integration, calibration, robustness, or simulator-log training.
 */
import { PrismaClient } from "@prisma/client";
import { recomputeMilestoneProgress } from "../lib/roadmap/seed";

const prisma = new PrismaClient();

const DONE_AT = new Date("2026-08-30T18:27:08.795Z");

const DOC = "docs/Phase 6 - ELAH model development";

type Patch = {
  id: string;
  notes: string;
  deliverables: string;
  links: string[];
  successCriteria?: string;
};

const patches: Patch[] = [
  {
    id: "task-6-establish-a-simple-baseline-model",
    notes:
      "Done 30 Aug 2026. Live baseline remains Phase 5 rules_v0 (not re-implemented). First trained head is offline CatBoost catboost_v0. Not wired to POST /v1/score.",
    deliverables: "Live rules_v0 (Phase 5). Offline catboost_v0 in elah-model.",
    links: [
      `${DOC}/ELAH_MODEL_TRAINING_RUN.md`,
      "ELAH_SECURITY---Banking-System/lib/elah/baseline/",
    ],
  },
  {
    id: "task-6-build-the-training-pipeline",
    notes:
      "Done 30 Aug 2026. python -m elah_model.train in /Users/benda/elah-model. Fit on train, early-stop on val. Holdout not used to fit.",
    deliverables: "elah-model/elah_model/train.py; artifacts/catboost_v0/model.cbm",
    links: [`elah-model/elah_model/train.py`, `${DOC}/ELAH_MODEL_TRAINING_RUN.md`],
  },
  {
    id: "task-6-build-the-evaluation-pipeline",
    notes:
      "Done 30 Aug 2026. evaluate_split + Phase 5-compatible metrics (accuracy, macro-F1, FP, FN, injection recall, per-label). Runs as part of train.py.",
    deliverables: "elah-model/elah_model/evaluate.py, metrics.py; artifacts/catboost_v0/metrics.json",
    links: [
      `elah-model/elah_model/evaluate.py`,
      `elah-model/artifacts/catboost_v0/metrics.json`,
    ],
  },
  {
    id: "task-6-implement-feature-preprocessing",
    notes:
      "Done 30 Aug 2026. Python port of Phase 5 features.ts. Strips detectedIntent for train/eval. Keep in sync with banking lib/elah/baseline/features.ts.",
    deliverables: "elah-model/elah_model/features.py, constants.py",
    links: [`elah-model/elah_model/features.py`],
  },
  {
    id: "task-6-train-on-synthetic-data",
    notes:
      "Done 30 Aug 2026. Trained on gold v1.0 train.jsonl (393), val 78. Synthetic phase4_gen_v1, seed 20260826. Did not mix unlabeled simulator logs.",
    deliverables: "catboost_v0 on data/gold/v1.0/splits/train.jsonl",
    links: [
      `elah-model/data/gold/v1.0/SOURCE.txt`,
      `${DOC}/ELAH_MODEL_DATASET_VERSIONS.md`,
    ],
  },
  {
    id: "task-6-evaluate-on-a-protected-holdout-set",
    notes:
      "Done 30 Aug 2026. Blinded holdout n=100: accuracy 0.90, macro-F1 ~0.89, FP 0, FN 0 vs rules bar 0.79 / 0 / 1. Holdout not used to fit. Not live.",
    deliverables: "artifacts/catboost_v0/metrics.json holdout block",
    links: [
      `elah-model/artifacts/catboost_v0/metrics.json`,
      `${DOC}/ELAH_MODEL_TRAINING_RUN.md`,
    ],
  },
  {
    id: "task-6-perform-error-analysis",
    notes:
      "Done 30 Aug 2026. Per-label holdout analysis. Concentrated misses: dispute_chargeback (4, recall 0), fraud_report and fee_or_overdraft_question (1 each). Not a robustness or confidence study.",
    deliverables: `${DOC}/ELAH_MODEL_ERROR_ANALYSIS.md (ELAH-MDL-ERR-001)`,
    links: [`${DOC}/ELAH_MODEL_ERROR_ANALYSIS.md`],
  },
  {
    id: "task-6-analyze-errors-by-banking-action",
    notes:
      "Done 30 Aug 2026. Grouped holdout labels into money-move / inquiry / card / case-dispute / injection families. Internal transfer recall 0.57; bill_payment 0.50. No source/toolName slice (separate card).",
    deliverables: `${DOC}/ELAH_MODEL_ERROR_ANALYSIS.md §4`,
    links: [`${DOC}/ELAH_MODEL_ERROR_ANALYSIS.md`],
  },
  {
    id: "task-6-analyze-errors-by-user-intent-category",
    notes:
      "Done 30 Aug 2026. All 22 closed intents tabulated on holdout. Zero-support: scheduled_payment, profile_update, non_banking_request.",
    deliverables: `${DOC}/ELAH_MODEL_ERROR_ANALYSIS.md §3`,
    links: [`${DOC}/ELAH_MODEL_ERROR_ANALYSIS.md`],
  },
  {
    id: "task-6-test-model-size",
    notes: "Done 30 Aug 2026. artifacts/catboost_v0/model.cbm is 4,347,408 bytes (4.15 MiB).",
    deliverables: "model.cbm 4,347,408 bytes",
    links: [`${DOC}/ELAH_MODEL_TRAINING_RUN.md`],
  },
  {
    id: "task-6-evaluate-whether-the-model-is-lightweight-enough",
    notes:
      "Done 30 Aug 2026 as a size/runtime-class eval: 4.15 MiB CPU CatBoost, no GPU. Live p50/p95 still unmeasured — not a cutover. Inference-speed card stays backlog.",
    deliverables: `${DOC}/ELAH_MODEL_TRAINING_RUN.md §5`,
    links: [`${DOC}/ELAH_MODEL_TRAINING_RUN.md`, `${DOC}/ELAH_MODEL_LIMITATIONS.md`],
  },
  {
    id: "task-6-create-model-cards",
    notes:
      "Updated 30 Aug 2026 to v1.1. Section B filled from offline catboost_v0. Live scorer still rules_v0 / modelVersion null.",
    deliverables: `${DOC}/ELAH_MODEL_CARD.md (ELAH-MDL-CARD-001) v1.1`,
    links: [`${DOC}/ELAH_MODEL_CARD.md`],
  },
  {
    id: "task-6-document-dataset-versions-used",
    notes:
      "Updated 30 Aug 2026 to v1.1. catboost_v0 bound to gold v1.0. Holdout still protected. Simulator logs not mixed in.",
    deliverables: `${DOC}/ELAH_MODEL_DATASET_VERSIONS.md (ELAH-MDL-DATA-001) v1.1`,
    links: [`${DOC}/ELAH_MODEL_DATASET_VERSIONS.md`],
  },
  {
    id: "task-6-document-known-limitations",
    notes:
      "Updated 30 Aug 2026 to v1.1. Offline model exists; not live; synthetic gold; ECE and latency unmeasured; rare intents missed.",
    deliverables: `${DOC}/ELAH_MODEL_LIMITATIONS.md (ELAH-MDL-LIMIT-001) v1.1`,
    links: [`${DOC}/ELAH_MODEL_LIMITATIONS.md`],
  },
  {
    id: "task-6-define-the-initial-model-architecture",
    notes:
      "Updated 30 Aug 2026 to v1.1. Architecture unchanged (CatBoost on Phase 5 features). Offline artifact noted; live path still rules_v0 until latency + integrate.",
    deliverables: `${DOC}/ELAH_MODEL_ARCHITECTURE.md (ELAH-MDL-ARCH-001) v1.1`,
    links: [`${DOC}/ELAH_MODEL_ARCHITECTURE.md`],
  },
  {
    id: "task-6-compare-rules-classical-machine-learning-small-l",
    notes:
      "Updated 30 Aug 2026 to v1.1. CatBoost holdout row filled (offline 0.90 / FP 0 / FN 0). Live scorer still rules_v0. SLM/hybrid latency unmeasured.",
    deliverables: `${DOC}/ELAH_MODEL_APPROACH_COMPARISON.md (ELAH-MDL-CMP-001) v1.1`,
    links: [`${DOC}/ELAH_MODEL_APPROACH_COMPARISON.md`],
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

  const experimentTitle = "CatBoost catboost_v0 vs rules_v0 on gold v1.0 holdout";
  const existingExp = await prisma.roadmapExperiment.findFirst({
    where: { title: experimentTitle },
  });
  if (!existingExp) {
    const milestone = await prisma.roadmapMilestone.findFirst({
      where: { title: { contains: "First trained ELAH model" } },
    });
    await prisma.roadmapExperiment.create({
      data: {
        title: experimentTitle,
        hypothesis:
          "CatBoost on Phase 5 features beats rules_v0 on blinded holdout v1.0 without raising legitimate-as-injection FP.",
        testMethod:
          "Fit CatBoost MultiClass on train.jsonl (393), early-stop on val (78), score holdout (100) with detectedIntent stripped.",
        dataset: "Phase 4 gold v1.0 (synthetic phase4_gen_v1, seed 20260826)",
        successMetric: "Intent accuracy, legitimate-as-injection FP, injection→P0-money FN",
        baseline: "rules_v0 holdout: accuracy 0.79, FP 0, FN 1 (azb-0005)",
        result:
          "Offline catboost_v0: accuracy 0.90, macro-F1 ~0.89, FP 0, FN 0. Size 4,347,408 bytes. ECE and live latency not measured.",
        conclusion:
          "Beats the offline holdout bar. Not a live cutover. Keep rules_v0 on POST /v1/score until latency is measured and an explicit integrate card ships.",
        followUpAction:
          "Backlog: inference speed, ECE/calibration, agent/tool error slice, integrate into ELAH service.",
        milestoneId: milestone?.id ?? null,
        status: "completed",
      },
    });
    console.log("experiment created");
  } else {
    console.log("experiment already present");
  }

  await recomputeMilestoneProgress();
  const phase6 = await prisma.roadmapTask.findMany({
    where: { phase: { startsWith: "Phase 6" } },
  });
  const byStatus: Record<string, number> = {};
  for (const t of phase6) {
    byStatus[t.status] = (byStatus[t.status] ?? 0) + 1;
  }
  console.log("phase6 counts", byStatus, "total", phase6.length);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
