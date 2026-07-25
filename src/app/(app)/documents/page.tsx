import { Search } from "lucide-react";
import { requireSessionUser } from "@/lib/auth";
import { listDocuments } from "@/lib/documents";
import { Card } from "@/components/ui/card";
import { UploadForm } from "@/components/documents/upload-form";
import { DocumentRow } from "@/components/documents/document-row";

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await requireSessionUser();
  const { q } = await searchParams;
  const documents = await listDocuments(user.id, q);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Dokumente</h1>
        <p className="text-sm text-foreground-muted">
          Lade Verträge, Rechnungen und andere Dokumente hoch — LIFE hält sie
          durchsuchbar an einem Ort.
        </p>
      </div>

      <Card>
        <UploadForm />
      </Card>

      <form method="get" className="relative">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground-muted"
          size={16}
        />
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Dokumente durchsuchen…"
          className="w-full rounded-life border border-border bg-surface px-9 py-2.5 text-sm outline-none focus:border-accent"
        />
      </form>

      <div className="flex flex-col gap-2">
        {documents.length === 0 ? (
          <p className="py-8 text-center text-sm text-foreground-muted">
            {q ? "Keine Dokumente gefunden." : "Noch keine Dokumente hochgeladen."}
          </p>
        ) : (
          documents.map((doc) => <DocumentRow key={doc.id} doc={doc} />)
        )}
      </div>
    </div>
  );
}
