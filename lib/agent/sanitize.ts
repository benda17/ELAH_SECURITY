import "server-only";
import { getTool } from "./tools";

/** Keys the LLM must never supply — identity and cross-tenant handles. */
export const FORBIDDEN_TOOL_ARG_KEYS = new Set([
  "userId",
  "customerProfileId",
  "profileId",
  "actorId",
  "sessionId",
  "accountId",
  "fromAccountId",
  "toAccountId",
  "ownerId",
  "targetUserId",
  "password",
  "token",
  "role",
]);

/** Allowed per-tool; everything else is stripped before execution. */
export function filterToolArgs(
  toolName: string,
  args: Record<string, unknown>,
): Record<string, unknown> {
  const tool = getTool(toolName);
  if (!tool) return {};
  const allowed = new Set(Object.keys(tool.parameters.properties ?? {}));
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(args)) {
    if (FORBIDDEN_TOOL_ARG_KEYS.has(k)) continue;
    if (!allowed.has(k)) continue;
    out[k] = v;
  }
  return out;
}

/** Remove internal/demo paths and excess fields before returning to the browser. */
export function sanitizeClientToolData(
  toolName: string,
  data: unknown,
): unknown {
  if (data == null) return data;
  if (Array.isArray(data)) {
    return data.map((row) => sanitizeClientToolData(toolName, row));
  }
  if (typeof data !== "object") return data;

  const obj = data as Record<string, unknown>;

  if (toolName === "get_transaction_by_id") {
    return {
      id: obj.id,
      timestamp: obj.timestamp,
      description: obj.description,
      merchantOrRecipient: obj.merchantOrRecipient,
      amount: obj.amount,
      currency: obj.currency,
      direction: obj.direction,
      category: obj.category,
      status: obj.status,
    };
  }

  if (toolName === "get_monthly_statement") {
    const month = obj.month;
    return {
      month,
      accountNumberMasked: obj.accountNumberMasked,
      transactionCount: obj.transactionCount,
      downloadUrl:
        typeof month === "string"
          ? `/documents?statement=${month}`
          : "/documents",
    };
  }

  if (toolName === "get_cards") {
    return (obj as { cardId?: string; linkedAccount?: string; status?: string; type?: string });
  }

  if (toolName === "create_external_transfer" || toolName === "create_internal_transfer") {
    return {
      reference: obj.reference,
      status: obj.status,
    };
  }

  if (toolName === "pay_bill") {
    return { reference: obj.reference };
  }

  if (toolName === "create_support_case") {
    return { ticketId: obj.ticketId, status: obj.status };
  }

  // Default: pass through known-safe scalar fields only
  const safe: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (k.endsWith("Id") && k !== "ticketId") continue;
    if (k.includes("risk") || k.includes("Flag") || k.includes("injection")) continue;
    if (typeof v === "string" && /mock-documents|simulation|demo only/i.test(v)) continue;
    if (typeof v === "object" && v !== null) continue;
    safe[k] = v;
  }
  return safe;
}

export function sanitizeClientError(error: string | undefined): string | undefined {
  if (!error) return undefined;
  if (/prisma|sql|stack|ECONN|unknown tool/i.test(error)) {
    return "action_failed";
  }
  return error;
}
