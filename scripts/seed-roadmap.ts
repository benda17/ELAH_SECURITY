import { seedRoadmapIfEmpty, recomputeMilestoneProgress } from "../lib/roadmap/seed";

async function main() {
  const result = await seedRoadmapIfEmpty();
  await recomputeMilestoneProgress();
  console.log(JSON.stringify(result, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
