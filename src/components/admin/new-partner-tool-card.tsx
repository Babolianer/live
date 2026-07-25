"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PartnerToolForm } from "@/components/admin/partner-tool-form";
import { createPartnerToolAction } from "@/lib/actions/partner-tool-actions";

export function NewPartnerToolCard() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button variant="secondary" className="w-full" onClick={() => setOpen(true)}>
        <Plus size={16} /> Partner-Tool hinzufügen
      </Button>
    );
  }

  return (
    <Card>
      <PartnerToolForm
        action={createPartnerToolAction}
        onDone={() => setOpen(false)}
        submitLabel="Tool anlegen"
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
