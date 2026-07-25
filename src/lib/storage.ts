import { put, del, get } from "@vercel/blob";

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024; // 15 MB
export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/heic",
];

function safeFileName(originalName: string): string {
  const ext = originalName.includes(".")
    ? originalName.slice(originalName.lastIndexOf(".")).slice(0, 20)
    : "";
  return `${crypto.randomUUID()}${ext}`;
}

/**
 * Uploads a document to Vercel Blob as a private object and returns the
 * pathname to store in the DB (not the URL — private blobs are fetched by
 * pathname via `get()`, gated by BLOB_READ_WRITE_TOKEN).
 */
export async function saveDocumentFile(
  userId: string,
  originalName: string,
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  const pathname = `${userId}/${safeFileName(originalName)}`;

  await put(pathname, buffer, {
    access: "private",
    contentType: mimeType,
    addRandomSuffix: false,
  });

  return pathname;
}

export async function readDocumentFile(
  storedPath: string
): Promise<{ stream: ReadableStream<Uint8Array>; contentType: string; size: number } | null> {
  const result = await get(storedPath, { access: "private" });
  if (!result || result.statusCode !== 200) return null;
  return { stream: result.stream, contentType: result.blob.contentType, size: result.blob.size };
}

export async function deleteDocumentFile(storedPath: string): Promise<void> {
  await del(storedPath).catch(() => undefined);
}
