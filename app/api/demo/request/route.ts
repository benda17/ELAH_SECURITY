import { NextRequest, NextResponse } from "next/server";
import {
  allowedNewsletterOrigin,
  newsletterCorsHeaders,
} from "@/lib/newsletter/cors";
import { createDemoRequest } from "@/lib/demo/repository";
import { notifyFounderOfDemoRequest } from "@/lib/demo/notify";

export const dynamic = "force-dynamic";

function json(
  body: unknown,
  status: number,
  origin: string | null,
): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: newsletterCorsHeaders(origin),
  });
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && !allowedNewsletterOrigin(origin)) {
    return new NextResponse(null, { status: 403 });
  }
  return new NextResponse(null, {
    status: 204,
    headers: newsletterCorsHeaders(origin),
  });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && !allowedNewsletterOrigin(origin)) {
    return json({ ok: false, error: "origin not allowed" }, 403, origin);
  }

  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ ok: false, error: "Invalid JSON body." }, 400, origin);
  }

  try {
    const result = await createDemoRequest({
      name: payload.name,
      email: payload.email,
      company: payload.company,
      role: payload.role,
      goal: payload.goal,
      source: payload.source,
    });
    void notifyFounderOfDemoRequest({
      name: String(payload.name ?? ""),
      email: result.email,
      company: String(payload.company ?? ""),
      role: typeof payload.role === "string" ? payload.role : "",
      goal: typeof payload.goal === "string" ? payload.goal : "",
    });
    return json({ ok: true }, 200, origin);
  } catch (err) {
    const code = err instanceof Error ? err.message : "";
    if (code === "invalid_name") {
      return json({ ok: false, error: "Enter your name." }, 400, origin);
    }
    if (code === "invalid_email") {
      return json({ ok: false, error: "Enter a valid work email." }, 400, origin);
    }
    if (code === "invalid_company") {
      return json({ ok: false, error: "Enter your company." }, 400, origin);
    }
    return json({ ok: false, error: "Could not save the demo request." }, 500, origin);
  }
}
