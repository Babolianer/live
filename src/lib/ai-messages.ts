import { query, newId, nowIso } from "@/lib/db";

export type MessageAttachment = { documentId: string; name: string; mimeType: string };

export type AiMessageRow = {
  id: string;
  role: "user" | "assistant";
  content: string;
  attachments: string | null;
  created_at: string;
};

export async function listMessages(conversationId: string, limit = 60) {
  const rows = await query<AiMessageRow[]>(
    `SELECT id, role, content, attachments, created_at FROM ai_messages
     WHERE conversation_id = ? ORDER BY created_at DESC LIMIT ?`,
    [conversationId, limit]
  );
  return rows.reverse();
}

export async function countUserMessages(userId: string): Promise<number> {
  const rows = await query<{ count: number }[]>(
    `SELECT COUNT(*) as count FROM ai_messages WHERE user_id = ? AND role = 'user'`,
    [userId]
  );
  return rows[0]?.count ?? 0;
}

export async function insertMessage(
  conversationId: string,
  userId: string,
  role: "user" | "assistant",
  content: string,
  attachments?: MessageAttachment[]
) {
  const id = newId();
  await query(
    `INSERT INTO ai_messages (id, user_id, conversation_id, role, content, attachments, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      userId,
      conversationId,
      role,
      content,
      attachments && attachments.length ? JSON.stringify(attachments) : null,
      nowIso(),
    ]
  );
  return id;
}

export function parseAttachments(raw: string | null): MessageAttachment[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
