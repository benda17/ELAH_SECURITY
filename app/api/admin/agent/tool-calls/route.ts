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

export async function GET(req: NextRequest) {
  const { error } = await requireSecurityApi();
  if (error) return error;

  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? 100), 500);
  const userId = req.nextUrl.searchParams.get("userId") ?? undefined;

  const rows = await prisma.agentEventLog.findMany({
    where: {
      eventType: { in: ["tool_call_requested", "tool_call_executed", "tool_call_failed"] },
      ...(userId ? { userId } : {}),
    },
    orderBy: { timestamp: "desc" },
    take: limit,
  });

  return NextResponse.json({
    ok: true,
    count: rows.length,
    toolCalls: rows.map((r) => ({
      logId: r.id,
      timestamp: r.timestamp.toISOString(),
      eventType: r.eventType,
      userId: r.userId,
      conversationId: r.conversationId,
      toolName: r.toolName,
      toolArgsSanitized: parseJsonField(r.toolArgsSanitized, {}),
      policyDecision: r.policyDecision,
      resultSummary: r.resultSummary,
      latencyMs: r.latencyMs,
      ok: r.eventType === "tool_call_executed",
    })),
  });
}
