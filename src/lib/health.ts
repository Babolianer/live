import { query, newId, nowIso } from "@/lib/db";

export type HealthLogRow = {
  id: string;
  user_id: string;
  log_date: string;
  steps: number | null;
  water_liters: number | null;
  sleep_hours: number | null;
  workout: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export async function listHealthLogs(userId: string, limit = 14) {
  return query<HealthLogRow[]>(
    `SELECT * FROM health_logs WHERE user_id = ? ORDER BY log_date DESC LIMIT ?`,
    [userId, limit]
  );
}

export async function getHealthLogByDate(userId: string, date: string) {
  const rows = await query<HealthLogRow[]>(
    `SELECT * FROM health_logs WHERE user_id = ? AND log_date = ?`,
    [userId, date]
  );
  return rows[0] ?? null;
}

export async function getHealthLog(id: string, userId: string) {
  const rows = await query<HealthLogRow[]>(
    `SELECT * FROM health_logs WHERE id = ? AND user_id = ?`,
    [id, userId]
  );
  return rows[0] ?? null;
}

export type HealthLogInput = {
  logDate: string;
  steps: number | null;
  waterLiters: number | null;
  sleepHours: number | null;
  workout: string | null;
  notes: string | null;
};

export async function upsertHealthLog(userId: string, input: HealthLogInput) {
  const now = nowIso();
  await query(
    `INSERT INTO health_logs (id, user_id, log_date, steps, water_liters, sleep_hours, workout, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id, log_date) DO UPDATE SET
       steps = excluded.steps,
       water_liters = excluded.water_liters,
       sleep_hours = excluded.sleep_hours,
       workout = excluded.workout,
       notes = excluded.notes,
       updated_at = excluded.updated_at`,
    [
      newId(),
      userId,
      input.logDate,
      input.steps,
      input.waterLiters,
      input.sleepHours,
      input.workout,
      input.notes,
      now,
      now,
    ]
  );
}

export async function deleteHealthLog(id: string, userId: string) {
  await query(`DELETE FROM health_logs WHERE id = ? AND user_id = ?`, [id, userId]);
}
