"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WealthForm } from "@/components/wealth/wealth-form";
import { createWealthEntryAction } from "@/lib/actions/wealth-actions";

export function NewWealthCard() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button variant="secondary" className="w-full" onClick={() => setOpen(true)}>
        <Plus size={16} /> Vermögenswert hinzufügen
      </Button>
    );
  }

  return (
    <Card>
      <WealthForm
        action={createWealthEntryAction}
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
