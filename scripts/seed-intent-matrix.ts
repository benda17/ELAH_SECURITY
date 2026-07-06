import { ensureIntentMatrixSeed } from "@/lib/agent/intent-matrix/store";

async function main() {
  await ensureIntentMatrixSeed();
  console.log("Intent matrix seed ensured (22 intents).");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
