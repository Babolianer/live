import { requireSessionUser } from "@/lib/auth";
import { listMessages } from "@/lib/ai-messages";
import { Chat } from "@/components/ai/chat";

export default async function AiPage() {
  const user = await requireSessionUser();
  const messages = await listMessages(user.id);

  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col">
      <div className="mb-2">
        <h1 className="font-heading text-2xl font-semibold">Ask LIFE</h1>
        <p className="text-sm text-foreground-muted">
          Deine zentrale Anlaufstelle für Fragen zu Dokumenten und Verträgen.
        </p>
      </div>
      <Chat initialMessages={messages} />
    </div>
  );
}
