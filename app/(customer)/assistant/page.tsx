import { Bot } from "lucide-react";
import { requireCustomer } from "@/lib/auth/guards";
import { PageShell, SectionHeader } from "@/components/layout/page-shell";
import { Card, CardHeader } from "@/components/ui/card";
import { AgentChat } from "@/components/agent/agent-chat";

export default async function AssistantPage({
  searchParams,
}: {
  searchParams: { conversationId?: string };
}) {
  const user = await requireCustomer();

  return (
    <PageShell>
      <SectionHeader
        title="AI Assistant"
        description="Ask questions and perform banking tasks through the secure in-app assistant."
      />

      <Card className="overflow-hidden p-0">
        <CardHeader
          className="mb-0 border-b border-line px-6 pb-4 pt-6"
          title={
            <span className="inline-flex items-center gap-2">
              <Bot className="size-4 text-accent-gold" />
              Chat with ELAH Assistant
            </span>
          }
          description="Balances, transactions, transfers, bills, cards, and statements."
        />
        <AgentChat
          userName={user.name}
          initialConversationId={searchParams.conversationId}
        />
      </Card>
    </PageShell>
  );
}
