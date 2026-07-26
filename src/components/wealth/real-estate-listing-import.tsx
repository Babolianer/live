"use client";

import { useState } from "react";
import { Upload, Link as LinkIcon, Loader2 } from "lucide-react";
import type { ExtendedAnalyzedListing } from "@/lib/listing-extraction";

export type RealEstateDetailsPayload = {
  sourceUrl?: string;
  livingArea?: number;
  landArea?: number;
  rooms?: number;
  buildYear?: number;
  energyClass?: string;
  condition?: string;
};

type Props = {
  onApply: (data: { name?: string; purchasePrice?: number; notes?: string; details: RealEstateDetailsPayload }) => void;
};

function summarizeNotes(data: ExtendedAnalyzedListing): string {
  const parts: string[] = [];
  if (data.livingArea) parts.push(`Wohnfläche: ${data.livingArea} m²`);
  if (data.landArea) parts.push(`Grundstück: ${data.landArea} m²`);
  if (data.rooms) parts.push(`Zimmer: ${data.rooms}`);
  if (data.buildYear) parts.push(`Baujahr: ${data.buildYear}`);
  if (data.energyClass) parts.push(`Energieklasse: ${data.energyClass}`);
  if (data.condition) parts.push(`Zustand: ${data.condition}`);
  return parts.join(" · ");
}

/**
 * Optional prefill helper shown on the Immobilie-Asset-Formular — analysiert
 * ein hochgeladenes Exposé (PDF/Bild) oder eine Anzeigen-URL und übernimmt
 * Name/Kaufpreis/Eckdaten in das Formular, statt sie manuell abzutippen.
 */
export function RealEstateListingImport({ onApply }: Props) {
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleResult(res: Response, sourceUrl?: string) {
    const json = await res.json().catch(() => null);
    if (!json?.success) {
      setMessage({ type: "error", text: json?.error ?? "Analyse fehlgeschlagen." });
      return;
    }
    const data = json.data as ExtendedAnalyzedListing;
    onApply({
      name: data.name,
      purchasePrice: data.purchasePrice,
      notes: summarizeNotes(data) || undefined,
      details: {
        sourceUrl,
        livingArea: data.livingArea,
        landArea: data.landArea,
        rooms: data.rooms,
        buildYear: data.buildYear,
        energyClass: data.energyClass,
        condition: data.condition,
      },
    });
    const missing = (json.missingFields as string[]) ?? [];
    setMessage({
      type: "success",
      text: `Erkannt: ${(json.foundFields as string[]).join(", ")}${missing.length ? ` — fehlt: ${missing.join(", ")}` : ""}`,
    });
  }

  async function handleFile(file: File) {
    setBusy(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/wealth/real-estate/analyze-document", { method: "POST", body: formData });
      await handleResult(res);
    } catch {
      setMessage({ type: "error", text: "Analyse fehlgeschlagen." });
    } finally {
      setBusy(false);
    }
  }

  async function handleUrl() {
    if (!url.trim()) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/wealth/real-estate/analyze-url", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      await handleResult(res, url.trim());
    } catch {
      setMessage({ type: "error", text: "Analyse fehlgeschlagen." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-life border border-dashed border-border p-3">
      <p className="mb-2 text-sm font-medium">Exposé analysieren (optional)</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-life border border-border bg-surface-muted px-3 py-2 text-sm text-foreground-muted hover:bg-surface-muted/70">
          <Upload size={14} />
          PDF/Bild hochladen
          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/webp"
            className="hidden"
            disabled={busy}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
              e.target.value = "";
            }}
          />
        </label>
        <div className="flex flex-1 gap-2">
          <input
            type="url"
            placeholder="Link zum Exposé"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full rounded-life border border-border bg-surface-muted px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <button
            type="button"
            disabled={busy || !url.trim()}
            onClick={handleUrl}
            className="shrink-0 rounded-life border border-border px-3 py-2 text-sm text-foreground-muted hover:bg-surface-muted disabled:opacity-50"
          >
            <LinkIcon size={14} />
          </button>
        </div>
      </div>
      {busy && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-foreground-muted">
          <Loader2 size={12} className="animate-spin" /> Analysiere…
        </p>
      )}
      {message && <p className={`mt-2 text-xs ${message.type === "error" ? "text-danger" : "text-success"}`}>{message.text}</p>}
    </div>
  );
}
