import { NextResponse } from "next/server";
import { postLandingThreadOnce } from "@/lib/founder/content-engine/landing-thread";

export const dynamic = "force-dynamic";

export async function POST() {
  const result = await postLandingThreadOnce();
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error, postIds: result.postIds },
      { status: 400 },
    );
  }
  return NextResponse.json({
    ok: true,
    alreadyPosted: Boolean(result.alreadyPosted),
    postIds: result.postIds,
  });
}
