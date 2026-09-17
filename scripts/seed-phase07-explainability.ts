/**
 * Idempotent create/update of Phase 7 explainability Kanban cards.
 * Does not prisma db push. Does not git push. Does not send mail.
 * Does not touch CRM Neon.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  PHASE7_MILESTONE,
  PHASE7_NAME,
  PHASE07_TASKS,
} from "../lib/roadmap/seed/phase07";

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

async function main() {
  const { prisma } = await import("../lib/prisma");
  const { recomputeMilestoneProgress } = await import("../lib/roadmap/seed");

  const existingMilestone = await prisma.roadmapMilestone.findFirst({
    where: { title: PHASE7_MILESTONE.title },
  });

  const target = new Date();
  target.setMonth(target.getMonth() + PHASE7_MILESTONE.targetMonthsFromNow);

  const milestone =
    existingMilestone ??
    (await prisma.roadmapMilestone.create({
      data: {
        title: PHASE7_MILESTONE.title,
        description:
          "CS/CRM ops analysts first; banking graph remains the existing demo. Axes frozen HA/FR/EU. Normalized action is separate evidence for what happened; intent explains alignment. ELAH never allows, blocks, or executes.",
        targetDate: target,
        status: "in_progress",
        completionPercentage: 0,
        exitCriteria: PHASE7_MILESTONE.exitCriteria,
        owner: "Founder",
        order: PHASE7_MILESTONE.order,
        evidence:
          "Live founder graphs plus Phase 7 docs. 17 Sep 2026 research-derived action overlay is implemented with metadata provenance, historical fallbacks, and refund explicitly unmapped. No understandability interviews or customer validation. Not Done.",
      },
    }));

  const maxOrder = await prisma.roadmapTask.aggregate({ _max: { order: true } });
  let order = maxOrder._max.order ?? 0;

  const created: string[] = [];
  const updated: string[] = [];

  for (const spec of PHASE07_TASKS) {
    const existing = await prisma.roadmapTask.findUnique({ where: { id: spec.id } });
    const tags = spec.isCriticalPath
      ? ["critical-path", "explainability"]
      : ["explainability"];

    if (!existing) {
      order += 1;
      await prisma.roadmapTask.create({
        data: {
          id: spec.id,
          title: spec.title,
          description: spec.description,
          category: spec.category,
          workstream: spec.workstream,
          phase: PHASE7_NAME,
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
      created.push(`${spec.id} | ${spec.title} | ${spec.status}`);
      continue;
    }

    await prisma.roadmapTask.update({
      where: { id: spec.id },
      data: {
        title: spec.title,
        description: spec.description,
        category: spec.category,
        workstream: spec.workstream,
        phase: PHASE7_NAME,
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
              completedAt:
                spec.status === "done" ? existing.completedAt ?? new Date() : null,
            }
          : {}),
      },
    });
    updated.push(
      `${spec.id} | ${spec.title} | ${spec.syncStatus ? spec.status : existing.status}`,
    );
  }

  if (existingMilestone) {
    await prisma.roadmapMilestone.update({
      where: { id: milestone.id },
      data: {
        exitCriteria: PHASE7_MILESTONE.exitCriteria,
        evidence:
          "Live founder HA/FR/EU graphs and Phase 7 docs. Action evidence is a separate 17 Sep 2026 research overlay, not a fourth axis or accuracy claim; request_refund remains unmapped. No analyst interviews on file. Do not mark milestone complete.",
      },
    });
  }

  await recomputeMilestoneProgress();

  const phase7 = await prisma.roadmapTask.findMany({
    where: { phase: PHASE7_NAME },
    orderBy: { order: "asc" },
    select: {
      id: true,
      title: true,
      status: true,
      progressPercentage: true,
    },
  });

  console.log(
    JSON.stringify(
      {
        phase: PHASE7_NAME,
        milestoneId: milestone.id,
        milestoneTitle: milestone.title,
        createdCount: created.length,
        created,
        updatedCount: updated.length,
        updated,
        tasks: phase7,
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
