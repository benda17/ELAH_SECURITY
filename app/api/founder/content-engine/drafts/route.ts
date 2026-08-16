import { NextResponse } from "next/server";
import {
  countLinkedInPostsByStatus,
  listLinkedInDrafts,
} from "@/lib/founder/content-engine/repository";

export const dynamic = "force-dynamic";

export async function GET() {
  const [drafts, counts] = await Promise.all([
    listLinkedInDrafts(80),
    countLinkedInPostsByStatus(),
  ]);
  return NextResponse.json({ drafts, counts });
}
