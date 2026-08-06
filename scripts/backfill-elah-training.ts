import { backfillElahTrainingEvents } from "@/lib/elah/training-event";

async function main() {
  const limit = Number(process.argv[2] ?? 5000);
  const result = await backfillElahTrainingEvents({ limit });
  console.log("Backfill complete:", result);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
