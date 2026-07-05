import "server-only";
import type { ToolContext, ToolDefinition, ToolResult } from "../types";
import { isToolAllowed } from "../policy";
import { filterToolArgs } from "../sanitize";
import { readTools } from "./read";
import { moneyTools } from "./money";
import { cardTools } from "./cards";
import { supportTools } from "./support";

/**
 * Tool registry. The LLM only ever sees tools listed here, and only these
 * names are on the policy allow-list. Each tool self-authorizes: it must
 * re-check ownership of the resource inside `execute`.
 */
const ALL_TOOLS: ToolDefinition[] = [
  ...readTools,
  ...moneyTools,
  ...cardTools,
  ...supportTools,
];

const TOOL_BY_NAME = new Map(ALL_TOOLS.map((t) => [t.name, t]));

export function getTool(name: string): ToolDefinition | undefined {
  return TOOL_BY_NAME.get(name);
}

export function listTools(): ToolDefinition[] {
  return [...ALL_TOOLS];
}

/** JSON-Schema-shaped list for the LLM's function-calling interface. */
export function toolsForLLM() {
  return ALL_TOOLS.map((t) => ({
    type: "function" as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    },
  }));
}

export async function executeTool(
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext,
): Promise<ToolResult> {
  if (!isToolAllowed(name)) {
    return {
      ok: false,
      summary: "That action isn't available.",
      error: "tool_not_allowed",
    };
  }
  const tool = getTool(name);
  if (!tool) {
    return {
      ok: false,
      summary: "That action isn't available.",
      error: "unknown_tool",
    };
  }
  const safeArgs = filterToolArgs(name, args);
  try {
    return await tool.execute(safeArgs as never, ctx);
  } catch (err) {
    console.error(`[tool:${name}] execution error`, err);
    return {
      ok: false,
      summary: "Something went wrong while carrying out that request.",
      error: "action_failed",
    };
  }
}

export async function summarizeTool(
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext,
): Promise<string> {
  const tool = getTool(name);
  if (!tool) return "Unknown action";
  return tool.summarize(args as never, ctx);
}
