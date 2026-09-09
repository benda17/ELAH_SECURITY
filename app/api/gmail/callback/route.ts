import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { exchangeGmailCode, saveGmailConnection } from "@/lib/newsletter/gmail";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const err = url.searchParams.get("error");
  const expected = cookies().get("gmail_oauth_state")?.value;
  const back = new URL("/founder/settings", url.origin);

  if (err) {
    back.searchParams.set("gmail", `error:${err}`);
    return NextResponse.redirect(back);
  }
  if (!code || !state || !expected || state !== expected) {
    back.searchParams.set("gmail", "error:invalid_state");
    return NextResponse.redirect(back);
  }

  try {
    const tokens = await exchangeGmailCode(code);
    await saveGmailConnection(tokens);
    cookies().delete("gmail_oauth_state");
    back.searchParams.set("gmail", "connected");
    return NextResponse.redirect(back);
  } catch (e) {
    const message = e instanceof Error ? e.message : "token_failed";
    back.searchParams.set("gmail", `error:${encodeURIComponent(message.slice(0, 160))}`);
    return NextResponse.redirect(back);
  }
}
