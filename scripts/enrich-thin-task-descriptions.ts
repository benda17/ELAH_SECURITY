/**
 * Detect thin RoadmapTask descriptions in founder Neon and write the full
 * TODAY / DO THIS / IN — / OUT — template from lib/roadmap/seed/thin-copy.ts.
 * Skips Phase 16 and any card already in the full template.
 * Phase 7 is owned by roadmap:seed:phase07 — skipped here.
 * Fills successCriteria / deliverables / notes only when empty.
 * Does not prisma db push. Does not touch CRM Neon. Does not change status.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { isThinDescription, stripPivotBanner } from "../lib/roadmap/seed/card";
import { PHASE_SPECS } from "../lib/roadmap/seed/phases";
import { thinCopyFor } from "../lib/roadmap/seed/thin-copy";
import { PHASE_11_12_PIVOT_BANNER } from "../lib/roadmap/seed/phase16";

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

function emptyText(value: string | null | undefined): boolean {
  return !value || !value.trim();
}

async function main() {
  const { prisma } = await import("../lib/prisma");

  const specTitles = new Set(
    PHASE_SPECS.flatMap((p) => p.tasks.map((t) => t.trim())),
  );

  const rows = await prisma.roadmapTask.findMany({
    select: {
      id: true,
      title: true,
      phase: true,
      description: true,
      successCriteria: true,
      deliverables: true,
      notes: true,
    },
    orderBy: { order: "asc" },
  });

  const updated: { id: string; phase: string; title: string }[] = [];
  const skippedFull: string[] = [];
  const skippedPhase: string[] = [];
  const skippedNoCopy: string[] = [];
  const remainingThin: { id: string; phase: string; title: string; len: number }[] =
    [];
  const phasesTouched = new Set<string>();

  for (const row of rows) {
    if (row.phase.startsWith("Phase 16")) {
      skippedPhase.push(row.id);
      continue;
    }
    if (row.phase.startsWith("Phase 7")) {
      skippedPhase.push(row.id);
      continue;
    }
    if (!isThinDescription(row.description)) {
      skippedFull.push(row.id);
      continue;
    }

    const copy = thinCopyFor(row.phase, row.title);
    if (!copy) {
      skippedNoCopy.push(`${row.id} | ${row.title}`);
      remainingThin.push({
        id: row.id,
        phase: row.phase,
        title: row.title,
        len: (row.description ?? "").length,
      });
      continue;
    }

    let description = copy.description;
    if (row.phase.startsWith("Phase 11") || row.phase.startsWith("Phase 12")) {
      const without = stripPivotBanner(description);
      description = description.startsWith("PIVOT (founder-approved 8 Sep 2026)")
        ? description
        : `${PHASE_11_12_PIVOT_BANNER}${without}`;
    }

    const data: {
      description: string;
      successCriteria?: string;
      deliverables?: string;
      notes?: string;
    } = { description };

    if (emptyText(row.successCriteria)) data.successCriteria = copy.successCriteria;
    if (emptyText(row.deliverables)) data.deliverables = copy.deliverables;
    if (emptyText(row.notes)) data.notes = copy.notes;

    await prisma.roadmapTask.update({
      where: { id: row.id },
      data,
    });
    updated.push({ id: row.id, phase: row.phase, title: row.title });
    phasesTouched.add(row.phase);
  }

  const after = await prisma.roadmapTask.findMany({
    select: { id: true, title: true, phase: true, description: true },
  });
  for (const row of after) {
    if (row.phase.startsWith("Phase 16")) continue;
    if (!isThinDescription(row.description)) continue;
    remainingThin.push({
      id: row.id,
      phase: row.phase,
      title: row.title,
      len: (row.description ?? "").length,
    });
  }

  const remainingUnique = [
    ...new Map(remainingThin.map((r) => [r.id, r])).values(),
  ];

  const byPhase: Record<string, number> = {};
  for (const u of updated) {
    byPhase[u.phase] = (byPhase[u.phase] ?? 0) + 1;
  }

  console.log(
    JSON.stringify(
      {
        databaseHost: (process.env.DATABASE_URL ?? "").replace(
          /:[^:@/]+@/,
          ":***@",
        ),
        specTitleCount: specTitles.size,
        scanned: rows.length,
        updatedCount: updated.length,
        updatedByPhase: byPhase,
        phasesTouched: [...phasesTouched].sort(),
        skippedAlreadyFull: skippedFull.length,
        skippedPhase7or16: skippedPhase.length,
        skippedNoCopy: skippedNoCopy,
        remainingThinCount: remainingUnique.length,
        remainingThin: remainingUnique,
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
