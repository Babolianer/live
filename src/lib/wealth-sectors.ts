import { query, newId, nowIso } from "@/lib/db";

export type WealthSectorRow = {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  color: string;
  created_at: string;
  updated_at: string;
};

export async function listWealthSectors(userId: string) {
  return query<WealthSectorRow[]>(`SELECT * FROM wealth_sectors WHERE user_id = ? ORDER BY name ASC`, [userId]);
}

function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function insertWealthSector(userId: string, name: string, color = "#6366f1") {
  const id = newId();
  const now = nowIso();
  await query(
    `INSERT INTO wealth_sectors (id, user_id, name, slug, color, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, userId, name, slugify(name), color, now, now]
  );
  return id;
}

export async function deleteWealthSector(id: string, userId: string) {
  await query(`DELETE FROM wealth_sectors WHERE id = ? AND user_id = ?`, [id, userId]);
}
