import { NextRequest, NextResponse } from "next/server";
import { getFacebookPublishStatus } from "@/lib/founder/content-engine/facebook";
import { getLinkedInConnectionStatus } from "@/lib/founder/content-engine/linkedin";
import {
  countLinkedInPostsByStatus,
  listLinkedInDrafts,
  type ContentEra,
} from "@/lib/founder/content-engine/repository";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const eraParam = req.nextUrl.searchParams.get("era");
  const era: ContentEra | undefined = eraParam === "v1" || eraParam === "v2" ? eraParam : undefined;
  const [drafts, counts, linkedin, facebook] = await Promise.all([
    listLinkedInDrafts(80, era),
    countLinkedInPostsByStatus(era),
    getLinkedInConnectionStatus(),
    getFacebookPublishStatus(),
  ]);
  return NextResponse.json({
    drafts,
    counts,
    publish: {
      linkedin: linkedin.canPublish,
      facebook: facebook.configured,
      linkedinNotes: linkedin.notes,
      facebookNotes: facebook.notes,
      facebookPage: facebook.pageName,
      contentEngineUrl: "https://elahfounderplatform.vercel.app/founder/content-engine",
    },
  });
}
