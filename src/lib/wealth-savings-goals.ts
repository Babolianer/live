import { query, newId, nowIso } from "@/lib/db";
import type { AssetTyp } from "@/lib/wealth-asset-constants";

export type WealthSavingsGoalRow = {
  id: string;
  user_id: string;
  name: string;
  target_type: AssetTyp;
  target_amount: number;
  monthly_contribution: number;
  unit_label: string;
  created_at: string;
  updated_at: string;
};

export async function listSavingsGoals(userId: string) {
  return query<WealthSavingsGoalRow[]>(`SELECT * FROM wealth_savings_goals WHERE user_id = ? ORDER BY created_at ASC`, [userId]);
}

export async function getSavingsGoal(id: string, userId: string) {
  const rows = await query<WealthSavingsGoalRow[]>(`SELECT * FROM wealth_savings_goals WHERE id = ? AND user_id = ?`, [id, userId]);
  return rows[0] ?? null;
}

export type SavingsGoalInput = {
  name: string;
  targetType: AssetTyp;
  targetAmount: number;
  monthlyContribution: number;
  unitLabel: string;
};

export async function insertSavingsGoal(userId: string, input: SavingsGoalInput) {
  const id = newId();
  const now = nowIso();
  await query(
    `INSERT INTO wealth_savings_goals (id, user_id, name, target_type, target_amount, monthly_contribution, unit_label, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, userId, input.name, input.targetType, input.targetAmount, input.monthlyContribution, input.unitLabel, now, now]
  );
  return id;
}

export async function updateSavingsGoal(id: string, userId: string, input: SavingsGoalInput) {
  await query(
    `UPDATE wealth_savings_goals SET name=?, target_type=?, target_amount=?, monthly_contribution=?, unit_label=?, updated_at=?
     WHERE id=? AND user_id=?`,
    [input.name, input.targetType, input.targetAmount, input.monthlyContribution, input.unitLabel, nowIso(), id, userId]
  );
}

export async function deleteSavingsGoal(id: string, userId: string) {
  await query(`DELETE FROM wealth_savings_goals WHERE id = ? AND user_id = ?`, [id, userId]);
}
