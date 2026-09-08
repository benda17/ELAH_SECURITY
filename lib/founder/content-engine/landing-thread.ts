import "server-only";
import { prisma } from "@/lib/prisma";
import { LANDING_PAGE_TWEETS } from "./landing-copy";
import { publishTwitterThread } from "./twitter";

export { LANDING_PAGE_TWEETS };

export const LANDING_THREAD_TRIGGER = "twitter-landing-thread";

export async function getLandingThreadStatus(): Promise<{
  posted: boolean;
  postIds: string[];
  postedAt: string | null;
  configured: boolean;
}> {
  const configured = true;
  const run = await prisma.contentEngineRun.findFirst({
    where: { trigger: LANDING_THREAD_TRIGGER, status: "success" },
    orderBy: { completedAt: "desc" },
  });
  if (!run) {
    return { posted: false, postIds: [], postedAt: null, configured };
  }
  let postIds: string[] = [];
  try {
    const parsed = JSON.parse(run.log) as { postIds?: string[] };
    if (Array.isArray(parsed.postIds)) postIds = parsed.postIds.map(String);
  } catch {
    postIds = [];
  }
  return {
    posted: true,
    postIds,
    postedAt: (run.completedAt ?? run.startedAt).toISOString(),
    configured,
  };
}

export async function postLandingThreadOnce(): Promise<{
  ok: boolean;
  postIds: string[];
  alreadyPosted?: boolean;
  error?: string;
}> {
  const existing = await getLandingThreadStatus();
  if (existing.posted) {
    return {
      ok: true,
      postIds: existing.postIds,
      alreadyPosted: true,
    };
  }

  const result = await publishTwitterThread(LANDING_PAGE_TWEETS);
  if (!result.ok) {
    await prisma.contentEngineRun.create({
      data: {
        trigger: LANDING_THREAD_TRIGGER,
        status: "failed",
        completedAt: new Date(),
        draftCount: result.postIds.length,
        errorMessage: result.error ?? "X thread failed",
        log: JSON.stringify({ postIds: result.postIds }),
      },
    });
    return { ok: false, postIds: result.postIds, error: result.error };
  }

  await prisma.contentEngineRun.create({
    data: {
      trigger: LANDING_THREAD_TRIGGER,
      status: "success",
      completedAt: new Date(),
      draftCount: result.postIds.length,
      log: JSON.stringify({
        postIds: result.postIds,
        source: "ELAH marketing landing page",
      }),
    },
  });

  return { ok: true, postIds: result.postIds };
}
