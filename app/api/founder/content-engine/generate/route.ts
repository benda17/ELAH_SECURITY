import { NextRequest, NextResponse } from "next/server";
import { generateLinkedInDraft } from "@/lib/founder/content-engine/generator";

export async function POST(_req: NextRequest) {
  const result = await generateLinkedInDraft("manual");
  if (result.error && !result.draftId) {
    return NextResponse.json({ ok: false, ...result }, { status: 500 });
  }
  return NextResponse.json({ ok: true, ...result });
}
