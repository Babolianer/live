"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, ArrowUp } from "lucide-react";
import clsx from "clsx";
import type { AiMessageRow } from "@/lib/ai-messages";

type Message = { role: "user" | "assistant"; content: string };

export function Chat({ initialMessages }: { initialMessages: AiMessageRow[] }) {
  const [messages, setMessages] = useState<Message[]>(
    initialMessages.map((m) => ({ role: m.role, content: m.content }))
  );
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;

    setInput("");
    setSending(true);
    setMessages((prev) => [...prev, { role: "user", content: text }, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (!res.body) throw new Error("Keine Antwort erhalten.");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = {
            role: "assistant",
            content: next[next.length - 1].content + chunk,
          };
          return next;
        });
      }
    } catch {
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = {
          role: "assistant",
          content: "⚠️ Die Anfrage ist fehlgeschlagen. Bitte versuche es erneut.",
        };
        return next;
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col md:h-[calc(100vh-4rem)]">
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto pb-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-foreground-muted">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/15 text-accent">
              <Sparkles size={24} />
            </div>
            <p className="max-w-xs text-sm">
              Frag LIFE etwas zu deinen Dokumenten oder Verträgen — z. B. &quot;Wann läuft
              meine Versicherung ab?&quot;
            </p>
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={clsx("flex", m.role === "user" ? "justify-end" : "justify-start")}
          >
            <div
              className={clsx(
                "max-w-[80%] whitespace-pre-wrap rounded-life px-4 py-2.5 text-sm",
                m.role === "user"
                  ? "bg-accent text-accent-foreground"
                  : "bg-surface-muted text-foreground"
              )}
            >
              {m.content || (sending && i === messages.length - 1 ? "…" : "")}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 rounded-life border border-border bg-surface p-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Frag LIFE…"
          className="flex-1 bg-transparent px-2 py-2 text-sm outline-none"
        />
        <button
          onClick={send}
          disabled={sending || !input.trim()}
          aria-label="Senden"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground disabled:opacity-40"
        >
          <ArrowUp size={18} />
        </button>
      </div>
    </div>
  );
}
