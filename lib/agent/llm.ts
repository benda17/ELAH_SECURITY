import "server-only";
import OpenAI from "openai";
import type { ChatCompletionMessageParam, ChatCompletionTool } from "openai/resources/chat/completions";
import { classifyIntent } from "./intent";
import { AGENT_MODEL_ID, AGENT_SYSTEM_PROMPT } from "./system-prompt";
import { isToolAllowed } from "./policy";
import { filterToolArgs } from "./sanitize";
import { toolsForLLM } from "./tools";
import type { AgentIntent, AgentPlan } from "./types";

export interface LLMMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  toolCallId?: string;
  name?: string;
}

function extractAmount(text: string): number | null {
  const m = text.match(/(?:₪|nis|shekel|shekels|\bils\b)?\s*(\d[\d,]*(?:\.\d+)?)/i);
  if (!m) return null;
  const n = Number(m[1].replace(/,/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function extractRecipient(text: string): string | null {
  const m = text.match(/\b(?:to|for)\s+([A-Za-z][A-Za-z\s'-]{1,40})/i);
  if (!m) return null;
  return m[1].trim().replace(/\s+(from|using|with)$/i, "");
}

function extractMonth(text: string): string | null {
  const iso = text.match(/\b(20\d{2})[-/](0[1-9]|1[0-2])\b/);
  if (iso) return `${iso[1]}-${iso[2]}`;
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function extractLimit(text: string): number {
  const m = text.match(/\blast\s+(\d+)\b/i);
  if (m) return Math.min(Number(m[1]), 50);
  return 5;
}

function extractCategory(text: string): string | undefined {
  const cats = [
    "groceries",
    "bills",
    "restaurant",
    "fuel",
    "utilities",
    "transport",
    "health",
    "online retail",
    "transfer_external",
    "transfer_internal",
  ];
  const lower = text.toLowerCase();
  return cats.find((c) => lower.includes(c.replace("_", " ")) || lower.includes(c));
}

/**
 * Rules-based planner used when OPENAI_API_KEY is absent or the provider fails.
 */
export function fallbackPlan(userMessage: string, firstName: string): AgentPlan {
  const intent = classifyIntent(userMessage);
  const amount = extractAmount(userMessage);
  const recipient = extractRecipient(userMessage);

  switch (intent) {
    case "balance_query":
      return {
        intent,
        reply: `I'll look up your account balances now, ${firstName}.`,
        toolCall: { name: "get_account_balance", args: { accountType: "all" } },
        usedFallback: true,
      };
    case "transaction_search":
      return {
        intent,
        reply: "Here are your most recent transactions.",
        toolCall: {
          name: "get_recent_transactions",
          args: { limit: extractLimit(userMessage) },
        },
        usedFallback: true,
      };
    case "spending_analysis":
      return {
        intent,
        reply: "I'll summarize your spending for this month.",
        toolCall: {
          name: "get_spending_summary",
          args: {
            month: extractMonth(userMessage),
            category: extractCategory(userMessage),
          },
        },
        usedFallback: true,
      };
    case "internal_transfer": {
      const toSavings = /savings/.test(userMessage.toLowerCase());
      const toChecking = /checking/.test(userMessage.toLowerCase());
      if (!amount) {
        return {
          intent: "ambiguous_request",
          reply: "How much would you like to move, and between which accounts?",
          usedFallback: true,
        };
      }
      return {
        intent,
        reply: `I can move ₪${amount.toLocaleString()} between your accounts.`,
        toolCall: {
          name: "create_internal_transfer",
          args: {
            fromAccountType: toSavings ? "checking" : "checking",
            toAccountType: toSavings ? "savings" : toChecking ? "checking" : "savings",
            amount,
          },
        },
        usedFallback: true,
      };
    }
    case "external_transfer":
      if (!amount || !recipient) {
        return {
          intent: "ambiguous_request",
          reply: "Please tell me the recipient name and the amount you'd like to send.",
          usedFallback: true,
        };
      }
      return {
        intent,
        reply: `I can transfer ₪${amount.toLocaleString()} to ${recipient}.`,
        toolCall: {
          name: "create_external_transfer",
          args: { recipientName: recipient, amount },
        },
        usedFallback: true,
      };
    case "bill_payment": {
      const biller =
        /electricity/i.test(userMessage)
          ? "Electricity Company"
          : /phone|mobile/i.test(userMessage)
            ? "Mobile Provider"
            : /water/i.test(userMessage)
              ? "Water Authority"
              : "Biller";
      if (!amount) {
        return {
          intent: "ambiguous_request",
          reply: `Which bill would you like to pay, and for how much?`,
          usedFallback: true,
        };
      }
      return {
        intent,
        reply: `I can pay ₪${amount.toLocaleString()} to ${biller}.`,
        toolCall: { name: "pay_bill", args: { billerName: biller, amount } },
        usedFallback: true,
      };
    }
    case "card_management":
      if (/unfreeze|activate|reactivate/.test(userMessage.toLowerCase())) {
        return {
          intent,
          reply: "I'll check your cards and prepare to unfreeze the primary card.",
          toolCall: { name: "get_cards", args: { status: "frozen" } },
          usedFallback: true,
        };
      }
      return {
        intent,
        reply: "I'll look up your cards so we can freeze the right one.",
        toolCall: { name: "get_cards", args: { status: "all" } },
        usedFallback: true,
      };
    case "statement_download":
      return {
        intent,
        reply: `I can prepare your statement for ${extractMonth(userMessage)}.`,
        toolCall: {
          name: "get_monthly_statement",
          args: { month: extractMonth(userMessage) },
        },
        usedFallback: true,
      };
    case "recipients_query":
      return {
        intent,
        reply: "Here are recipients you've paid recently.",
        toolCall: { name: "get_saved_recipients", args: {} },
        usedFallback: true,
      };
    case "support_request":
      return {
        intent,
        reply: "I'll open a support case for you.",
        toolCall: {
          name: "create_support_case",
          args: {
            subject: "Assistance requested via AI Assistant",
            description: userMessage.slice(0, 500),
            category: "general",
          },
        },
        usedFallback: true,
      };
    case "small_talk":
      return {
        intent,
        reply: `Hello ${firstName}. I'm your ELAH banking assistant — I can check balances, review transactions, move money, pay bills, and more. How can I help?`,
        usedFallback: true,
      };
    case "ambiguous_request":
      return {
        intent,
        reply:
          "I need a bit more detail to help safely. Could you specify the amount, account, recipient, or time period?",
        usedFallback: true,
      };
    default:
      return {
        intent: "ambiguous_request",
        reply:
          "I'm not sure I understood. You can ask about balances, transactions, transfers, bills, cards, or statements.",
        usedFallback: true,
      };
  }
}

export async function callLLM(
  history: LLMMessage[],
  firstName: string,
): Promise<AgentPlan> {
  const apiKey = process.env.OPENAI_API_KEY;
  const lastUser = [...history].reverse().find((m) => m.role === "user")?.content ?? "";

  if (!apiKey) {
    return fallbackPlan(lastUser, firstName);
  }

  try {
    const client = new OpenAI({ apiKey });
    const tools = toolsForLLM() as ChatCompletionTool[];
    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: AGENT_SYSTEM_PROMPT },
      ...history.map((m) => {
        if (m.role === "tool") {
          return {
            role: "tool" as const,
            tool_call_id: m.toolCallId ?? "tool",
            content: m.content,
          };
        }
        return { role: m.role, content: m.content };
      }),
    ];

    const completion = await client.chat.completions.create({
      model: AGENT_MODEL_ID,
      messages,
      tools,
      tool_choice: "auto",
      temperature: 0.2,
    });

    const choice = completion.choices[0]?.message;
    if (!choice) {
      return fallbackPlan(lastUser, firstName);
    }

    const intent = classifyIntent(lastUser);
    const toolCall = choice.tool_calls?.[0];
    if (toolCall && toolCall.type === "function") {
      const toolName = toolCall.function.name;
      if (!isToolAllowed(toolName)) {
        return {
          intent: "unsafe_request",
          reply: "I'm not able to perform that action.",
          refuse: true,
          usedFallback: false,
        };
      }
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(toolCall.function.arguments || "{}");
      } catch {
        args = {};
      }
      args = filterToolArgs(toolName, args);
      return {
        intent,
        reply: choice.content?.trim() || "I'll take care of that for you.",
        toolCall: { name: toolName, args },
        usedFallback: false,
      };
    }

    return {
      intent,
      reply:
        choice.content?.trim() ||
        "I'm here to help with your banking. What would you like to do?",
      usedFallback: false,
    };
  } catch (err) {
    console.error("[agent-llm] provider error, using fallback", err);
    return fallbackPlan(lastUser, firstName);
  }
}

export function parseToolCallFromPlan(plan: AgentPlan) {
  return plan.toolCall ?? null;
}
