import { query, newId, nowIso } from "@/lib/db";

export type AiMessageRow = {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

export async function listMessages(userId: string, limit = 40) {
  const rows = await query<AiMessageRow[]>(
    `SELECT id, role, content, created_at FROM ai_messages
     WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`,
    [userId, limit]
  );
  return rows.reverse();
}

export async function insertMessage(
  userId: string,
  role: "user" | "assistant",
  content: string
) {
  const id = newId();
  await query(
    `INSERT INTO ai_messages (id, user_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)`,
    [id, userId, role, content, nowIso()]
  );
  return id;
}
