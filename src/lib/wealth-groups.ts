import { query, newId, nowIso } from "@/lib/db";
import type { GroupTyp } from "@/lib/wealth-asset-constants";

export type WealthGroupRow = {
  id: string;
  user_id: string;
  name: string;
  typ: GroupTyp;
  farbe: string;
  icon: string;
  sort_order: number;
  stale_after_days: number;
  created_at: string;
  updated_at: string;
};

export async function listWealthGroups(userId: string) {
  return query<WealthGroupRow[]>(
    `SELECT * FROM wealth_groups WHERE user_id = ? ORDER BY sort_order ASC, created_at ASC`,
    [userId]
  );
}

export async function getWealthGroup(id: string, userId: string) {
  const rows = await query<WealthGroupRow[]>(
    `SELECT * FROM wealth_groups WHERE id = ? AND user_id = ?`,
    [id, userId]
  );
  return rows[0] ?? null;
}

export type WealthGroupInput = {
  name: string;
  typ: GroupTyp;
  farbe: string;
  icon: string;
  staleAfterDays: number;
};

export async function insertWealthGroup(userId: string, input: WealthGroupInput) {
  const id = newId();
  const now = nowIso();
  const rows = await query<{ max: number | null }[]>(
    `SELECT MAX(sort_order) as max FROM wealth_groups WHERE user_id = ?`,
    [userId]
  );
  const sortOrder = (rows[0]?.max ?? -1) + 1;
  await query(
    `INSERT INTO wealth_groups (id, user_id, name, typ, farbe, icon, sort_order, stale_after_days, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, userId, input.name, input.typ, input.farbe, input.icon, sortOrder, input.staleAfterDays, now, now]
  );
  return id;
}

export async function updateWealthGroup(id: string, userId: string, input: WealthGroupInput) {
  await query(
    `UPDATE wealth_groups SET name=?, typ=?, farbe=?, icon=?, stale_after_days=?, updated_at=?
     WHERE id=? AND user_id=?`,
    [input.name, input.typ, input.farbe, input.icon, input.staleAfterDays, nowIso(), id, userId]
  );
}

export async function deleteWealthGroup(id: string, userId: string) {
  await query(`DELETE FROM wealth_groups WHERE id = ? AND user_id = ?`, [id, userId]);
}

// Ensures a user has at least one group to file assets under ("Sonstiges"),
// used both by the migration backfill and by the "add asset" UI when a user
// has no groups yet.
export async function ensureDefaultWealthGroup(userId: string): Promise<string> {
  const existing = await listWealthGroups(userId);
  const fallback = existing.find((g) => g.typ === "OTHER");
  if (fallback) return fallback.id;
  return insertWealthGroup(userId, { name: "Sonstiges", typ: "OTHER", farbe: "#6366f1", icon: "wallet", staleAfterDays: 30 });
}
