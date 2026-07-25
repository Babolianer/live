"use server";

import { revalidatePath } from "next/cache";
import { requireSessionUser } from "@/lib/auth";
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
} from "@/lib/documents";

export type UploadFormState = { error?: string } | undefined;

export async function uploadDocumentAction(
  _prevState: UploadFormState,
  formData: FormData
): Promise<UploadFormState> {
  const user = await requireSessionUser();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Bitte eine Datei auswählen." };
  }
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

  const storedPath = await saveDocumentFile(user.id, file.name, buffer, file.type);
  const extractedText =
    file.type === "application/pdf" ? await extractTextFromPdf(buffer) : null;

  await insertDocument({
    userId: user.id,
    originalName: file.name,
    storedPath,
    mimeType: file.type,
    sizeBytes: file.size,
    extractedText,
  });

  revalidatePath("/documents");
  revalidatePath("/home");
  return undefined;
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
