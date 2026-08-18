import { NextResponse } from "next/server";
import { getFacebookPublishStatus } from "@/lib/founder/content-engine/facebook";
import { getLinkedInConnectionStatus } from "@/lib/founder/content-engine/linkedin";
import {
  countLinkedInPostsByStatus,
  listLinkedInDrafts,
} from "@/lib/founder/content-engine/repository";

export const dynamic = "force-dynamic";

export async function GET() {
  const [drafts, counts, linkedin, facebook] = await Promise.all([
    listLinkedInDrafts(80),
    countLinkedInPostsByStatus(),
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
