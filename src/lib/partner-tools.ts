import { query, newId, nowIso } from "@/lib/db";

// buildDeepLink lives in @/lib/deep-link (no DB import) — client components
// must import it from there directly, not through this module, or the
// client bundle would pull in the DB driver transitively.

export type PartnerToolRow = {
  id: string;
  category: string;
  provider_name: string;
  affiliate_id: string | null;
  deep_link_template: string;
  enabled: number;
  created_at: string;
  updated_at: string;
};

export async function listPartnerTools() {
  return query<PartnerToolRow[]>(`SELECT * FROM partner_tools ORDER BY category, provider_name`);
}

export async function listEnabledPartnerToolsForCategory(category: string) {
  return query<PartnerToolRow[]>(
    `SELECT * FROM partner_tools WHERE enabled = 1 AND (category = ? OR category = 'alle')
     ORDER BY category = 'alle'`,
    [category]
  );
}

export async function getPartnerTool(id: string) {
  const rows = await query<PartnerToolRow[]>(`SELECT * FROM partner_tools WHERE id = ?`, [id]);
  return rows[0] ?? null;
}

export type PartnerToolInput = {
  category: string;
  providerName: string;
  affiliateId: string | null;
  deepLinkTemplate: string;
  enabled: boolean;
};

export async function insertPartnerTool(input: PartnerToolInput) {
  const id = newId();
  const now = nowIso();
  await query(
    `INSERT INTO partner_tools
      (id, category, provider_name, affiliate_id, deep_link_template, enabled, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.category,
      input.providerName,
      input.affiliateId,
      input.deepLinkTemplate,
      input.enabled ? 1 : 0,
      now,
      now,
    ]
  );
  return id;
}

export async function updatePartnerTool(id: string, input: PartnerToolInput) {
  await query(
    `UPDATE partner_tools SET category=?, provider_name=?, affiliate_id=?, deep_link_template=?,
       enabled=?, updated_at=?
     WHERE id = ?`,
    [
      input.category,
      input.providerName,
      input.affiliateId,
      input.deepLinkTemplate,
      input.enabled ? 1 : 0,
      nowIso(),
      id,
    ]
  );
}

export async function deletePartnerToolRow(id: string) {
  await query(`DELETE FROM partner_tools WHERE id = ?`, [id]);
}
