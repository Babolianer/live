"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RefreshPricesButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleClick() {
    setPending(true);
    setMessage(null);
    try {
      const res = await fetch("/api/wealth/prices/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "all" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "Kurse konnten nicht aktualisiert werden.");
      } else {
        const failed = data.results.filter((r: { ok: boolean }) => !r.ok).length;
        const ok = data.results.length - failed;
        setMessage(
          data.results.length === 0
            ? "Keine Assets mit Symbol zum Aktualisieren gefunden."
            : `${ok} Kurs(e) aktualisiert${failed > 0 ? `, ${failed} fehlgeschlagen` : ""}.`
        );
        router.refresh();
      }
    } catch {
      setMessage("Kurse konnten nicht aktualisiert werden.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Button variant="secondary" onClick={handleClick} disabled={pending}>
        <RefreshCw size={16} className={pending ? "animate-spin" : undefined} />
        {pending ? "Aktualisiere…" : "Kurse aktualisieren"}
      </Button>
      {message && <p className="text-xs text-foreground-muted">{message}</p>}
    </div>
  );
}
