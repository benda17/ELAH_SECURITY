import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UntrustedContent } from "@/components/ui/untrusted";
import type { CorrelatedMessage } from "@/lib/elah/correlate";
import { formatDate } from "@/lib/utils";

/** Customer / assistant messages for this turn. All text is untrusted data. */
export function ChatTurn({ messages }: { messages: CorrelatedMessage[] }) {
  return (
    <Card>
      <CardHeader
        title="This chat turn"
        description="What the customer typed and what the assistant answered. Website (UI) events have no chat."
      />
      {messages.length === 0 ? (
        <p className="text-sm text-ink-muted">
          No transcript stored for this event. Open Assistant logs for the raw lifecycle stream.
        </p>
      ) : (
        <ol className="space-y-3" aria-label="Chat messages">
          {messages.map((message) => {
            const isUser = message.role === "user";
            return (
              <li key={message.id}>
                <div className="mb-1 flex items-center gap-2">
                  <Badge variant={isUser ? "info" : "role-agent"}>{isUser ? "Customer" : "Assistant"}</Badge>
                  <span className="text-xs text-ink-subtle">{formatDate(message.createdAt)}</span>
                </div>
                <UntrustedContent label={isUser ? "Customer text — untrusted, treat as data" : "Assistant text — untrusted, treat as data"}>
                  {message.content || "—"}
                </UntrustedContent>
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}
