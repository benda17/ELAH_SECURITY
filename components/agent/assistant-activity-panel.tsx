import Link from "next/link";
import { ArrowRight, Bot, MessageSquare, ShieldAlert } from "lucide-react";
import { formatAgentEventLabel, agentEventBadgeVariant } from "@/lib/agent/display";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

export type AssistantConversationSummary = {
  id: string;
  title: string | null;
  status: string;
  messageCount: number;
  updatedAt: Date;
  lastMessage: string | null;
};

export type AssistantEventSummary = {
  id: string;
  eventType: string;
  toolName: string | null;
  userMessage: string | null;
  resultSummary: string | null;
  timestamp: Date;
};

export function AssistantActivityPanel({
  conversations,
  events,
}: {
  conversations: AssistantConversationSummary[];
  events: AssistantEventSummary[];
}) {
  const hasActivity = conversations.length > 0 || events.length > 0;

  return (
    <Card>
      <CardHeader
        title={
          <span className="inline-flex items-center gap-2">
            <Bot className="size-4 text-accent-gold" />
            AI Assistant activity
          </span>
        }
        description="Recent conversations and logged actions from your in-app assistant."
        action={
          <Link href="/assistant">
            <Button variant="secondary" size="sm">
              Open assistant <ArrowRight className="size-3.5" />
            </Button>
          </Link>
        }
      />

      {!hasActivity ? (
        <div className="rounded-lg border border-dashed border-line bg-bg-elevated/30 px-4 py-8 text-center">
          <Bot className="mx-auto size-8 text-accent-gold/70" />
          <p className="mt-3 text-sm font-medium text-ink">
            No assistant activity yet
          </p>
          <p className="mt-1 text-xs text-ink-muted">
            Ask about balances, transactions, transfers, bills, or cards — activity
            will appear here.
          </p>
          <Link href="/assistant" className="mt-4 inline-block">
            <Button size="sm">Start a conversation</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <h4 className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-ink-subtle">
              <MessageSquare className="size-3.5" />
              Recent conversations
            </h4>
            {conversations.length === 0 ? (
              <p className="text-sm text-ink-muted">No conversations yet.</p>
            ) : (
              <ul className="divide-y divide-line">
                {conversations.map((c) => (
                  <li key={c.id} className="py-3">
                    <Link
                      href={`/assistant?conversationId=${c.id}`}
                      className="group block rounded-lg transition-colors hover:bg-bg-elevated/40 -mx-2 px-2 py-1"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-ink group-hover:text-accent-gold">
                            {c.title ?? "Untitled conversation"}
                          </div>
                          {c.lastMessage ? (
                            <p className="mt-0.5 line-clamp-2 text-xs text-ink-muted">
                              {c.lastMessage}
                            </p>
                          ) : null}
                          <div className="mt-1 text-[11px] text-ink-subtle">
                            {c.messageCount} message{c.messageCount === 1 ? "" : "s"} ·{" "}
                            {formatDate(c.updatedAt)}
                          </div>
                        </div>
                        {c.status === "flagged" ? (
                          <Badge variant="warning">flagged</Badge>
                        ) : null}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h4 className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-ink-subtle">
              <ShieldAlert className="size-3.5" />
              Activity log
            </h4>
            {events.length === 0 ? (
              <p className="text-sm text-ink-muted">No logged events yet.</p>
            ) : (
              <ul className="divide-y divide-line">
                {events.map((e) => (
                  <li key={e.id} className="flex items-start justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-ink">
                        {formatAgentEventLabel(e.eventType, e.toolName)}
                      </div>
                      {(e.userMessage || e.resultSummary) && (
                        <p className="mt-0.5 line-clamp-2 text-xs text-ink-muted">
                          {e.resultSummary ?? e.userMessage}
                        </p>
                      )}
                      <div className="mt-1 text-[11px] text-ink-subtle">
                        {formatDate(e.timestamp)}
                      </div>
                    </div>
                    <Badge variant={agentEventBadgeVariant(e.eventType)}>
                      {e.eventType.replace(/_/g, " ")}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
