import { NextRequest, NextResponse } from "next/server";
import { assertCronAuthorized } from "@/lib/founder/content-engine/config";
import { generateLinkedInDraft } from "@/lib/founder/content-engine/generator";

export async function GET(request: NextRequest) {
  if (!assertCronAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const result = await generateLinkedInDraft("cron");
  if (result.error && !result.draftId) {
    return NextResponse.json({ ok: false, ...result }, { status: 500 });
  }

  return NextResponse.json({ ok: true, ...result });
}
