/**
 * Replace the execution board with the APACT roadmap.
 * Deletes RoadmapTask, RoadmapMilestone, RoadmapRisk, RoadmapExperiment,
 * and RoadmapDecision rows, then reseeds from lib/roadmap/seed.
 * Preserves RoadmapContact. Does not touch newsletter, content, or banking tables.
 * Does not print DATABASE_URL or other secrets.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

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

function sanitize(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message
    .replace(/postgres(?:ql)?:\/\/\S+/gi, "postgres://***")
    .replace(/DATABASE_URL=\S+/gi, "DATABASE_URL=***");
}

loadDotEnv(resolve(__dirname, "../.env"));
loadDotEnv(resolve(__dirname, "../.env.local"));

async function main() {
  const { replaceApactRoadmap } = await import("../lib/roadmap/seed");
  const result = await replaceApactRoadmap();
  console.log(JSON.stringify(result, null, 2));
  const { prisma } = await import("../lib/prisma");
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(sanitize(error));
  process.exit(1);
});
