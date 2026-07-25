"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2, FileText, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PropertyForm } from "@/components/properties/property-form";
import { updatePropertyAction, deletePropertyAction } from "@/lib/actions/property-actions";
import type { PropertyRow } from "@/lib/properties";

export function PropertyItem({
  property,
  documents,
}: {
  property: PropertyRow;
  documents: { id: string; original_name: string }[];
}) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (editing) {
    return (
      <Card>
        <PropertyForm
          action={updatePropertyAction.bind(null, property.id)}
          property={property}
          documents={documents}
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
          {property.document_id && <FileText size={14} className="text-foreground-muted" />}
        </div>
        <p className="truncate font-medium">{property.name}</p>
        {property.address && (
          <p className="flex items-center gap-1 truncate text-sm text-foreground-muted">
            <MapPin size={12} /> {property.address}
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {property.value != null && (
          <span className="font-semibold">
            € {property.value.toLocaleString("de-DE", { maximumFractionDigits: 0 })}
          </span>
        )}
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
            onClick={() => startTransition(() => deletePropertyAction(property.id))}
            className="rounded-md p-1.5 text-danger hover:bg-surface-muted"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </Card>
  );
}
