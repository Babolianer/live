import { extractTextFromPdf } from "@/lib/documents";

/**
 * Identifies a file's real format from its byte signature (no trust in
 * client-supplied MIME types) — used for the one-off Immobilien-Exposé
 * analysis, which doesn't go through the documents-table upload pipeline.
 */
export function sniffMimeType(buffer: Buffer): string | null {
  const bytes = buffer.subarray(0, 16);
  if (bytes.subarray(0, 4).toString("ascii") === "%PDF") return "application/pdf";
  if (bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  return null;
}

async function runOcr(buffer: Buffer): Promise<string> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker(["deu", "eng"]);
  try {
    const {
      data: { text },
    } = await worker.recognize(buffer);
    return text ?? "";
  } finally {
    await worker.terminate();
  }
}

/**
 * Extracts plain text from an uploaded Exposé — real PDF text extraction
 * (tesseract.js can't decode PDF bytes directly, so scanned/image-only PDFs
 * simply yield little/no text here) and OCR (Tesseract, German + English)
 * for image uploads.
 */
export async function extractTextFromDocument(buffer: Buffer, mimeType: string): Promise<string> {
  if (mimeType === "application/pdf") {
    return (await extractTextFromPdf(buffer)) ?? "";
  }
  if (mimeType.startsWith("image/")) {
    return runOcr(buffer);
  }
  throw new Error("Nicht unterstütztes Dateiformat.");
}
