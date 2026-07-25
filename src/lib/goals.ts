import { query, newId, nowIso } from "@/lib/db";
import type { GoalCategory } from "@/lib/goal-constants";

export type GoalRow = {
  id: string;
  user_id: string;
  name: string;
  category: GoalCategory;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  notes: string | null;
  achieved_at: string | null;
  created_at: string;
  updated_at: string;
};

export async function listGoals(userId: string) {
  return query<GoalRow[]>(
    `SELECT * FROM goals WHERE user_id = ?
     ORDER BY (achieved_at IS NOT NULL), (target_date IS NULL), target_date ASC, created_at ASC`,
    [userId]
  );
}

export async function countGoals(userId: string): Promise<number> {
  const rows = await query<{ count: number }[]>(
    `SELECT COUNT(*) as count FROM goals WHERE user_id = ?`,
    [userId]
  );
  return rows[0]?.count ?? 0;
}

export async function getGoal(id: string, userId: string) {
  const rows = await query<GoalRow[]>(`SELECT * FROM goals WHERE id = ? AND user_id = ?`, [
    id,
    userId,
  ]);
  return rows[0] ?? null;
}

export type GoalInput = {
  name: string;
  category: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string | null;
  notes: string | null;
};

export async function insertGoal(userId: string, input: GoalInput) {
  const id = newId();
  const now = nowIso();
  const achievedAt = input.currentAmount >= input.targetAmount ? now : null;
  await query(
    `INSERT INTO goals
      (id, user_id, name, category, target_amount, current_amount, target_date, notes, achieved_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      userId,
      input.name,
      input.category,
      input.targetAmount,
      input.currentAmount,
      input.targetDate,
      input.notes,
      achievedAt,
      now,
      now,
    ]
  );
  return id;
}

export async function updateGoal(id: string, userId: string, input: GoalInput) {
  const existing = await getGoal(id, userId);
  const nowAchieved = input.currentAmount >= input.targetAmount;
  const achievedAt = nowAchieved ? (existing?.achieved_at ?? nowIso()) : null;

  await query(
    `UPDATE goals SET name=?, category=?, target_amount=?, current_amount=?, target_date=?,
       notes=?, achieved_at=?, updated_at=?
     WHERE id = ? AND user_id = ?`,
    [
      input.name,
      input.category,
      input.targetAmount,
      input.currentAmount,
      input.targetDate,
      input.notes,
      achievedAt,
      nowIso(),
      id,
      userId,
    ]
  );
}

export async function deleteGoalRow(id: string, userId: string) {
  await query(`DELETE FROM goals WHERE id = ? AND user_id = ?`, [id, userId]);
}
