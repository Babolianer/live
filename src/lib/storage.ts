import { put, del, get } from "@vercel/blob";

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024; // 15 MB
export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/heic",
];

/**
 * Checks the file's actual byte signature against the MIME type the client
 * claims, so a renamed/relabeled file can't slip past the upload filter.
 * HEIC's signature sits inside a variable-length ISO-BMFF box, so it gets a
 * looser (but still real) check than the fixed-offset formats.
 */
export function matchesFileSignature(buffer: Buffer, mimeType: string): boolean {
  const bytes = buffer.subarray(0, 16);
  switch (mimeType) {
    case "application/pdf":
      return bytes.subarray(0, 4).toString("ascii") === "%PDF";
    case "image/png":
      return bytes.subarray(0, 8).equals(
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
      );
    case "image/jpeg":
      return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    case "image/webp":
      return (
        bytes.subarray(0, 4).toString("ascii") === "RIFF" &&
        bytes.subarray(8, 12).toString("ascii") === "WEBP"
      );
    case "image/heic": {
      const brand = buffer.subarray(8, 12).toString("ascii");
      return (
        bytes.subarray(4, 8).toString("ascii") === "ftyp" &&
        ["heic", "heix", "hevc", "hevx", "mif1", "msf1"].includes(brand)
      );
    }
    default:
      return false;
  }
}

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

/** Reads a stored image back as a base64 data URL, for sending to a vision model. */
export async function readImageAsDataUrl(storedPath: string, mimeType: string): Promise<string | null> {
  const file = await readDocumentFile(storedPath);
  if (!file) return null;
  const buffer = Buffer.from(await new Response(file.stream).arrayBuffer());
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}
