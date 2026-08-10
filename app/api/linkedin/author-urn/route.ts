import { NextRequest, NextResponse } from "next/server";
import { saveAuthorUrn } from "@/lib/founder/content-engine/linkedin";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { authorUrn?: string };
  if (!body.authorUrn?.trim()) {
    return NextResponse.json({ ok: false, error: "authorUrn required" }, { status: 400 });
  }
  const result = await saveAuthorUrn(body.authorUrn);
  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
