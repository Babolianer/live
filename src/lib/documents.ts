import { query, newId, nowIso } from "@/lib/db";

export type DocumentRow = {
  id: string;
  user_id: string;
  original_name: string;
  stored_path: string;
  mime_type: string;
  size_bytes: number;
  extracted_text: string | null;
  created_at: string;
};

export async function listDocuments(userId: string, search?: string) {
  if (search && search.trim()) {
    return query<DocumentRow[]>(
      `SELECT id, user_id, original_name, stored_path, mime_type, size_bytes, created_at
       FROM documents WHERE user_id = ? AND original_name LIKE ?
       ORDER BY created_at DESC`,
      [userId, `%${search.trim()}%`]
    );
  }
  return query<DocumentRow[]>(
    `SELECT id, user_id, original_name, stored_path, mime_type, size_bytes, created_at
     FROM documents WHERE user_id = ? ORDER BY created_at DESC`,
    [userId]
  );
}

export async function countDocuments(userId: string): Promise<number> {
  const rows = await query<{ count: number }[]>(
    `SELECT COUNT(*) as count FROM documents WHERE user_id = ?`,
    [userId]
  );
  return rows[0]?.count ?? 0;
}

export async function getDocument(id: string, userId: string) {
  const rows = await query<DocumentRow[]>(
    `SELECT * FROM documents WHERE id = ? AND user_id = ?`,
    [id, userId]
  );
  return rows[0] ?? null;
}

export async function insertDocument(input: {
  userId: string;
  originalName: string;
  storedPath: string;
  mimeType: string;
  sizeBytes: number;
  extractedText: string | null;
}): Promise<string> {
  const id = newId();
  await query(
    `INSERT INTO documents (id, user_id, original_name, stored_path, mime_type, size_bytes, extracted_text, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.userId,
      input.originalName,
      input.storedPath,
      input.mimeType,
      input.sizeBytes,
      input.extractedText,
      nowIso(),
    ]
  );
  return id;
}

export async function renameDocument(id: string, userId: string, name: string) {
  await query(`UPDATE documents SET original_name = ? WHERE id = ? AND user_id = ?`, [
    name,
    id,
    userId,
  ]);
}

export async function deleteDocumentRow(id: string, userId: string) {
  await query(`DELETE FROM documents WHERE id = ? AND user_id = ?`, [id, userId]);
}

export async function extractTextFromPdf(buffer: Buffer): Promise<string | null> {
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text?.slice(0, 200_000) ?? null;
  } catch {
    return null;
  } finally {
    await parser.destroy().catch(() => undefined);
  }
}
