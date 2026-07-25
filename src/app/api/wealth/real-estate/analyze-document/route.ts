import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { extractTextFromDocument, sniffMimeType } from "@/lib/document-extraction";
import { extractExtendedListingData, FIELD_LABELS_EXTENDED, type ExtendedAnalyzedListing } from "@/lib/listing-extraction";

const MAX_FILE_SIZE = 20 * 1024 * 1024;

function noDataResponse() {
  return NextResponse.json({
    success: false,
    error: "Es konnten keine Daten aus dem Dokument extrahiert werden. Bitte manuell ausfüllen.",
  });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ success: false, error: "Keine Datei hochgeladen." }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ success: false, error: "Datei ist zu groß (max. 20 MB)." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const mimeType = sniffMimeType(buffer);
  if (!mimeType) {
    return NextResponse.json(
      { success: false, error: "Nicht unterstütztes Dateiformat. Bitte PDF, JPG, PNG oder WEBP hochladen." },
      { status: 400 }
    );
  }

  let text: string;
  try {
    text = await extractTextFromDocument(buffer, mimeType);
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : "Dokument konnte nicht verarbeitet werden.",
    });
  }

  if (!text) return noDataResponse();

  const data = extractExtendedListingData(text);
  const foundFields = (Object.keys(data) as (keyof ExtendedAnalyzedListing)[]).filter((k) => data[k] !== undefined);
  const missingFields = (Object.keys(FIELD_LABELS_EXTENDED) as (keyof ExtendedAnalyzedListing)[]).filter(
    (k) => !foundFields.includes(k)
  );

  if (foundFields.length === 0) return noDataResponse();

  return NextResponse.json({
    success: true,
    data,
    foundFields: foundFields.map((f) => FIELD_LABELS_EXTENDED[f]),
    missingFields: missingFields.map((f) => FIELD_LABELS_EXTENDED[f]),
  });
}
