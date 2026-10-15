import type { PrismaClient } from "@prisma/client";
import { V2_SOURCE_TOPICS } from "./v2-content";

/** Insert V2 topic seeds whose titles are not already present. Leaves older events alone. */
export async function ensureV2SourceEvents(db: PrismaClient): Promise<number> {
  const titles = V2_SOURCE_TOPICS.map((topic) => topic.title);
  const existing = await db.contentSourceEvent.findMany({
    where: { title: { in: titles } },
    select: { title: true },
  });
  const have = new Set(existing.map((row) => row.title));
  const seeds = V2_SOURCE_TOPICS.flatMap((topic, index) =>
    have.has(topic.title)
      ? []
      : [
          {
            sourceType: "research",
            title: topic.title,
            summary: topic.summary,
            url: null as string | null,
            metadata: JSON.stringify({ seed: true, era: "v2", index }),
          },
        ],
  );
  if (seeds.length === 0) return 0;
  await db.contentSourceEvent.createMany({ data: seeds });
  return seeds.length;
}
