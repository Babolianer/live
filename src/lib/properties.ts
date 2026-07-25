import { query, newId, nowIso } from "@/lib/db";

export type PropertyRow = {
  id: string;
  user_id: string;
  name: string;
  address: string | null;
  purchase_date: string | null;
  value: number | null;
  document_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export async function listProperties(userId: string) {
  return query<PropertyRow[]>(`SELECT * FROM properties WHERE user_id = ? ORDER BY created_at ASC`, [
    userId,
  ]);
}

export async function countProperties(userId: string): Promise<number> {
  const rows = await query<{ count: number }[]>(
    `SELECT COUNT(*) as count FROM properties WHERE user_id = ?`,
    [userId]
  );
  return rows[0]?.count ?? 0;
}

export async function getProperty(id: string, userId: string) {
  const rows = await query<PropertyRow[]>(`SELECT * FROM properties WHERE id = ? AND user_id = ?`, [
    id,
    userId,
  ]);
  return rows[0] ?? null;
}

export type PropertyInput = {
  name: string;
  address: string | null;
  purchaseDate: string | null;
  value: number | null;
  documentId: string | null;
  notes: string | null;
};

export async function insertProperty(userId: string, input: PropertyInput) {
  const id = newId();
  const now = nowIso();
  await query(
    `INSERT INTO properties
      (id, user_id, name, address, purchase_date, value, document_id, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, userId, input.name, input.address, input.purchaseDate, input.value, input.documentId, input.notes, now, now]
  );
  return id;
}

export async function updateProperty(id: string, userId: string, input: PropertyInput) {
  await query(
    `UPDATE properties SET name=?, address=?, purchase_date=?, value=?, document_id=?, notes=?, updated_at=?
     WHERE id = ? AND user_id = ?`,
    [input.name, input.address, input.purchaseDate, input.value, input.documentId, input.notes, nowIso(), id, userId]
  );
}

export async function deleteProperty(id: string, userId: string) {
  await query(`DELETE FROM properties WHERE id = ? AND user_id = ?`, [id, userId]);
}
