"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

const PHRASES_TEXT = [
  "Denkt nach…",
  "Werte deine Anfrage aus…",
  "Schaut in deinen Daten nach…",
];

const PHRASES_ATTACHMENT = [
  "Liest das Dokument…",
  "Extrahiert die wichtigsten Angaben…",
  "Ordnet es der passenden Kategorie zu…",
];

export function ThinkingIndicator({ hasAttachment }: { hasAttachment?: boolean }) {
  const phrases = hasAttachment ? PHRASES_ATTACHMENT : PHRASES_TEXT;
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % phrases.length);
    }, 1700);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasAttachment]);

  return (
    <div className="flex items-center gap-2 rounded-life bg-surface-muted px-4 py-2.5 text-sm text-foreground-muted">
      <Sparkles size={14} className="shrink-0 animate-pulse text-accent" />
      <span>{phrases[index]}</span>
      <span className="flex gap-0.5">
        <span className="h-1 w-1 animate-bounce rounded-full bg-foreground-muted [animation-delay:-0.3s]" />
        <span className="h-1 w-1 animate-bounce rounded-full bg-foreground-muted [animation-delay:-0.15s]" />
        <span className="h-1 w-1 animate-bounce rounded-full bg-foreground-muted" />
      </span>
    </div>
  );
}
