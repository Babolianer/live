"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PropertyForm } from "@/components/properties/property-form";
import { createPropertyAction } from "@/lib/actions/property-actions";

export function NewPropertyCard({
  documents,
}: {
  documents: { id: string; original_name: string }[];
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button variant="secondary" className="w-full" onClick={() => setOpen(true)}>
        <Plus size={16} /> Immobilie hinzufügen
      </Button>
    );
  }

  return (
    <Card>
      <PropertyForm
        action={createPropertyAction}
        documents={documents}
        onDone={() => setOpen(false)}
        submitLabel="Hinzufügen"
      />
      <button
        onClick={() => setOpen(false)}
        className="mt-3 w-full text-center text-sm text-foreground-muted hover:underline"
      >
        Abbrechen
      </button>
    </Card>
  );
}
