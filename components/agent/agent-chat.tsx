"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bot, Loader2, Send, ShieldCheck, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AgentChatResponseBody } from "@/lib/agent/types";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  pending?: boolean;
  toolName?: string | null;
};

export function AgentChat({
  userName,
  initialConversationId,
}: {
  userName: string;
  initialConversationId?: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `Hello ${userName.split(" ")[0]}. I'm your ELAH banking assistant. I can check balances, review transactions, move money, pay bills, manage cards, and download statements. How can I help you today?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>(
    initialConversationId,
  );
  const [pendingSummary, setPendingSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, pendingSummary]);

  useEffect(() => {
    if (!initialConversationId) return;
    fetch(`/api/agent/chat?conversationId=${initialConversationId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && Array.isArray(data.messages) && data.messages.length > 0) {
          setMessages(
            data.messages
              .filter((m: { role: string }) => m.role !== "system_internal")
              .map((m: { id: string; role: string; content: string; toolName?: string }) => ({
                id: m.id,
                role: m.role as "user" | "assistant",
                content: m.content,
                toolName: m.toolName,
              })),
          );
          setConversationId(initialConversationId);
        }
      })
      .catch(() => undefined);
  }, [initialConversationId]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      setError(null);
      setInput("");
      setLoading(true);
      setMessages((prev) => [
        ...prev,
        { id: `user-${Date.now()}`, role: "user", content: trimmed },
      ]);

      try {
        const res = await fetch("/api/agent/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: trimmed,
            conversationId,
          }),
        });
        const data = (await res.json()) as AgentChatResponseBody & { error?: string };
        if (!res.ok || !data.ok) {
          throw new Error(data.error ?? "Request failed");
        }
        setConversationId(data.conversationId);
        setPendingSummary(data.pendingAction?.summary ?? null);
        setMessages((prev) => [
          ...prev,
          {
            id: data.messageId,
            role: "assistant",
            content: data.reply,
            toolName: data.toolCalls[0]?.name,
          },
        ]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        setLoading(false);
        inputRef.current?.focus();
      }
    },
    [conversationId, loading],
  );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void sendMessage(input);
  };

  return (
    <div className="flex h-[32rem] flex-col">
      <div className="flex items-center gap-2 border-b border-line px-5 py-3 text-xs text-ink-muted">
        <ShieldCheck className="size-3.5 text-accent-emerald" />
        <span>Sensitive actions require your explicit confirmation before proceeding.</span>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn(
              "flex gap-2.5",
              m.role === "user" ? "flex-row-reverse" : "flex-row",
            )}
          >
            <div
              className={cn(
                "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md border border-line bg-bg-elevated/60",
                m.role === "user" ? "text-accent-cyan" : "text-accent-gold",
              )}
            >
              {m.role === "user" ? (
                <User className="size-3.5" />
              ) : (
                <Bot className="size-3.5" />
              )}
            </div>
            <div
              className={cn(
                "max-w-[85%] rounded-lg px-3.5 py-2.5 text-sm leading-relaxed",
                m.role === "user"
                  ? "border border-line bg-bg-elevated/80 text-ink"
                  : "border border-line bg-bg-base/50 text-ink",
              )}
            >
              <p className="whitespace-pre-wrap">{m.content}</p>
              {m.toolName ? (
                <p className="mt-1.5 text-[10px] uppercase tracking-wider text-ink-dim">
                  via {m.toolName.replace(/_/g, " ")}
                </p>
              ) : null}
            </div>
          </div>
        ))}

        {loading ? (
          <div className="flex items-center gap-2 px-9 text-sm text-ink-muted">
            <Loader2 className="size-4 animate-spin text-accent-gold" />
            Assistant is working…
          </div>
        ) : null}

        {pendingSummary ? (
          <div className="mx-9 rounded-lg border border-accent-amber/30 bg-accent-amber/5 px-4 py-3 text-sm text-ink">
            <p className="font-medium text-accent-amber">Confirmation required</p>
            <p className="mt-1 text-ink-muted">{pendingSummary}</p>
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="success" onClick={() => void sendMessage("Confirm")}>
                Confirm
              </Button>
              <Button size="sm" variant="ghost" onClick={() => void sendMessage("Cancel")}>
                Cancel
              </Button>
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="mx-9 rounded-lg border border-accent-rose/30 bg-accent-rose/10 px-3 py-2 text-sm text-accent-rose">
            {error}
          </div>
        ) : null}

        <div ref={bottomRef} />
      </div>

      <form onSubmit={onSubmit} className="border-t border-line px-5 py-4">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void sendMessage(input);
              }
            }}
            rows={2}
            placeholder='Try "Show me my balance" or "Transfer 250 shekels to Daniel"'
            className="min-h-[44px] flex-1 resize-none rounded-lg border border-line bg-bg-elevated/60 px-3 py-2.5 text-sm text-ink placeholder:text-ink-dim focus:border-accent-gold/40 focus:outline-none focus:ring-1 focus:ring-accent-gold/20"
            disabled={loading}
          />
          <Button type="submit" disabled={loading || !input.trim()} className="self-end">
            <Send className="size-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
