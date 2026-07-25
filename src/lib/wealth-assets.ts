import { query, newId, nowIso } from "@/lib/db";
import type { AssetTyp } from "@/lib/wealth-asset-constants";

export type WealthAssetRow = {
  id: string;
  user_id: string;
  group_id: string;
  sector_id: string | null;
  name: string;
  typ: AssetTyp;
  quantity: number;
  price_per_unit: number;
  currency: string;
  isin: string | null;
  symbol: string | null;
  sort_order: number;
  notes: string | null;
  price_updated_at: string | null;
  created_at: string;
  updated_at: string;
};

export async function listWealthAssets(userId: string) {
  return query<WealthAssetRow[]>(
    `SELECT * FROM wealth_assets WHERE user_id = ? ORDER BY sort_order ASC, created_at ASC`,
    [userId]
  );
}

export async function getWealthAsset(id: string, userId: string) {
  const rows = await query<WealthAssetRow[]>(`SELECT * FROM wealth_assets WHERE id = ? AND user_id = ?`, [id, userId]);
  return rows[0] ?? null;
}

export async function listWealthAssetsByGroup(groupId: string, userId: string) {
  return query<WealthAssetRow[]>(
    `SELECT * FROM wealth_assets WHERE group_id = ? AND user_id = ? ORDER BY sort_order ASC, created_at ASC`,
    [groupId, userId]
  );
}

export type WealthAssetInput = {
  groupId: string;
  sectorId: string | null;
  name: string;
  typ: AssetTyp;
  quantity: number;
  pricePerUnit: number;
  currency: string;
  isin: string | null;
  symbol: string | null;
  notes: string | null;
};

export async function insertWealthAsset(userId: string, input: WealthAssetInput) {
  const id = newId();
  const now = nowIso();
  const rows = await query<{ max: number | null }[]>(
    `SELECT MAX(sort_order) as max FROM wealth_assets WHERE user_id = ?`,
    [userId]
  );
  const sortOrder = (rows[0]?.max ?? -1) + 1;
  await query(
    `INSERT INTO wealth_assets
      (id, user_id, group_id, sector_id, name, typ, quantity, price_per_unit, currency, isin, symbol, sort_order, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      userId,
      input.groupId,
      input.sectorId,
      input.name,
      input.typ,
      input.quantity,
      input.pricePerUnit,
      input.currency,
      input.isin,
      input.symbol,
      sortOrder,
      input.notes,
      now,
      now,
    ]
  );
  return id;
}

// Quantity/price are included so manually-maintained asset types (Cash,
// Tagesgeld, sonstige Sachwerte) can be edited directly — assets with real
// buy/sell transactions get these overwritten again on the next transaction
// mutation (see recomputeAssetFromTransactions), so this only "sticks" for
// assets without transaction history.
export async function updateWealthAsset(id: string, userId: string, input: WealthAssetInput) {
  await query(
    `UPDATE wealth_assets SET group_id=?, sector_id=?, name=?, typ=?, quantity=?, price_per_unit=?, currency=?, isin=?, symbol=?, notes=?, updated_at=?
     WHERE id=? AND user_id=?`,
    [
      input.groupId,
      input.sectorId,
      input.name,
      input.typ,
      input.quantity,
      input.pricePerUnit,
      input.currency,
      input.isin,
      input.symbol,
      input.notes,
      nowIso(),
      id,
      userId,
    ]
  );
}

export async function deleteWealthAsset(id: string, userId: string) {
  await query(`DELETE FROM wealth_assets WHERE id = ? AND user_id = ?`, [id, userId]);
}

export async function setWealthAssetQuantityAndPrice(id: string, quantity: number, pricePerUnit: number | null) {
  if (pricePerUnit !== null) {
    await query(`UPDATE wealth_assets SET quantity=?, price_per_unit=?, updated_at=? WHERE id=?`, [
      quantity,
      pricePerUnit,
      nowIso(),
      id,
    ]);
  } else {
    await query(`UPDATE wealth_assets SET quantity=?, updated_at=? WHERE id=?`, [quantity, nowIso(), id]);
  }
}

export async function persistLivePriceForAsset(id: string, price: number, priceDate: string) {
  await query(`UPDATE wealth_assets SET price_per_unit=?, price_updated_at=? WHERE id=?`, [price, priceDate, id]);
}
