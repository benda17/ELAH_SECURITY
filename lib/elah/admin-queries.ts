import "server-only";
import { prisma } from "@/lib/db";
import type { ElahTrainingEventFilters } from "./types";

export function parseTrainingEventFilters(
  params: URLSearchParams,
): ElahTrainingEventFilters {
  const limit = Math.min(Number(params.get("limit") ?? 50), 200);
  const offset = Math.max(Number(params.get("offset") ?? 0), 0);
  const minScore = params.get("minScore");
  const maxScore = params.get("maxScore");
  const from = params.get("from");
  const to = params.get("to");

  return {
    finalIntent: params.get("finalIntent") ?? undefined,
    labelSource: params.get("labelSource") ?? undefined,
    actionOutcome: params.get("actionOutcome") ?? undefined,
    minScore: minScore != null && minScore !== "" ? Number(minScore) : undefined,
    maxScore: maxScore != null && maxScore !== "" ? Number(maxScore) : undefined,
    from: from ? new Date(from) : undefined,
    to: to ? new Date(to) : undefined,
    limit,
    offset,
  };
}

function buildWhere(filters: ElahTrainingEventFilters) {
  return {
    ...(filters.finalIntent ? { finalIntent: filters.finalIntent } : {}),
    ...(filters.labelSource ? { labelSource: filters.labelSource } : {}),
    ...(filters.actionOutcome ? { actionOutcome: filters.actionOutcome } : {}),
    ...(filters.minScore != null || filters.maxScore != null
      ? {
          elahScoreLabel: {
            ...(filters.minScore != null ? { gte: filters.minScore } : {}),
            ...(filters.maxScore != null ? { lte: filters.maxScore } : {}),
          },
        }
      : {}),
    ...(filters.from || filters.to
      ? {
          createdAt: {
            ...(filters.from ? { gte: filters.from } : {}),
            ...(filters.to ? { lte: filters.to } : {}),
          },
        }
      : {}),
  };
}

export async function queryTrainingEvents(filters: ElahTrainingEventFilters) {
  const where = buildWhere(filters);
  const [rows, total] = await Promise.all([
    prisma.elahTrainingEvent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: filters.limit ?? 50,
      skip: filters.offset ?? 0,
    }),
    prisma.elahTrainingEvent.count({ where }),
  ]);

  return {
    total,
    events: rows.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      previousUserMessages: parseJson(row.previousUserMessages),
      previousAssistantMessages: parseJson(row.previousAssistantMessages),
      toolArgsSanitized: parseJson(row.toolArgsSanitized),
      matchedSignals: parseJson(row.matchedSignals),
      weakSignals: parseJson(row.weakSignals),
      negativeSignals: parseJson(row.negativeSignals),
    })),
  };
}

function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}
