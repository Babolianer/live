"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WealthGroupForm } from "@/components/wealth/wealth-group-form";
import { createWealthGroupAction } from "@/lib/actions/wealth-group-actions";

export function NewWealthGroupCard() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button variant="secondary" className="w-full" onClick={() => setOpen(true)}>
        <Plus size={16} /> Gruppe hinzufügen
      </Button>
    );
  }

  return (
    <Card>
      <WealthGroupForm action={createWealthGroupAction} onDone={() => setOpen(false)} submitLabel="Hinzufügen" />
      <button onClick={() => setOpen(false)} className="mt-3 w-full text-center text-sm text-foreground-muted hover:underline">
        Abbrechen
      </button>
    </Card>
  );
}
