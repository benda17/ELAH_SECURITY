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
  const eventType = req.nextUrl.searchParams.get("eventType") ?? undefined;
  const userId = req.nextUrl.searchParams.get("userId") ?? undefined;

  const rows = await prisma.agentEventLog.findMany({
    where: {
      ...(eventType ? { eventType } : {}),
      ...(userId ? { userId } : {}),
    },
    orderBy: { timestamp: "desc" },
    take: limit,
  });

  return NextResponse.json({
    ok: true,
    count: rows.length,
    logs: rows.map((r) => ({
      logId: r.id,
      timestamp: r.timestamp.toISOString(),
      eventType: r.eventType,
      userId: r.userId,
      sessionId: r.sessionId,
      conversationId: r.conversationId,
      messageId: r.messageId,
      userMessage: r.userMessage,
      assistantMessage: r.assistantMessage,
      detectedIntent: r.detectedIntent,
      toolName: r.toolName,
      toolArgsSanitized: parseJsonField(r.toolArgsSanitized, {}),
      policyDecision: r.policyDecision,
      policyReasons: parseJsonField<string[]>(r.policyReasons, []),
      riskScore: r.riskScore,
      resultSummary: r.resultSummary,
      latencyMs: r.latencyMs,
      ipAddress: r.ipAddress,
      metadata: parseJsonField(r.metadata, {}),
    })),
  });
}
