import { NextRequest, NextResponse } from "next/server";
import { publishDraftById } from "@/lib/founder/content-engine/generator";
import { updateDraftBody, updateDraftStatus } from "@/lib/founder/content-engine/repository";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const body = (await req.json()) as {
    action?: "approve" | "reject" | "edit" | "publish";
    text?: string;
    title?: string;
    notes?: string;
  };

  if (body.action === "edit" && body.text) {
    await updateDraftBody(params.id, body.text, body.title);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "approve") {
    await updateDraftStatus(params.id, "approved", body.notes);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "reject") {
    await updateDraftStatus(params.id, "rejected", body.notes);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "publish") {
    const result = await publishDraftById(params.id);
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false, error: "Invalid action" }, { status: 400 });
}
