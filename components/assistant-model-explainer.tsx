import Link from "next/link";
import { ArrowRight, Bot, Shield, Wrench } from "lucide-react";

/** Matches banking app default in lib/agent/system-prompt.ts (OPENAI_MODEL). */
export const ASSISTANT_MODEL_ID =
  process.env.NEXT_PUBLIC_ASSISTANT_MODEL?.trim() || "gpt-4o-mini";

const TOOL_GROUPS = [
  {
    label: "Read",
    tools: [
      "get_account_balance",
      "get_recent_transactions",
      "get_transaction_by_id",
      "get_spending_summary",
      "get_saved_recipients",
      "get_monthly_statement",
    ],
  },
  {
    label: "Money",
    tools: ["create_internal_transfer", "create_external_transfer", "pay_bill"],
  },
  {
    label: "Cards & support",
    tools: ["get_cards", "freeze_card", "unfreeze_card", "create_support_case"],
  },
] as const;

export function AssistantModelBanner({ className }: { className?: string }) {
  return (
    <div
      className={`flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-accent-cyan/25 bg-accent-cyan/5 px-4 py-2.5 text-xs ${className ?? ""}`}
    >
      <span className="inline-flex items-center gap-1.5 font-semibold text-accent-cyan">
        <Bot className="size-3.5" />
        ELAH Assistant
      </span>
      <span className="text-ink-muted">
        Model:{" "}
        <code className="rounded bg-surface-raised px-1.5 py-0.5 font-medium text-ink">
          {ASSISTANT_MODEL_ID}
        </code>
      </span>
      <span className="hidden text-ink-dim sm:inline">
        OpenAI function calling · policy-gated tools · rules fallback when no API key
      </span>
      <Link
        href="#ai-assistant-model"
        className="ml-auto font-medium text-accent-cyan hover:underline"
      >
        Architecture details ↓
      </Link>
    </div>
  );
}

export function AssistantModelExplainer() {
  return (
    <div id="ai-assistant-model" className="panel mb-4 scroll-mt-24">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="panel-title">How the assistant works</div>
          <p className="mt-1 max-w-3xl text-sm text-ink-muted">
            ELAH Assistant is an in-app banking agent: customers chat in natural
            language, the model plans a response, and only whitelisted backend
            tools can touch real account data. Every turn is logged for the charts
            below.
          </p>
        </div>
        <Link
          href="/banking/intent-matrix"
          className="inline-flex items-center gap-1.5 rounded-lg border border-accent-cyan/30 bg-accent-cyan/5 px-3 py-1.5 text-xs font-medium text-accent-cyan transition hover:bg-accent-cyan/10"
        >
          Human Intent Matrix
          <ArrowRight className="size-3.5" />
        </Link>
      </div>

      <div className="grid gap-4 text-xs leading-relaxed text-ink-muted md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-accent-cyan/20 bg-accent-cyan/5 p-4">
          <div className="mb-2 flex items-center gap-2">
            <Bot className="size-4 text-accent-cyan" />
            <h3 className="text-sm font-semibold text-ink">Language model</h3>
          </div>
          <p>
            Primary planner:{" "}
            <code className="text-ink">{ASSISTANT_MODEL_ID}</code> via OpenAI
            function calling (<code className="text-ink">temperature 0.2</code>
            ). The model receives a fixed banking system prompt and may choose
            one tool per turn — it cannot invent balances, recipients, or
            confirmation states.
          </p>
          <p className="mt-2">
            If <code className="text-ink">OPENAI_API_KEY</code> is unset or the
            provider fails, a{" "}
            <strong className="text-ink">rules-based fallback planner</strong>{" "}
            maps keywords to the same tool set so seed scripts and demos keep
            working.
          </p>
        </div>

        <div className="rounded-xl border border-surface-border bg-surface-subtle/40 p-4">
          <div className="mb-2 flex items-center gap-2">
            <Wrench className="size-4 text-accent-amber" />
            <h3 className="text-sm font-semibold text-ink">Tool layer</h3>
          </div>
          <p className="mb-3">
            Thirteen backend tools are registered in a closed allow-list. Each tool
            re-checks customer ownership inside{" "}
            <code className="text-ink">execute</code> — the LLM never talks to
            the database directly.
          </p>
          <ul className="space-y-2">
            {TOOL_GROUPS.map(({ label, tools }) => (
              <li key={label}>
                <span className="font-medium text-ink">{label}</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {tools.map((t) => (
                    <code
                      key={t}
                      className="rounded bg-surface-raised px-1.5 py-0.5 text-[10px] text-ink-dim"
                    >
                      {t}
                    </code>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-surface-border bg-surface-subtle/40 p-4">
          <div className="mb-2 flex items-center gap-2">
            <Shield className="size-4 text-accent-rose" />
            <h3 className="text-sm font-semibold text-ink">Policy &amp; safety</h3>
          </div>
          <ul className="space-y-2">
            <li>
              <strong className="text-ink">Model-independent gates</strong> run
              before and after planning: prompt-injection patterns, tier limits,
              amount caps, and argument sanitization.
            </li>
            <li>
              Sensitive actions (transfers, bill pay, card freeze, exports) enter
              a{" "}
              <strong className="text-ink">pending confirmation</strong> state
              until the customer explicitly confirms or cancels.
            </li>
            <li>
              Blocked or suspicious requests are refused without calling tools;
              outcomes appear in{" "}
              <strong className="text-ink">Security signals</strong> below.
            </li>
          </ul>
        </div>

        <div className="rounded-xl border border-surface-border bg-surface-subtle/40 p-4 md:col-span-2">
          <h3 className="mb-2 text-sm font-semibold text-ink">
            Intent classification (Human Intent Matrix)
          </h3>
          <p>
            Each user message is classified into three vectors —{" "}
            <strong className="text-ink">Human intention</strong> (awareness,
            control, money movement),{" "}
            <strong className="text-ink">Banking operation</strong> (read vs
            external payout), and{" "}
            <strong className="text-ink">Security risk</strong> (privacy,
            irreversibility, anomaly). These collapse to a 3D point (agency ×
            financial risk × urgency) used on the{" "}
            <Link href="/banking/intent-matrix" className="text-accent-cyan hover:underline">
              Intent Matrix
            </Link>{" "}
            page. Classification runs in the orchestrator alongside tool and
            policy outcomes.
          </p>
        </div>

        <div className="rounded-xl border border-surface-border bg-surface-subtle/40 p-4">
          <h3 className="mb-2 text-sm font-semibold text-ink">
            Reading this section
          </h3>
          <ul className="space-y-1.5">
            <li>
              <strong className="text-ink">Events</strong> — messages, tool
              calls, confirmations, policy blocks
            </li>
            <li>
              <strong className="text-ink">Policy decisions</strong> — allow,
              needs confirmation, deny
            </li>
            <li>
              <strong className="text-ink">Security signals</strong> — injection
              attempts, unauthorized access, errors
            </li>
            <li>
              <strong className="text-ink">Per customer</strong> — usage volume
              across simulated users
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
