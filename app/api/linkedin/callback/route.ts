import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  exchangeLinkedInCode,
  saveLinkedInConnection,
} from "@/lib/founder/content-engine/linkedin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const err = url.searchParams.get("error");
  const expected = cookies().get("linkedin_oauth_state")?.value;

  const back = new URL("/founder/content-engine", url.origin);

  if (err) {
    back.searchParams.set("linkedin", `error:${err}`);
    return NextResponse.redirect(back);
  }
  if (!code || !state || !expected || state !== expected) {
    back.searchParams.set("linkedin", "error:invalid_state");
    return NextResponse.redirect(back);
  }

  try {
    const tokens = await exchangeLinkedInCode(code);
    await saveLinkedInConnection(tokens);
    cookies().delete("linkedin_oauth_state");
    back.searchParams.set("linkedin", "connected");
    return NextResponse.redirect(back);
  } catch (e) {
    const message = e instanceof Error ? e.message : "token_failed";
    back.searchParams.set("linkedin", `error:${encodeURIComponent(message.slice(0, 120))}`);
    return NextResponse.redirect(back);
  }
}
