import { query, newId, nowIso } from "@/lib/db";

export type WealthRealEstateDetailsRow = {
  id: string;
  user_id: string;
  asset_id: string;
  source_url: string | null;
  living_area: number | null;
  land_area: number | null;
  rooms: number | null;
  build_year: number | null;
  energy_class: string | null;
  condition: string | null;
  created_at: string;
  updated_at: string;
};

export async function getRealEstateDetails(assetId: string, userId: string) {
  const rows = await query<WealthRealEstateDetailsRow[]>(
    `SELECT * FROM wealth_real_estate_details WHERE asset_id = ? AND user_id = ?`,
    [assetId, userId]
  );
  return rows[0] ?? null;
}

export type RealEstateDetailsInput = {
  sourceUrl: string | null;
  livingArea: number | null;
  landArea: number | null;
  rooms: number | null;
  buildYear: number | null;
  energyClass: string | null;
  condition: string | null;
};

// Skips the write entirely when every field is empty — avoids leaving a
// pointless all-null row behind for assets whose Exposé-Analyse found nothing.
export async function upsertRealEstateDetails(userId: string, assetId: string, input: RealEstateDetailsInput) {
  const hasAnyValue = Object.values(input).some((v) => v !== null && v !== "");
  if (!hasAnyValue) return;

  const existing = await getRealEstateDetails(assetId, userId);
  const now = nowIso();

  if (existing) {
    await query(
      `UPDATE wealth_real_estate_details
         SET source_url=?, living_area=?, land_area=?, rooms=?, build_year=?, energy_class=?, condition=?, updated_at=?
       WHERE id=? AND user_id=?`,
      [
        input.sourceUrl, input.livingArea, input.landArea, input.rooms, input.buildYear,
        input.energyClass, input.condition, now, existing.id, userId,
      ]
    );
    return existing.id;
  }

  const id = newId();
  await query(
    `INSERT INTO wealth_real_estate_details
       (id, user_id, asset_id, source_url, living_area, land_area, rooms, build_year, energy_class, condition, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, userId, assetId, input.sourceUrl, input.livingArea, input.landArea, input.rooms,
      input.buildYear, input.energyClass, input.condition, now, now,
    ]
  );
  return id;
}
