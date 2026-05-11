import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db";
import { actorTypeFromRole, tierFromRole } from "@/lib/auth/roles";
import { getSessionUser, getSessionId, clientIp } from "@/lib/auth/session";

export type RiskLevel = "low" | "medium" | "high" | "critical";
export type ApprovalStatus =
  | "not_required"
  | "pending"
  | "approved"
  | "rejected"
  | "expired";
export type ActorType = "customer" | "manager" | "admin" | "ai_agent" | "anonymous";

export interface WriteAuditLogInput {
  actorType?: ActorType;
  actorId?: string | null;
  actorName?: string | null;
  role?: string | null;
  customerTier?: string | null;
  actionType: string;
  page?: string | null;
  toolOrFeatureUsed?: string | null;
  inputDataSummary?: Record<string, unknown> | null;
  targetResource?: string | null;
  amount?: number | null;
  riskLevel?: RiskLevel;
  requiresApproval?: boolean;
  approvalStatus?: ApprovalStatus;
  sessionId?: string | null;
  ipAddress?: string | null;
  userIntent?: string | null;
  actionOutcome?: string;
  reasonForFlagging?: string | null;
  createdByAgent?: boolean;
}

const LOG_DIR = process.env.LOG_DIR ?? "./logs";
const LOG_MIRROR =
  (process.env.LOG_MIRROR_JSONL ?? "true").toLowerCase() === "true";

async function appendJsonl(filename: string, payload: Record<string, unknown>) {
  if (!LOG_MIRROR) return;
  try {
    const dir = path.resolve(process.cwd(), LOG_DIR);
    await fs.mkdir(dir, { recursive: true });
    const filePath = path.join(dir, filename);
    await fs.appendFile(filePath, JSON.stringify(payload) + "\n", "utf8");
  } catch {
    // Best-effort mirror. Never break user actions if disk write fails.
  }
}

/**
 * Write a structured audit log. Also mirrors to /logs/audit-logs.jsonl when enabled.
 * Tries to auto-fill actor context from the current session when not provided.
 */
export async function writeAuditLog(input: WriteAuditLogInput) {
  let { actorType, actorId, actorName, role, customerTier } = input;

  if (!actorId) {
    const u = await getSessionUser().catch(() => null);
    if (u) {
      actorId = u.id;
      actorName = actorName ?? u.name;
      role = role ?? u.role;
      actorType = actorType ?? actorTypeFromRole(u.role);
      customerTier = customerTier ?? u.customerProfile?.tier ?? tierFromRole(u.role);
    }
  }
  if (!actorType) actorType = "anonymous";
  if (!customerTier && role) customerTier = tierFromRole(role);

  const log = await prisma.auditLog.create({
    data: {
      actorType,
      actorId: actorId ?? null,
      actorName: actorName ?? null,
      role: role ?? null,
      customerTier: customerTier ?? null,
      actionType: input.actionType,
      page: input.page ?? null,
      toolOrFeatureUsed: input.toolOrFeatureUsed ?? null,
      inputDataSummary: input.inputDataSummary
        ? JSON.stringify(input.inputDataSummary)
        : null,
      targetResource: input.targetResource ?? null,
      amount: input.amount ?? null,
      riskLevel: input.riskLevel ?? "low",
      requiresApproval: input.requiresApproval ?? false,
      approvalStatus: input.approvalStatus ?? "not_required",
      sessionId: input.sessionId ?? getSessionId(),
      ipAddress: input.ipAddress ?? clientIp(),
      userIntent: input.userIntent ?? null,
      actionOutcome: input.actionOutcome ?? "viewed",
      reasonForFlagging: input.reasonForFlagging ?? null,
      createdByAgent: input.createdByAgent ?? false,
    },
  });

  await appendJsonl("audit-logs.jsonl", {
    logId: log.id,
    timestamp: log.timestamp.toISOString(),
    actorType: log.actorType,
    actorId: log.actorId,
    actorName: log.actorName,
    role: log.role,
    customerTier: log.customerTier,
    actionType: log.actionType,
    page: log.page,
    toolOrFeatureUsed: log.toolOrFeatureUsed,
    inputDataSummary: log.inputDataSummary
      ? JSON.parse(log.inputDataSummary)
      : {},
    targetResource: log.targetResource,
    amount: log.amount,
    riskLevel: log.riskLevel,
    requiresApproval: log.requiresApproval,
    approvalStatus: log.approvalStatus,
    sessionId: log.sessionId,
    ipAddress: log.ipAddress,
    userIntent: log.userIntent,
    actionOutcome: log.actionOutcome,
    reasonForFlagging: log.reasonForFlagging,
    createdByAgent: log.createdByAgent,
  });

  return log;
}

export interface WriteRiskEventInput {
  severity: RiskLevel;
  eventType: string;
  actorType: ActorType;
  actorId?: string | null;
  customerProfileId?: string | null;
  relatedAuditLogIds?: string[];
  relatedAgentActionLogIds?: string[];
  reasonForFlagging: string;
  detectedPattern?: string | null;
}

export async function writeRiskEvent(input: WriteRiskEventInput) {
  const event = await prisma.riskEvent.create({
    data: {
      severity: input.severity,
      eventType: input.eventType,
      actorType: input.actorType,
      actorId: input.actorId ?? null,
      customerProfileId: input.customerProfileId ?? null,
      relatedAuditLogIds: input.relatedAuditLogIds
        ? JSON.stringify(input.relatedAuditLogIds)
        : null,
      relatedAgentActionLogIds: input.relatedAgentActionLogIds
        ? JSON.stringify(input.relatedAgentActionLogIds)
        : null,
      reasonForFlagging: input.reasonForFlagging,
      detectedPattern: input.detectedPattern ?? null,
    },
  });

  await appendJsonl("risk-events.jsonl", {
    id: event.id,
    timestamp: event.timestamp.toISOString(),
    severity: event.severity,
    eventType: event.eventType,
    actorType: event.actorType,
    actorId: event.actorId,
    customerProfileId: event.customerProfileId,
    relatedAuditLogIds: input.relatedAuditLogIds ?? [],
    relatedAgentActionLogIds: input.relatedAgentActionLogIds ?? [],
    reasonForFlagging: event.reasonForFlagging,
    detectedPattern: event.detectedPattern,
    reviewStatus: event.reviewStatus,
  });

  return event;
}

export interface WriteAgentLogInput {
  agentId: string;
  agentSessionId: string;
  declaredTask: string;
  interpretedIntent: string;
  actorRoleContext: string;
  page?: string;
  toolOrFeatureUsed?: string;
  actionType: string;
  targetResource?: string;
  inputDataSummary?: Record<string, unknown>;
  actionOutcome: string;
  riskLevel?: RiskLevel;
  intentMatchStatus?: "aligned" | "drifting" | "misaligned" | "mismatch";
  relatedAuditLogId?: string;
  relatedRiskEventId?: string;
  elahVerdictPlaceholder?: string;
}

export async function writeAgentActionLog(input: WriteAgentLogInput) {
  const log = await prisma.agentActionLog.create({
    data: {
      agentId: input.agentId,
      agentSessionId: input.agentSessionId,
      declaredTask: input.declaredTask,
      interpretedIntent: input.interpretedIntent,
      actorRoleContext: input.actorRoleContext,
      page: input.page,
      toolOrFeatureUsed: input.toolOrFeatureUsed,
      actionType: input.actionType,
      targetResource: input.targetResource,
      inputDataSummary: input.inputDataSummary
        ? JSON.stringify(input.inputDataSummary)
        : null,
      actionOutcome: input.actionOutcome,
      riskLevel: input.riskLevel ?? "low",
      intentMatchStatus: input.intentMatchStatus ?? "aligned",
      relatedAuditLogId: input.relatedAuditLogId,
      relatedRiskEventId: input.relatedRiskEventId,
      elahVerdictPlaceholder: input.elahVerdictPlaceholder,
    },
  });

  await appendJsonl("agent-action-logs.jsonl", {
    id: log.id,
    agentId: log.agentId,
    agentSessionId: log.agentSessionId,
    timestamp: log.timestamp.toISOString(),
    declaredTask: log.declaredTask,
    interpretedIntent: log.interpretedIntent,
    actorRoleContext: log.actorRoleContext,
    page: log.page,
    toolOrFeatureUsed: log.toolOrFeatureUsed,
    actionType: log.actionType,
    targetResource: log.targetResource,
    inputDataSummary: log.inputDataSummary
      ? JSON.parse(log.inputDataSummary)
      : {},
    actionOutcome: log.actionOutcome,
    riskLevel: log.riskLevel,
    intentMatchStatus: log.intentMatchStatus,
    relatedAuditLogId: log.relatedAuditLogId,
    relatedRiskEventId: log.relatedRiskEventId,
    elahVerdictPlaceholder: log.elahVerdictPlaceholder,
  });

  return log;
}
