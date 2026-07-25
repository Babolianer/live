"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { categoryLabel, categoryColor } from "@/lib/category-style";
import { WealthForm } from "@/components/wealth/wealth-form";
import { updateWealthEntryAction, deleteWealthEntryAction } from "@/lib/actions/wealth-actions";
import type { WealthEntryRow } from "@/lib/wealth";

export function WealthItem({ entry }: { entry: WealthEntryRow }) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (editing) {
    return (
      <Card>
        <WealthForm
          action={updateWealthEntryAction.bind(null, entry.id)}
          entry={entry}
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
    <Card className="flex items-center justify-between gap-3">
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${categoryColor(entry.category)}`}
          >
            {categoryLabel(entry.category)}
          </span>
        </div>
        <p className="truncate font-medium">{entry.name}</p>
        {entry.notes && <p className="truncate text-sm text-foreground-muted">{entry.notes}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span className="font-semibold">
          € {entry.value.toLocaleString("de-DE", { maximumFractionDigits: 0 })}
        </span>
        <div className="flex items-center gap-1">
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
            onClick={() => startTransition(() => deleteWealthEntryAction(entry.id))}
            className="rounded-md p-1.5 text-danger hover:bg-surface-muted"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </Card>
  );
}
