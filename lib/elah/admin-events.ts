import "server-only";
import { prisma } from "@/lib/db";
import { CUSTOMER_ROLES, ROLE_LABEL } from "@/lib/auth/roles";
import { hashUserId, sanitizeToolArgs } from "@/lib/elah/helpers";
import {
  ELAH_ACTION_TYPES,
  ELAH_TOOL_NAMES,
  type ElahEvent,
} from "@/lib/elah/envelope";

/**
 * Small admin-only helpers for the ElahEvent viewer.
 * List/query/quality come from `lib/elah/envelope.ts` + `lib/elah/quality.ts`.
 * Correlation comes from `lib/elah/correlate.ts`.
 */

export const FILTER_OPTIONS = {
  sources: ["ui", "agent", "system"] as const,
  actionTypes: ELAH_ACTION_TYPES,
  toolNames: ELAH_TOOL_NAMES,
  outcomes: [
    "executed",
    "blocked",
    "cancelled",
    "failed",
    "pending_confirmation",
    "conversational",
    "refused",
    "session",
  ] as const,
};

export interface DemoCustomerOption {
  userIdHash: string;
  name: string;
  roleLabel: string;
}

export async function listDemoCustomers(): Promise<DemoCustomerOption[]> {
  const customers = await prisma.user.findMany({
    where: { role: { in: [...CUSTOMER_ROLES] } },
    select: { id: true, name: true, role: true },
    orderBy: { name: "asc" },
  });
  return customers.map((customer) => ({
    userIdHash: hashUserId(customer.id),
    name: customer.name,
    roleLabel: ROLE_LABEL[customer.role] ?? customer.role,
  }));
}

export function envelopeForDisplay(event: ElahEvent): ElahEvent {
  const clone = structuredClone(event);
  const asRecord = clone as unknown as Record<string, unknown>;
  delete asRecord.elahScore;
  delete asRecord.elahScoreLabel;
  clone.action.args = sanitizeToolArgs(clone.action.args);
  return clone;
}
