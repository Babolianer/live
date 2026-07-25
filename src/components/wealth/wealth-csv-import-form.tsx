"use client";

import { useMemo, useState, useTransition } from "react";
import { Upload, FileSpreadsheet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { parseBrokerCsv, type ParsedImportRow } from "@/lib/wealth-csv-import";
import { applyBrokerCsvImportAction, type BrokerImportSummary } from "@/lib/actions/wealth-import-actions";
import type { WealthGroupRow } from "@/lib/wealth-groups";
import type { WealthAssetRow } from "@/lib/wealth-assets";

type Props = {
  groups: WealthGroupRow[];
  assets: WealthAssetRow[];
};

const inputClass = "w-full rounded-life border border-border bg-surface-muted px-3.5 py-2.5 text-sm outline-none focus:border-accent";
const labelClass = "mb-1.5 block text-sm font-medium";

export function WealthCsvImportForm({ groups, assets }: Props) {
  const [open, setOpen] = useState(false);
  const [groupId, setGroupId] = useState(groups[0]?.id ?? "");
  const [parsed, setParsed] = useState<{ rows: ParsedImportRow[]; errors: string[] } | null>(null);
  const [fileName, setFileName] = useState("");
  const [summary, setSummary] = useState<BrokerImportSummary | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const groupAssets = useMemo(() => assets.filter((a) => a.group_id === groupId), [assets, groupId]);
  const knownIsins = useMemo(
    () => new Set(groupAssets.filter((a) => a.isin).map((a) => a.isin!.trim().toUpperCase())),
    [groupAssets]
  );
  const knownNames = useMemo(() => new Set(groupAssets.map((a) => a.name.trim().toLowerCase())), [groupAssets]);

  function reset() {
    setParsed(null);
    setFileName("");
    setSummary(null);
    setActionError(null);
  }

  async function handleFile(file: File) {
    setSummary(null);
    setActionError(null);
    setFileName(file.name);
    const text = await file.text();
    setParsed(parseBrokerCsv(text));
  }

  function handleImport() {
    if (!parsed || parsed.rows.length === 0 || !groupId) return;
    setActionError(null);
    startTransition(async () => {
      const result = await applyBrokerCsvImportAction(groupId, parsed.rows);
      if (!result) return;
      if ("error" in result) setActionError(result.error);
      else {
        setSummary(result.summary);
        setParsed(null);
      }
    });
  }

  if (!open) {
    return (
      <Button variant="secondary" className="w-full" onClick={() => setOpen(true)}>
        <FileSpreadsheet size={16} /> CSV-Transaktionen importieren
      </Button>
    );
  }

  return (
    <Card className="flex flex-col gap-4">
      <div>
        <p className="font-heading font-semibold">Broker-CSV importieren</p>
        <p className="text-sm text-foreground-muted">
          Transaktions-Export deines Brokers (z. B. Scalable Capital) hochladen — Spalten für Datum, ISIN/Name, Stückzahl und
          Kurs/Betrag werden automatisch erkannt.
        </p>
      </div>

      <div>
        <label className={labelClass} htmlFor="import-group">
          Ziel-Gruppe
        </label>
        <select
          id="import-group"
          value={groupId}
          onChange={(e) => {
            setGroupId(e.target.value);
            reset();
          }}
          className={inputClass}
        >
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </div>

      <label className="flex cursor-pointer items-center justify-center gap-1.5 rounded-life border border-dashed border-border py-3 text-sm text-foreground-muted hover:bg-surface-muted">
        <Upload size={14} />
        {fileName || "CSV-Datei auswählen"}
        <input
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
            e.target.value = "";
          }}
        />
      </label>

      {parsed && (
        <div className="flex flex-col gap-2">
          {parsed.errors.length > 0 && (
            <div className="rounded-life bg-warning/10 px-3.5 py-2.5 text-xs text-warning">
              {parsed.errors.slice(0, 5).map((e, i) => (
                <p key={i}>{e}</p>
              ))}
              {parsed.errors.length > 5 && <p>… und {parsed.errors.length - 5} weitere.</p>}
            </div>
          )}

          {parsed.rows.length > 0 ? (
            <>
              <div className="max-h-64 overflow-y-auto rounded-life border border-border">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-surface-muted text-foreground-muted">
                    <tr>
                      <th className="px-2 py-1.5 text-left">Datum</th>
                      <th className="px-2 py-1.5 text-left">Name</th>
                      <th className="px-2 py-1.5 text-left">Typ</th>
                      <th className="px-2 py-1.5 text-right">Menge</th>
                      <th className="px-2 py-1.5 text-right">Kurs</th>
                      <th className="px-2 py-1.5 text-left">Zuordnung</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {parsed.rows.map((r) => {
                      const matched =
                        (r.isin && knownIsins.has(r.isin.trim().toUpperCase())) || knownNames.has(r.name.trim().toLowerCase());
                      return (
                        <tr key={r.rowNumber}>
                          <td className="px-2 py-1.5">{r.dateIso.slice(0, 10)}</td>
                          <td className="max-w-[10rem] truncate px-2 py-1.5">{r.name}</td>
                          <td className="px-2 py-1.5">{r.type === "BUY" ? "Kauf" : "Verkauf"}</td>
                          <td className="px-2 py-1.5 text-right">{r.quantity}</td>
                          <td className="px-2 py-1.5 text-right">{r.pricePerUnit.toFixed(2)} €</td>
                          <td className="px-2 py-1.5 text-foreground-muted">{matched ? "bestehendes Asset" : "neu anlegen"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-foreground-muted">
                {parsed.rows.length} Transaktion{parsed.rows.length === 1 ? "" : "en"} erkannt.
              </p>
              <Button onClick={handleImport} disabled={isPending || !groupId} className="w-full">
                {isPending ? "Importiere…" : `${parsed.rows.length} Transaktionen importieren`}
              </Button>
            </>
          ) : (
            <p className="text-sm text-foreground-muted">Keine importierbaren Zeilen in dieser Datei gefunden.</p>
          )}
        </div>
      )}

      {actionError && <p className="rounded-life bg-danger/10 px-3.5 py-2.5 text-sm text-danger">{actionError}</p>}

      {summary && (
        <div className="rounded-life bg-success/10 px-3.5 py-2.5 text-sm text-success">
          <p>
            {summary.importedTransactions} Transaktion{summary.importedTransactions === 1 ? "" : "en"} importiert
            {summary.createdAssets > 0 && `, ${summary.createdAssets} neue Assets angelegt`}.
          </p>
          {summary.skipped.length > 0 && (
            <p className="mt-1 text-warning">
              {summary.skipped.length} Zeile{summary.skipped.length === 1 ? "" : "n"} übersprungen — z. B. Zeile{" "}
              {summary.skipped[0].rowNumber}: {summary.skipped[0].reason}
            </p>
          )}
        </div>
      )}

      <button
        onClick={() => {
          setOpen(false);
          reset();
        }}
        className="w-full text-center text-sm text-foreground-muted hover:underline"
      >
        Schließen
      </button>
    </Card>
  );
}
