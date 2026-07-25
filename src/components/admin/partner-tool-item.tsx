"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { categoryLabel, categoryColor } from "@/lib/category-style";
import { PartnerToolForm } from "@/components/admin/partner-tool-form";
import {
  updatePartnerToolAction,
  deletePartnerToolAction,
} from "@/lib/actions/partner-tool-actions";
import { buildDeepLink } from "@/lib/deep-link";
import type { PartnerToolRow } from "@/lib/partner-tools";

export function PartnerToolItem({ tool }: { tool: PartnerToolRow }) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (editing) {
    return (
      <Card>
        <PartnerToolForm
          action={updatePartnerToolAction.bind(null, tool.id)}
          tool={tool}
          onDone={() => setEditing(false)}
          submitLabel="Änderungen speichern"
        />
        <button
          onClick={() => setEditing(false)}
          className="mt-3 w-full text-center text-sm text-foreground-muted hover:underline"
        >
          Abbrechen
        </button>
      </Card>
    );
  }

  return (
    <Card className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${categoryColor(tool.category)}`}
          >
            {categoryLabel(tool.category)}
          </span>
          {!tool.enabled && (
            <span className="rounded-full bg-surface-muted px-2.5 py-0.5 text-xs font-medium text-foreground-muted">
              Deaktiviert
            </span>
          )}
        </div>
        <p className="font-medium">{tool.provider_name}</p>
        <a
          href={buildDeepLink(tool)}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="mt-1 flex items-center gap-1 truncate text-sm text-accent"
        >
          <ExternalLink size={13} className="shrink-0" />
          <span className="truncate">{buildDeepLink(tool)}</span>
        </a>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <button
          aria-label="Bearbeiten"
          onClick={() => setEditing(true)}
          className="rounded-md p-1.5 text-foreground-muted hover:bg-surface-muted"
        >
          <Pencil size={16} />
        </button>
        <button
          aria-label="Löschen"
          disabled={isPending}
          onClick={() => startTransition(() => deletePartnerToolAction(tool.id))}
          className="rounded-md p-1.5 text-danger hover:bg-surface-muted"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </Card>
  );
}
