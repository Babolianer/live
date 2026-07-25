"use client";

import { useState, useTransition } from "react";
import { FileText, Trash2, Pencil, Check, X } from "lucide-react";
import {
  deleteDocumentAction,
  renameDocumentAction,
} from "@/lib/actions/document-actions";
import type { DocumentRow as DocumentRowType } from "@/lib/documents";

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function DocumentRow({ doc }: { doc: DocumentRowType }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(doc.original_name);
  const [isPending, startTransition] = useTransition();
  const isImage = doc.mime_type.startsWith("image/");

  return (
    <div className="flex items-center gap-3 rounded-life border border-border bg-surface p-3">
      <a
        href={`/api/documents/${doc.id}/file`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-life bg-surface-muted"
      >
        {isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/documents/${doc.id}/file`}
            alt={doc.original_name}
            className="h-full w-full object-cover"
          />
        ) : (
          <FileText className="text-accent" size={20} />
        )}
      </a>

      <div className="min-w-0 flex-1">
        {editing ? (
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-border bg-surface-muted px-2 py-1 text-sm"
            autoFocus
          />
        ) : (
          <p className="truncate text-sm font-medium">{doc.original_name}</p>
        )}
        <p className="text-xs text-foreground-muted">
          {formatDate(doc.created_at)} · {formatSize(doc.size_bytes)}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {editing ? (
          <>
            <button
              aria-label="Speichern"
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  await renameDocumentAction(doc.id, name);
                  setEditing(false);
                })
              }
              className="rounded-md p-1.5 text-success hover:bg-surface-muted"
            >
              <Check size={16} />
            </button>
            <button
              aria-label="Abbrechen"
              onClick={() => {
                setName(doc.original_name);
                setEditing(false);
              }}
              className="rounded-md p-1.5 text-foreground-muted hover:bg-surface-muted"
            >
              <X size={16} />
            </button>
          </>
        ) : (
          <>
            <button
              aria-label="Umbenennen"
              onClick={() => setEditing(true)}
              className="rounded-md p-1.5 text-foreground-muted hover:bg-surface-muted"
            >
              <Pencil size={16} />
            </button>
            <button
              aria-label="Löschen"
              disabled={isPending}
              onClick={() => startTransition(() => deleteDocumentAction(doc.id))}
              className="rounded-md p-1.5 text-danger hover:bg-surface-muted"
            >
              <Trash2 size={16} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
