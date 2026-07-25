import { notFound } from "next/navigation";
import { requireSessionUser } from "@/lib/auth";
import { listConversations, getConversation } from "@/lib/ai-conversations";
import { listMessages } from "@/lib/ai-messages";
import { Chat } from "@/components/ai/chat";
import { ConversationSidebar } from "@/components/ai/conversation-sidebar";

export default async function AiConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const user = await requireSessionUser();
  const { conversationId } = await params;

  const conversation = await getConversation(conversationId, user.id);
  if (!conversation) notFound();

  const [conversations, messages] = await Promise.all([
    listConversations(user.id),
    listMessages(conversationId),
  ]);

  return (
    <div className="flex h-full gap-6">
      <ConversationSidebar conversations={conversations} activeId={conversationId} />
      <div className="mx-auto flex h-full w-full max-w-2xl flex-col">
        <div className="mb-2">
          <h1 className="font-heading text-2xl font-semibold">Ask LIFE</h1>
          <p className="text-sm text-foreground-muted">
            Deine zentrale Anlaufstelle für Fragen zu Dokumenten, Verträgen und Zielen.
          </p>
        </div>
        <Chat key={conversationId} conversationId={conversationId} initialMessages={messages} />
      </div>
    </div>
  );
}
