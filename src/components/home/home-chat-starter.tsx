"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { createConversationAction } from "@/lib/actions/ai-conversation-actions";

export function HomeChatStarter() {
  const [value, setValue] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function start() {
    const text = value.trim();
    if (!text || isPending) return;
    startTransition(async () => {
      const id = await createConversationAction();
      router.push(`/ai/${id}?q=${encodeURIComponent(text)}`);
    });
  }

  return (
    <Card className="bg-accent text-accent-foreground">
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15">
          <Sparkles size={22} />
        </div>
        <div>
          <p className="font-heading font-semibold">Ask LIFE</p>
          <p className="text-sm opacity-90">Frag mich etwas oder häng ein Dokument an.</p>
        </div>
      </div>
      <div className="flex items-center gap-2 rounded-life bg-white/10 p-1.5">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              start();
            }
          }}
          placeholder="z. B. „Leg mir meinen Stromvertrag an“"
          className="flex-1 bg-transparent px-3 py-2 text-sm text-accent-foreground placeholder-accent-foreground/60 outline-none"
        />
        <button
          onClick={start}
          disabled={isPending || !value.trim()}
          aria-label="Chat starten"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-accent-foreground disabled:opacity-40"
        >
          <ArrowUp size={18} />
        </button>
      </div>
    </Card>
  );
}
