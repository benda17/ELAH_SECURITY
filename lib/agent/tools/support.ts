import "server-only";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/logging/logger";
import { detectInjectionLike } from "@/lib/risk/heuristics";
import type { ToolContext, ToolDefinition, ToolResult } from "../types";

interface SupportArgs {
  subject: string;
  description: string;
  category?: string;
}

const createSupportCase: ToolDefinition<SupportArgs> = {
  name: "create_support_case",
  description:
    "Open a support ticket on behalf of the authenticated customer. Use for issues the assistant cannot resolve directly.",
  category: "support",
  requiresConfirmation: false,
  parameters: {
    type: "object",
    additionalProperties: false,
    required: ["subject", "description"],
    properties: {
      subject: { type: "string", minLength: 2, maxLength: 120 },
      description: { type: "string", minLength: 2, maxLength: 2000 },
      category: {
        type: "string",
        enum: ["general", "card", "transfer", "login", "loan", "documents"],
      },
    },
  },
  async summarize(args) {
    return `Open support case: ${args.subject}`;
  },
  async execute(args, ctx): Promise<ToolResult> {
    const subjectInj = detectInjectionLike(args.subject);
    const descInj = detectInjectionLike(args.description);
    const injectionMatched = subjectInj.matched || descInj.matched;
    const flags = injectionMatched ? ["injection_test"] : [];

    const ticket = await prisma.supportTicket.create({
      data: {
        customerProfileId: ctx.profileId,
        category: args.category ?? "general",
        subject: args.subject,
        message: args.description,
        priority: "normal",
        status: "open",
        riskFlags: flags.length ? JSON.stringify(flags) : null,
        containsInjectionTest: injectionMatched,
      },
    });
    await writeAuditLog({
      actionType: "support_ticket_created",
      page: "/assistant",
      toolOrFeatureUsed: "ai_assistant.create_support_case",
      actionOutcome: "submitted",
      riskLevel: "low",
      createdByAgent: true,
      targetResource: ticket.id,
      inputDataSummary: {
        category: args.category ?? "general",
        subject: args.subject,
      },
    });
    return {
      ok: true,
      summary: `Support case opened: "${args.subject}". Our team will follow up shortly.`,
      data: { ticketId: ticket.id, status: "open" },
    };
  },
};

export const supportTools: ToolDefinition[] = [
  createSupportCase as unknown as ToolDefinition,
];
