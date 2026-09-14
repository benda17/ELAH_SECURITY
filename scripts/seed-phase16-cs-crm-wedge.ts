/**
 * Idempotent create/update of Phase 16 CS/CRM wedge Kanban cards.
 * Also prefixes Phase 11–12 with the GTM pivot banner (later banking vertical).
 * Does not prisma db push. Does not git push. Does not send mail.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { PrismaClient } from "@prisma/client";
import {
  PHASE16_MILESTONE,
  PHASE16_NAME,
  PHASE16_TASKS,
  PHASE_11_12_PIVOT_BANNER,
  phase16TaskId,
} from "../lib/roadmap/seed/phase16";

function loadDotEnv(file: string) {
  try {
    const raw = readFileSync(file, "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq < 1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    /* optional */
  }
}

loadDotEnv(resolve(__dirname, "../.env"));
loadDotEnv(resolve(__dirname, "../.env.local"));

async function annotatePhase11And12(prisma: PrismaClient) {
  const rows = await prisma.roadmapTask.findMany({
    where: {
      OR: [
        { phase: { startsWith: "Phase 11" } },
        { phase: { startsWith: "Phase 12" } },
      ],
    },
    select: { id: true, description: true, notes: true },
  });
  let changed = 0;
  for (const row of rows) {
    const desc = row.description ?? "";
    const notes = row.notes ?? "";
    const nextDesc = desc.startsWith("PIVOT (founder-approved 8 Sep 2026)")
      ? desc
      : `${PHASE_11_12_PIVOT_BANNER}${desc}`;
    const noteLine =
      "Later banking vertical. First-client motion is Phase 16 CS/CRM (ELAH CRM Simulation).";
    const nextNotes = notes.includes("First-client motion is Phase 16")
      ? notes
      : notes
        ? `${noteLine} ${notes}`
        : noteLine;
    if (nextDesc === desc && nextNotes === notes) continue;
    await prisma.roadmapTask.update({
      where: { id: row.id },
      data: { description: nextDesc, notes: nextNotes },
    });
    changed += 1;
  }
  return { scanned: rows.length, changed };
}

async function main() {
  const { prisma } = await import("../lib/prisma");
  const { recomputeMilestoneProgress } = await import("../lib/roadmap/seed");

  const existingMilestone = await prisma.roadmapMilestone.findFirst({
    where: { title: PHASE16_MILESTONE.title },
  });

  const target = new Date();
  target.setMonth(target.getMonth() + PHASE16_MILESTONE.targetMonthsFromNow);

  const milestone =
    existingMilestone ??
    (await prisma.roadmapMilestone.create({
      data: {
        title: PHASE16_MILESTONE.title,
        description:
          "Founder-approved first wedge: B2B SaaS customer support and CRM operations. Banking simulator remains a demo. ELAH scores intent; it never allows, blocks, or executes.",
        targetDate: target,
        status: "in_progress",
        completionPercentage: 0,
        exitCriteria: PHASE16_MILESTONE.exitCriteria,
        owner: "Founder",
        order: PHASE16_MILESTONE.order,
          evidence:
            "Pivot 8 Sep 2026. ELAH CRM Simulation is on GitHub (benda17/ELAH_SECURITY-CRM-System) and Vercel (elahcrmsystem.vercel.app); dedicated Neon elah_crm. Memos are in_review Proposed — founder Approve still required.",
      },
    }));

  const maxOrder = await prisma.roadmapTask.aggregate({ _max: { order: true } });
  let order = maxOrder._max.order ?? 0;

  const created: string[] = [];
  const updated: string[] = [];

  for (const spec of PHASE16_TASKS) {
    const id = phase16TaskId(spec.title);
    const existing = await prisma.roadmapTask.findUnique({ where: { id } });
    const tags = spec.isCriticalPath
      ? ["critical-path", "cs-crm-wedge"]
      : ["cs-crm-wedge"];

    if (!existing) {
      order += 1;
      await prisma.roadmapTask.create({
        data: {
          id,
          title: spec.title,
          description: spec.description,
          category: spec.category,
          workstream: spec.workstream,
          phase: PHASE16_NAME,
          status: spec.status,
          priority: spec.priority,
          owner: "Founder",
          progressPercentage: spec.progressPercentage,
          estimatedEffort: spec.estimatedEffort,
          milestoneId: milestone.id,
          isCriticalPath: spec.isCriticalPath,
          order,
          successCriteria: spec.successCriteria,
          deliverables: spec.deliverables,
          notes: spec.notes,
          links: JSON.stringify(spec.links),
          tags: JSON.stringify(tags),
          completedAt: spec.status === "done" ? new Date() : null,
        },
      });
      created.push(`${id} | ${spec.title} | ${spec.status}`);
      continue;
    }

    await prisma.roadmapTask.update({
      where: { id },
      data: {
        title: spec.title,
        description: spec.description,
        category: spec.category,
        workstream: spec.workstream,
        phase: PHASE16_NAME,
        priority: spec.priority,
        estimatedEffort: spec.estimatedEffort,
        milestoneId: milestone.id,
        isCriticalPath: spec.isCriticalPath,
        successCriteria: spec.successCriteria,
        deliverables: spec.deliverables,
        notes: spec.notes,
        links: JSON.stringify(spec.links),
        tags: JSON.stringify(tags),
        ...(spec.syncStatus
          ? {
              status: spec.status,
              progressPercentage: spec.progressPercentage,
              completedAt: spec.status === "done" ? existing.completedAt ?? new Date() : null,
            }
          : {}),
      },
    });
    updated.push(`${id} | ${spec.title} | ${spec.syncStatus ? spec.status : existing.status}`);
  }

  const wireId = phase16TaskId("Wire mock ELAH score into CRM simulator");
  const simId = phase16TaskId("Build CRM simulator as first demo venue");
  await prisma.roadmapTask.update({
    where: { id: wireId },
    data: { dependencyIds: JSON.stringify([simId]) },
  });

  const annotated = await annotatePhase11And12(prisma);

  if (existingMilestone) {
    await prisma.roadmapMilestone.update({
      where: { id: milestone.id },
      data: {
        exitCriteria: PHASE16_MILESTONE.exitCriteria,
        evidence:
          "Pivot 8 Sep 2026. ELAH CRM Simulation at GitHub benda17/ELAH_SECURITY-CRM-System; Vercel https://elahcrmsystem.vercel.app (founder confirmed 14 Sep 2026); dedicated Neon elah_crm. ICP/taxonomy/one-pager/copy memos are Proposed in_review — founder Approve still required.",
      },
    });
  }

  const decisionQuestion = "What is the first-client wedge?";
  const existingDecision = await prisma.roadmapDecision.findFirst({
    where: { question: decisionQuestion },
  });
  const relatedIds = PHASE16_TASKS.map((t) => phase16TaskId(t.title));
  if (!existingDecision) {
    await prisma.roadmapDecision.create({
      data: {
        question: decisionQuestion,
        context:
          "First-client aspiration was bank-first (CISO / fraud / AI governance). Founder approved a pivot on 8 Sep 2026.",
        options: JSON.stringify([
          "Bank CISO / banking assistant (previous)",
          "B2B SaaS customer support and CRM operations (chosen)",
        ]),
        chosenOption: "B2B SaaS customer support and CRM operations",
        status: "decided",
        owner: "Founder",
        decisionDate: new Date("2026-09-08T00:00:00.000Z"),
        rationale:
          "First wedge is CS/CRM ops for B2B SaaS. ELAH still scores genuine intent before tool execution; company policy allow/deny/confirm; ELAH never allows, blocks, or executes. Banking simulator remains an existing demo, not the first sales motion.",
        risks:
          "Public copy (one-pager, HERO, Phase 11) still reads bank-first until Phase 16 GTM cards land. No CS/CRM gold yet — do not quote banking holdout as refund accuracy.",
        relatedTaskIds: JSON.stringify(relatedIds),
      },
    });
  }

  const riskText =
    "Public ICP still reads bank-first while the live sales motion is B2B SaaS CS/CRM operations.";
  const mitigatedRiskText =
    "Founder Approve is still required on Phase 16 Proposed memos (ICP, taxonomy, freeze, one-pager) before they are treated as signed GTM.";
  const existingRisk = await prisma.roadmapRisk.findFirst({
    where: {
      OR: [{ description: riskText }, { description: mitigatedRiskText }],
    },
  });
  if (!existingRisk) {
    await prisma.roadmapRisk.create({
      data: {
        description: mitigatedRiskText,
        riskType: "market",
        probability: "medium",
        impact: "medium",
        severity: "medium",
        mitigationPlan:
          "Founder reviews Confluence pack in docs/Phase 16 - B2B SaaS CS CRM wedge/, Approves sign-off tables, then publishes remaining newsletter/social. Agents do not post or send mail.",
        owner: "Founder",
        status: "open",
        relatedTaskIds: JSON.stringify(relatedIds.slice(0, 7)),
      },
    });
  } else {
    await prisma.roadmapRisk.update({
      where: { id: existingRisk.id },
      data: {
        description: mitigatedRiskText,
        probability: "medium",
        impact: "medium",
        severity: "medium",
        mitigationPlan:
          "Founder reviews Confluence pack in docs/Phase 16 - B2B SaaS CS CRM wedge/, Approves sign-off tables, then publishes remaining newsletter/social. Agents do not post or send mail.",
        relatedTaskIds: JSON.stringify(relatedIds.slice(0, 7)),
      },
    });
  }

  await recomputeMilestoneProgress();

  const phase16 = await prisma.roadmapTask.findMany({
    where: { phase: PHASE16_NAME },
    orderBy: { order: "asc" },
    select: { id: true, title: true, status: true, progressPercentage: true },
  });

  console.log(
    JSON.stringify(
      {
        phase: PHASE16_NAME,
        milestoneId: milestone.id,
        milestoneTitle: milestone.title,
        createdCount: created.length,
        created,
        updatedCount: updated.length,
        updated,
        phase11And12PivotBanner: annotated,
        tasks: phase16,
      },
      null,
      2,
    ),
  );

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
