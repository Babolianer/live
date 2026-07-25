"use server";

import { revalidatePath } from "next/cache";
import { requireSessionUser, type SessionUser } from "@/lib/auth";
import {
  ALLOWED_MIME_TYPES,
  MAX_UPLOAD_BYTES,
  matchesFileSignature,
  saveDocumentFile,
  deleteDocumentFile,
} from "@/lib/storage";
import {
  insertDocument,
  extractTextFromPdf,
  getDocument,
  deleteDocumentRow,
  renameDocument,
  type DocumentRow,
} from "@/lib/documents";

export type UploadFormState = { error?: string } | undefined;

type UploadResult = { error: string } | { document: DocumentRow };

/**
 * Shared validate-store-extract pipeline used by both the Documents page
 * upload form and chat attachments, so every entry point enforces the same
 * checks (type, size, real file signature) instead of duplicating them.
 */
async function uploadDocumentCore(user: SessionUser, file: File): Promise<UploadResult> {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { error: "Nur PDF-, PNG-, JPEG- oder WEBP-Dateien sind erlaubt." };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { error: "Die Datei darf maximal 15 MB groß sein." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!matchesFileSignature(buffer, file.type)) {
    return {
      error: "Der Dateiinhalt passt nicht zum angegebenen Dateityp. Bitte die Originaldatei hochladen.",
    };
  }

  let storedPath: string;
  try {
    storedPath = await saveDocumentFile(user.id, file.name, buffer, file.type);
  } catch {
    return {
      error:
        "Dateispeicher ist gerade nicht erreichbar (Vercel Blob nicht konfiguriert?). Bitte später erneut versuchen.",
    };
  }

  const extractedText =
    file.type === "application/pdf" ? await extractTextFromPdf(buffer) : null;

  const id = await insertDocument({
    userId: user.id,
    originalName: file.name,
    storedPath,
    mimeType: file.type,
    sizeBytes: file.size,
    extractedText,
  });

  return {
    document: {
      id,
      user_id: user.id,
      original_name: file.name,
      stored_path: storedPath,
      mime_type: file.type,
      size_bytes: file.size,
      extracted_text: extractedText,
      created_at: new Date().toISOString(),
    },
  };
}

export async function uploadDocumentAction(
  _prevState: UploadFormState,
  formData: FormData
): Promise<UploadFormState> {
  const user = await requireSessionUser();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Bitte eine Datei auswählen." };
  }

  const result = await uploadDocumentCore(user, file);
  if ("error" in result) return { error: result.error };

  revalidatePath("/documents");
  revalidatePath("/home");
  return undefined;
}

export type ChatAttachmentResult =
  | { error: string }
  | { id: string; original_name: string; mime_type: string };

export async function uploadChatAttachmentAction(formData: FormData): Promise<ChatAttachmentResult> {
  const user = await requireSessionUser();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Bitte eine Datei auswählen." };
  }

  const result = await uploadDocumentCore(user, file);
  if ("error" in result) return { error: result.error };

  revalidatePath("/documents");
  return {
    id: result.document.id,
    original_name: result.document.original_name,
    mime_type: result.document.mime_type,
  };
}

export async function deleteDocumentAction(id: string) {
  const user = await requireSessionUser();
  const doc = await getDocument(id, user.id);
  if (!doc) return;

  await deleteDocumentRow(id, user.id);
  await deleteDocumentFile(doc.stored_path);

  revalidatePath("/documents");
  revalidatePath("/home");
}

export async function renameDocumentAction(id: string, name: string) {
  const user = await requireSessionUser();
  if (!name.trim()) return;
  await renameDocument(id, user.id, name.trim());
  revalidatePath("/documents");
}
