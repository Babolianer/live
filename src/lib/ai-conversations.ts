import { query, newId, nowIso } from "@/lib/db";

export type ConversationRow = {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

export async function listConversations(userId: string) {
  return query<ConversationRow[]>(
    `SELECT * FROM ai_conversations WHERE user_id = ? ORDER BY updated_at DESC`,
    [userId]
  );
}

export async function getConversation(id: string, userId: string) {
  const rows = await query<ConversationRow[]>(
    `SELECT * FROM ai_conversations WHERE id = ? AND user_id = ?`,
    [id, userId]
  );
  return rows[0] ?? null;
}

export async function createConversation(userId: string, title = "Neuer Chat") {
  const id = newId();
  const now = nowIso();
  await query(
    `INSERT INTO ai_conversations (id, user_id, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
    [id, userId, title, now, now]
  );
  return id;
}

export async function touchConversation(id: string) {
  await query(`UPDATE ai_conversations SET updated_at = ? WHERE id = ?`, [nowIso(), id]);
}

export async function renameConversationIfDefault(id: string, derivedTitle: string) {
  await query(
    `UPDATE ai_conversations SET title = ? WHERE id = ? AND title = 'Neuer Chat'`,
    [derivedTitle.slice(0, 60), id]
  );
}

export async function renameConversation(id: string, userId: string, title: string) {
  await query(`UPDATE ai_conversations SET title = ? WHERE id = ? AND user_id = ?`, [
    title.slice(0, 60),
    id,
    userId,
  ]);
}

export async function deleteConversation(id: string, userId: string) {
  await query(`DELETE FROM ai_conversations WHERE id = ? AND user_id = ?`, [id, userId]);
}
