import { NextResponse } from "next/server";
import { getHealth } from "@/lib/elah/service";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  return NextResponse.json(getHealth());
}
