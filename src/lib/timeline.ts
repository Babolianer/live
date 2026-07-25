import { query } from "@/lib/db";

export type TimelineEvent = {
  id: string;
  type:
    | "document"
    | "contract"
    | "goal_created"
    | "goal_achieved"
    | "wealth"
    | "vehicle"
    | "property"
    | "health";
  label: string;
  detail: string | null;
  href: string;
  at: string;
};

/**
 * Builds a real, chronological activity feed from actual rows across the
 * app — no synthetic events. Each source table contributes its own rows;
 * everything is merged and sorted by timestamp in application code.
 */
export async function buildTimeline(userId: string, limit = 60): Promise<TimelineEvent[]> {
  const [documents, contracts, goals, wealth, vehicles, properties, health] = await Promise.all([
    query<{ id: string; original_name: string; created_at: string }[]>(
      `SELECT id, original_name, created_at FROM documents WHERE user_id = ?`,
      [userId]
    ),
    query<{ id: string; name: string; category: string; created_at: string }[]>(
      `SELECT id, name, category, created_at FROM contracts WHERE user_id = ?`,
      [userId]
    ),
    query<{ id: string; name: string; created_at: string; achieved_at: string | null }[]>(
      `SELECT id, name, created_at, achieved_at FROM goals WHERE user_id = ?`,
      [userId]
    ),
    query<{ id: string; name: string; quantity: number; price_per_unit: number; created_at: string }[]>(
      `SELECT id, name, quantity, price_per_unit, created_at FROM wealth_assets WHERE user_id = ?`,
      [userId]
    ),
    query<{ id: string; name: string; created_at: string }[]>(
      `SELECT id, name, created_at FROM vehicles WHERE user_id = ?`,
      [userId]
    ),
    query<{ id: string; name: string; created_at: string }[]>(
      `SELECT id, name, created_at FROM properties WHERE user_id = ?`,
      [userId]
    ),
    query<{ id: string; log_date: string; created_at: string }[]>(
      `SELECT id, log_date, created_at FROM health_logs WHERE user_id = ?`,
      [userId]
    ),
  ]);

  const events: TimelineEvent[] = [];

  for (const d of documents) {
    events.push({
      id: `document-${d.id}`,
      type: "document",
      label: "Dokument hochgeladen",
      detail: d.original_name,
      href: "/documents",
      at: d.created_at,
    });
  }
  for (const c of contracts) {
    events.push({
      id: `contract-${c.id}`,
      type: "contract",
      label: "Vertrag angelegt",
      detail: `${c.name} (${c.category})`,
      href: "/contracts",
      at: c.created_at,
    });
  }
  for (const g of goals) {
    events.push({
      id: `goal-${g.id}`,
      type: "goal_created",
      label: "Ziel gesetzt",
      detail: g.name,
      href: "/goals",
      at: g.created_at,
    });
    if (g.achieved_at) {
      events.push({
        id: `goal-achieved-${g.id}`,
        type: "goal_achieved",
        label: "Ziel erreicht 🎉",
        detail: g.name,
        href: "/goals",
        at: g.achieved_at,
      });
    }
  }
  for (const w of wealth) {
    events.push({
      id: `wealth-${w.id}`,
      type: "wealth",
      label: "Vermögenswert erfasst",
      detail: `${w.name} — ${Math.round(w.quantity * w.price_per_unit)}€`,
      href: "/wealth",
      at: w.created_at,
    });
  }
  for (const v of vehicles) {
    events.push({
      id: `vehicle-${v.id}`,
      type: "vehicle",
      label: "Fahrzeug hinzugefügt",
      detail: v.name,
      href: "/garage",
      at: v.created_at,
    });
  }
  for (const p of properties) {
    events.push({
      id: `property-${p.id}`,
      type: "property",
      label: "Immobilie hinzugefügt",
      detail: p.name,
      href: "/properties",
      at: p.created_at,
    });
  }
  for (const h of health) {
    events.push({
      id: `health-${h.id}`,
      type: "health",
      label: "Gesundheits-Eintrag",
      detail: h.log_date,
      href: "/health",
      at: h.created_at,
    });
  }

  events.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  return events.slice(0, limit);
}
