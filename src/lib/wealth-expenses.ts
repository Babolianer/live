import { query, newId, nowIso } from "@/lib/db";

export type WealthExpenseRow = {
  id: string;
  user_id: string;
  date: string;
  amount: number;
  category: string;
  type: "INCOME" | "EXPENSE";
  description: string;
  is_recurring: number;
  created_at: string;
};

export async function listExpenses(userId: string, filters?: { year?: number; month?: number }) {
  let sql = `SELECT * FROM wealth_expenses WHERE user_id = ?`;
  const params: unknown[] = [userId];

  if (filters?.year !== undefined && filters?.month !== undefined) {
    const start = new Date(filters.year, filters.month - 1, 1).toISOString();
    const end = new Date(filters.year, filters.month, 1).toISOString();
    sql += ` AND date >= ? AND date < ?`;
    params.push(start, end);
  } else if (filters?.year !== undefined) {
    const start = new Date(filters.year, 0, 1).toISOString();
    const end = new Date(filters.year + 1, 0, 1).toISOString();
    sql += ` AND date >= ? AND date < ?`;
    params.push(start, end);
  }

  sql += ` ORDER BY date DESC`;
  return query<WealthExpenseRow[]>(sql, params);
}

export async function getMonthlySummary(userId: string, year: number, month: number) {
  const expenses = await listExpenses(userId, { year, month });

  let income = 0;
  let outflow = 0;
  const byCategory: Record<string, { income: number; expense: number }> = {};

  for (const e of expenses) {
    if (e.type === "INCOME") income += e.amount;
    else outflow += e.amount;

    if (!byCategory[e.category]) byCategory[e.category] = { income: 0, expense: 0 };
    if (e.type === "INCOME") byCategory[e.category].income += e.amount;
    else byCategory[e.category].expense += e.amount;
  }

  return { income, outflow, balance: income - outflow, byCategory };
}

export type ExpenseInput = {
  date: string;
  amount: number;
  category: string;
  type: "INCOME" | "EXPENSE";
  description: string;
  isRecurring: boolean;
};

export async function insertExpense(userId: string, input: ExpenseInput) {
  const id = newId();
  await query(
    `INSERT INTO wealth_expenses (id, user_id, date, amount, category, type, description, is_recurring, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, userId, input.date, input.amount, input.category, input.type, input.description, input.isRecurring ? 1 : 0, nowIso()]
  );
  return id;
}

export async function updateExpense(id: string, userId: string, input: ExpenseInput) {
  await query(
    `UPDATE wealth_expenses SET date=?, amount=?, category=?, type=?, description=?, is_recurring=? WHERE id=? AND user_id=?`,
    [input.date, input.amount, input.category, input.type, input.description, input.isRecurring ? 1 : 0, id, userId]
  );
}

export async function deleteExpense(id: string, userId: string) {
  await query(`DELETE FROM wealth_expenses WHERE id = ? AND user_id = ?`, [id, userId]);
}
