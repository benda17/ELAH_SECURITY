import { NextResponse } from "next/server";
import { handleScore } from "@/lib/elah/service";

export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<Response> {
  const rawBody = Buffer.from(await req.arrayBuffer());
  const result = await Promise.resolve(handleScore(req.headers, rawBody));
  return NextResponse.json(result.body, { status: result.status });
}
