import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getDocument } from "@/lib/documents";
import { readDocumentFile } from "@/lib/storage";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const { id } = await params;
  const doc = await getDocument(id, user.id);
  if (!doc) {
    return NextResponse.json({ error: "Dokument nicht gefunden." }, { status: 404 });
  }

  const file = await readDocumentFile(doc.stored_path);
  if (!file) {
    return NextResponse.json({ error: "Datei nicht gefunden." }, { status: 404 });
  }

  return new NextResponse(file.stream, {
    headers: {
      "Content-Type": doc.mime_type,
      "Content-Disposition": `inline; filename="${encodeURIComponent(doc.original_name)}"`,
      "Cache-Control": "private, max-age=3600",
      "Content-Length": String(file.size),
    },
  });
}
