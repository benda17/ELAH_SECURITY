import { Bot, Gauge, Landmark, MessageSquare, PlayCircle } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TR, TH, TD } from "@/components/ui/table";
import { UntrustedContent } from "@/components/ui/untrusted";
import { formatAgentEventLabel, agentEventBadgeVariant } from "@/lib/agent/display";
import type { CorrelatedHop } from "@/lib/elah/correlate";
import { cn, formatDate } from "@/lib/utils";
import type { ActionChainStage, ActionChainStep, ActionChainTone } from "./action-chain";

const STAGE_ICON: Record<ActionChainStage, React.ComponentType<{ className?: string }>> = {
  request: MessageSquare,
  plan: Bot,
  policy: Landmark,
  score: Gauge,
  outcome: PlayCircle,
};

const TONE_RING: Record<ActionChainTone, string> = {
  neutral: "border-line text-ink-muted",
  positive: "border-accent-emerald/50 text-accent-emerald",
  negative: "border-accent-rose/50 text-accent-rose",
  warning: "border-accent-amber/50 text-accent-amber",
};

const TONE_BADGE: Record<ActionChainTone, React.ComponentProps<typeof Badge>["variant"]> = {
  neutral: "default",
  positive: "status-approved",
  negative: "status-rejected",
  warning: "warning",
};

function StepItem({ step, last }: { step: ActionChainStep; last: boolean }) {
  const Icon = STAGE_ICON[step.stage];
  const missing = step.status === "missing";
  return (
    <li className="relative flex gap-4 pb-6 last:pb-0">
      {!last ? <span aria-hidden className="absolute left-4 top-9 h-[calc(100%-2.25rem)] w-px bg-line" /> : null}
      <span
        aria-hidden
        className={cn(
          "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border bg-bg-elevated",
          TONE_RING[step.tone],
          missing && "border-dashed opacity-60",
        )}
      >
        <Icon className="size-4" />
      </span>
      <div className={cn("min-w-0 flex-1", missing && "opacity-70")}>
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="text-sm font-semibold text-ink">{step.title}</h4>
          <Badge variant={TONE_BADGE[step.tone]}>{step.actor}</Badge>
          {missing ? <Badge variant="default">not recorded</Badge> : null}
          {step.at ? <span className="text-xs text-ink-subtle">{formatDate(step.at)}</span> : null}
        </div>
        {step.facts.length > 0 ? (
          <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-1 text-xs sm:grid-cols-2">
            {step.facts.map((fact) => (
              <div key={fact.label} className="flex min-w-0 gap-2">
                <dt className="shrink-0 text-ink-subtle">{fact.label}:</dt>
                <dd className="min-w-0 break-words font-mono text-ink">{fact.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        {step.untrusted ? (
          <UntrustedContent label={step.untrusted.label} className="mt-2">
            {step.untrusted.text}
          </UntrustedContent>
        ) : null}
        {step.note ? <p className="mt-2 text-xs text-ink-muted">{step.note}</p> : null}
        {step.hopTypes.length > 0 ? (
          <p className="mt-1 text-[11px] text-ink-subtle">Backed by hops: {step.hopTypes.join(", ")}</p>
        ) : null}
      </div>
    </li>
  );
}

export function ActionChainTimeline({
  steps,
  hops,
  correlationAvailable,
}: {
  steps: ActionChainStep[];
  hops: CorrelatedHop[];
  /** false when the event has no conversation to correlate (e.g. UI events). */
  correlationAvailable: boolean;
}) {
  return (
    <Card>
      <CardHeader
        title="Action chain"
        description="Customer request → planned tool → bank policy → ELAH score → outcome. Bank policy made the allow / deny / confirm decision; ELAH only scored intent before the tool."
      />
      <ol aria-label="Action chain steps">
        {steps.map((step, index) => (
          <StepItem key={step.stage} step={step} last={index === steps.length - 1} />
        ))}
      </ol>

      <details className="mt-6 group" open={hops.length > 0 && hops.length <= 12}>
        <summary className="cursor-pointer text-sm font-medium text-ink-muted hover:text-ink">
          Correlated hops ({hops.length})
        </summary>
        <p className="mt-2 text-xs text-ink-subtle">
          Assistant lifecycle rows for the same conversation / message. Operational, not ElahEvents.
        </p>
        {hops.length === 0 ? (
          <p className="mt-2 text-sm text-ink-muted">
            {correlationAvailable
              ? "No correlated assistant hops were found for this turn."
              : "This event has no conversation, so there are no assistant hops to correlate."}
          </p>
        ) : (
          <Table className="mt-3">
            <THead>
              <TR>
                <TH>Time</TH>
                <TH>Hop</TH>
                <TH className="hidden sm:table-cell">Tool</TH>
                <TH>Bank policy</TH>
                <TH className="hidden sm:table-cell">Seq</TH>
              </TR>
            </THead>
            <tbody>
              {hops.map((hop, index) => (
                <TR key={`${hop.eventType}-${hop.timestamp}-${index}`}>
                  <TD className="whitespace-nowrap text-ink-muted">{formatDate(hop.timestamp)}</TD>
                  <TD>
                    <Badge variant={agentEventBadgeVariant(hop.eventType)}>
                      {formatAgentEventLabel(hop.eventType, hop.toolName)}
                    </Badge>
                    {hop.resultSummary || hop.assistantMessage ? (
                      <UntrustedContent
                        label="Hop text — untrusted"
                        className="mt-1 max-h-24 max-w-md overflow-y-auto p-2"
                      >
                        {hop.resultSummary ?? hop.assistantMessage}
                      </UntrustedContent>
                    ) : null}
                  </TD>
                  <TD className="hidden font-mono text-xs text-ink-muted sm:table-cell">{hop.toolName ?? "—"}</TD>
                  <TD className="text-ink-muted">{hop.policyDecision ?? "—"}</TD>
                  <TD className="hidden text-ink-muted sm:table-cell">{hop.sequence != null ? hop.sequence : "—"}</TD>
                </TR>
              ))}
            </tbody>
          </Table>
        )}
      </details>
    </Card>
  );
}
