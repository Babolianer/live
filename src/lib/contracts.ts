import { query, newId, nowIso } from "@/lib/db";
import type { BillingCycle } from "@/lib/contract-constants";

export type { BillingCycle };

export type ContractRow = {
  id: string;
  user_id: string;
  name: string;
  category: string;
  amount: number | null;
  billing_cycle: BillingCycle;
  contract_end: string | null;
  cancellation_deadline: string | null;
  document_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export async function listContracts(userId: string) {
  return query<ContractRow[]>(
    `SELECT * FROM contracts WHERE user_id = ?
     ORDER BY (cancellation_deadline IS NULL), cancellation_deadline ASC,
              (contract_end IS NULL), contract_end ASC`,
    [userId]
  );
}

export async function listDueSoon(userId: string, days = 30) {
  return query<ContractRow[]>(
    `SELECT * FROM contracts
     WHERE user_id = ? AND cancellation_deadline IS NOT NULL
       AND cancellation_deadline BETWEEN date('now') AND date('now', '+' || ? || ' days')
     ORDER BY cancellation_deadline ASC`,
    [userId, days]
  );
}

export async function getContract(id: string, userId: string) {
  const rows = await query<ContractRow[]>(
    `SELECT * FROM contracts WHERE id = ? AND user_id = ?`,
    [id, userId]
  );
  return rows[0] ?? null;
}

export async function countContracts(userId: string): Promise<number> {
  const rows = await query<{ count: number }[]>(
    `SELECT COUNT(*) as count FROM contracts WHERE user_id = ?`,
    [userId]
  );
  return rows[0]?.count ?? 0;
}

export type ContractInput = {
  name: string;
  category: string;
  amount: number | null;
  billingCycle: BillingCycle;
  contractEnd: string | null;
  cancellationDeadline: string | null;
  documentId: string | null;
  notes: string | null;
};

export async function insertContract(userId: string, input: ContractInput) {
  const id = newId();
  const now = nowIso();
  await query(
    `INSERT INTO contracts
      (id, user_id, name, category, amount, billing_cycle, contract_end, cancellation_deadline, document_id, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      userId,
      input.name,
      input.category,
      input.amount,
      input.billingCycle,
      input.contractEnd,
      input.cancellationDeadline,
      input.documentId,
      input.notes,
      now,
      now,
    ]
  );
  return id;
}

export async function updateContract(id: string, userId: string, input: ContractInput) {
  await query(
    `UPDATE contracts SET name=?, category=?, amount=?, billing_cycle=?, contract_end=?,
       cancellation_deadline=?, document_id=?, notes=?, updated_at=?
     WHERE id = ? AND user_id = ?`,
    [
      input.name,
      input.category,
      input.amount,
      input.billingCycle,
      input.contractEnd,
      input.cancellationDeadline,
      input.documentId,
      input.notes,
      nowIso(),
      id,
      userId,
    ]
  );
}

export async function deleteContractRow(id: string, userId: string) {
  await query(`DELETE FROM contracts WHERE id = ? AND user_id = ?`, [id, userId]);
}
