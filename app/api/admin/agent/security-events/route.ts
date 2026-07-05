import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSecurityApi } from "@/lib/auth/api-guards";

function parseJsonField<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

const SECURITY_EVENTS = new Set([
  "suspicious_prompt_detected",
  "unauthorized_access_attempt",
  "policy_check_failed",
  "agent_error",
]);

export async function GET(req: NextRequest) {
  const { error } = await requireSecurityApi();
  if (error) return error;

  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? 100), 500);

  const rows = await prisma.agentEventLog.findMany({
    where: { eventType: { in: [...SECURITY_EVENTS] } },
    orderBy: { timestamp: "desc" },
    take: limit,
  });

  return NextResponse.json({
    ok: true,
    count: rows.length,
    events: rows.map((r) => ({
      logId: r.id,
      timestamp: r.timestamp.toISOString(),
      eventType: r.eventType,
      userId: r.userId,
      conversationId: r.conversationId,
      userMessage: r.userMessage,
      detectedIntent: r.detectedIntent,
      toolName: r.toolName,
      policyDecision: r.policyDecision,
      policyReasons: parseJsonField<string[]>(r.policyReasons, []),
      riskScore: r.riskScore,
      resultSummary: r.resultSummary,
    })),
  });
}
