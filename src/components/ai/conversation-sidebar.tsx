"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTransition } from "react";
import { Plus, Trash2, MessageSquare } from "lucide-react";
import clsx from "clsx";
import {
  createConversationAction,
  deleteConversationAction,
} from "@/lib/actions/ai-conversation-actions";
import type { ConversationRow } from "@/lib/ai-conversations";

export function ConversationSidebar({
  conversations,
  activeId,
}: {
  conversations: ConversationRow[];
  activeId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function newChat() {
    startTransition(async () => {
      const id = await createConversationAction();
      router.push(`/ai/${id}`);
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      await deleteConversationAction(id);
      if (id === activeId) {
        const next = conversations.find((c) => c.id !== id);
        router.push(next ? `/ai/${next.id}` : "/ai");
      } else {
        router.refresh();
      }
    });
  }

  return (
    <aside className="sticky top-8 hidden h-[calc(100vh-4rem)] w-64 shrink-0 flex-col gap-3 border-r border-border py-1 pr-4 md:flex">
      <button
        onClick={newChat}
        disabled={isPending}
        className="flex items-center justify-center gap-2 rounded-life bg-accent px-3.5 py-2.5 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50"
      >
        <Plus size={16} /> Neuer Chat
      </button>

      <div className="flex flex-1 flex-col gap-1 overflow-y-auto">
        {conversations.length === 0 && (
          <p className="px-2 py-4 text-center text-sm text-foreground-muted">
            Noch keine Chats.
          </p>
        )}
        {conversations.map((c) => (
          <div
            key={c.id}
            className={clsx(
              "group flex items-center gap-2 rounded-life px-3 py-2.5 text-sm",
              c.id === activeId
                ? "bg-accent/15 text-accent"
                : "text-foreground-muted hover:bg-surface-muted hover:text-foreground"
            )}
          >
            <MessageSquare size={15} className="shrink-0" />
            <Link href={`/ai/${c.id}`} className="min-w-0 flex-1 truncate font-medium">
              {c.title}
            </Link>
            <button
              aria-label="Chat löschen"
              disabled={isPending}
              onClick={() => remove(c.id)}
              className="shrink-0 rounded-md p-1 opacity-0 hover:bg-surface hover:text-danger group-hover:opacity-100"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </aside>
  );
}
