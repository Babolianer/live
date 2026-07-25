"use server";

import { revalidatePath } from "next/cache";
import { requireSessionUser } from "@/lib/auth";
import { listWealthAssetsByGroup, insertWealthAsset } from "@/lib/wealth-assets";
import { addTransaction, createSnapshot } from "@/lib/wealth-finance";
import { getWealthGroup } from "@/lib/wealth-groups";
import type { ParsedImportRow } from "@/lib/wealth-csv-import";

export type BrokerImportSummary = {
  createdAssets: number;
  importedTransactions: number;
  skipped: { rowNumber: number; reason: string }[];
};

export type BrokerImportActionState = { error: string } | { summary: BrokerImportSummary } | undefined;

/**
 * Applies previously client-parsed CSV rows (see wealth-csv-import.ts) — asset
 * matching happens here (needs a DB round-trip), not on the client. Rows are
 * inserted per-asset in chronological order so addTransaction's oversell
 * check (based on prior same-asset transactions) sees a consistent history.
 */
export async function applyBrokerCsvImportAction(
  groupId: string,
  rows: ParsedImportRow[]
): Promise<BrokerImportActionState> {
  const user = await requireSessionUser();

  const group = await getWealthGroup(groupId, user.id);
  if (!group) return { error: "Gruppe nicht gefunden." };
  if (rows.length === 0) return { error: "Keine importierbaren Zeilen gefunden." };

  const existingAssets = await listWealthAssetsByGroup(groupId, user.id);
  const byIsin = new Map(existingAssets.filter((a) => a.isin).map((a) => [a.isin!.trim().toUpperCase(), a.id]));
  const byName = new Map(existingAssets.map((a) => [a.name.trim().toLowerCase(), a.id]));

  const sorted = [...rows].sort((a, b) => a.dateIso.localeCompare(b.dateIso));

  const summary: BrokerImportSummary = { createdAssets: 0, importedTransactions: 0, skipped: [] };

  for (const row of sorted) {
    try {
      let assetId = row.isin ? byIsin.get(row.isin.trim().toUpperCase()) : undefined;
      if (!assetId) assetId = byName.get(row.name.trim().toLowerCase());

      if (!assetId) {
        assetId = await insertWealthAsset(user.id, {
          groupId,
          sectorId: null,
          name: row.name,
          typ: "OTHER",
          quantity: 0,
          pricePerUnit: 0,
          currency: "EUR",
          isin: row.isin,
          symbol: null,
          notes: "Angelegt durch CSV-Import.",
        });
        summary.createdAssets++;
        if (row.isin) byIsin.set(row.isin.trim().toUpperCase(), assetId);
        byName.set(row.name.trim().toLowerCase(), assetId);
      }

      await addTransaction(user.id, assetId, {
        type: row.type,
        quantity: row.quantity,
        pricePerUnit: row.pricePerUnit,
        date: row.dateIso,
        notes: "CSV-Import",
      });
      summary.importedTransactions++;
    } catch (error) {
      summary.skipped.push({
        rowNumber: row.rowNumber,
        reason: error instanceof Error ? error.message : "Unbekannter Fehler.",
      });
    }
  }

  await createSnapshot(user.id);
  revalidatePath("/wealth");
  revalidatePath("/wealth/vermoegen");
  return { summary };
}
