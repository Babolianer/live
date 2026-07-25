import { query, newId, nowIso } from "@/lib/db";

export type VehicleRow = {
  id: string;
  user_id: string;
  name: string;
  license_plate: string | null;
  purchase_date: string | null;
  value: number | null;
  inspection_due: string | null;
  document_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export async function listVehicles(userId: string) {
  return query<VehicleRow[]>(
    `SELECT * FROM vehicles WHERE user_id = ? ORDER BY (inspection_due IS NULL), inspection_due ASC`,
    [userId]
  );
}

export async function countVehicles(userId: string): Promise<number> {
  const rows = await query<{ count: number }[]>(
    `SELECT COUNT(*) as count FROM vehicles WHERE user_id = ?`,
    [userId]
  );
  return rows[0]?.count ?? 0;
}

export async function getVehicle(id: string, userId: string) {
  const rows = await query<VehicleRow[]>(`SELECT * FROM vehicles WHERE id = ? AND user_id = ?`, [
    id,
    userId,
  ]);
  return rows[0] ?? null;
}

export type VehicleInput = {
  name: string;
  licensePlate: string | null;
  purchaseDate: string | null;
  value: number | null;
  inspectionDue: string | null;
  documentId: string | null;
  notes: string | null;
};

export async function insertVehicle(userId: string, input: VehicleInput) {
  const id = newId();
  const now = nowIso();
  await query(
    `INSERT INTO vehicles
      (id, user_id, name, license_plate, purchase_date, value, inspection_due, document_id, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      userId,
      input.name,
      input.licensePlate,
      input.purchaseDate,
      input.value,
      input.inspectionDue,
      input.documentId,
      input.notes,
      now,
      now,
    ]
  );
  return id;
}

export async function updateVehicle(id: string, userId: string, input: VehicleInput) {
  await query(
    `UPDATE vehicles SET name=?, license_plate=?, purchase_date=?, value=?, inspection_due=?,
       document_id=?, notes=?, updated_at=?
     WHERE id = ? AND user_id = ?`,
    [
      input.name,
      input.licensePlate,
      input.purchaseDate,
      input.value,
      input.inspectionDue,
      input.documentId,
      input.notes,
      nowIso(),
      id,
      userId,
    ]
  );
}

export async function deleteVehicle(id: string, userId: string) {
  await query(`DELETE FROM vehicles WHERE id = ? AND user_id = ?`, [id, userId]);
}
