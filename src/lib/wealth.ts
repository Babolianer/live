import { query, newId, nowIso } from "@/lib/db";
import type { WealthCategory } from "@/lib/wealth-constants";

export type WealthEntryRow = {
  id: string;
  user_id: string;
  name: string;
  category: WealthCategory;
  value: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type WealthSnapshotRow = { id: string; total_value: number; created_at: string };

export async function listWealthEntries(userId: string) {
  return query<WealthEntryRow[]>(
    `SELECT * FROM wealth_entries WHERE user_id = ? ORDER BY value DESC`,
    [userId]
  );
}

export async function getWealthEntry(id: string, userId: string) {
  const rows = await query<WealthEntryRow[]>(
    `SELECT * FROM wealth_entries WHERE id = ? AND user_id = ?`,
    [id, userId]
  );
  return rows[0] ?? null;
}

export async function getTotalWealth(userId: string): Promise<number> {
  const rows = await query<{ total: number | null }[]>(
    `SELECT SUM(value) as total FROM wealth_entries WHERE user_id = ?`,
    [userId]
  );
  return rows[0]?.total ?? 0;
}

export async function listWealthSnapshots(userId: string, limit = 90) {
  const rows = await query<WealthSnapshotRow[]>(
    `SELECT id, total_value, created_at FROM wealth_snapshots
     WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`,
    [userId, limit]
  );
  return rows.reverse();
}

async function recordSnapshot(userId: string) {
  const total = await getTotalWealth(userId);
  await query(`INSERT INTO wealth_snapshots (id, user_id, total_value, created_at) VALUES (?, ?, ?, ?)`, [
    newId(),
    userId,
    total,
    nowIso(),
  ]);
}

export type WealthEntryInput = {
  name: string;
  category: string;
  value: number;
  notes: string | null;
};

export async function insertWealthEntry(userId: string, input: WealthEntryInput) {
  const id = newId();
  const now = nowIso();
  await query(
    `INSERT INTO wealth_entries (id, user_id, name, category, value, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, userId, input.name, input.category, input.value, input.notes, now, now]
  );
  await recordSnapshot(userId);
  return id;
}

export async function updateWealthEntry(id: string, userId: string, input: WealthEntryInput) {
  await query(
    `UPDATE wealth_entries SET name=?, category=?, value=?, notes=?, updated_at=? WHERE id=? AND user_id=?`,
    [input.name, input.category, input.value, input.notes, nowIso(), id, userId]
  );
  await recordSnapshot(userId);
}

export async function deleteWealthEntry(id: string, userId: string) {
  await query(`DELETE FROM wealth_entries WHERE id = ? AND user_id = ?`, [id, userId]);
  await recordSnapshot(userId);
}
