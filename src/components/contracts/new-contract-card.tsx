"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ContractForm } from "@/components/contracts/contract-form";
import { createContractAction } from "@/lib/actions/contract-actions";

export function NewContractCard({
  documents,
}: {
  documents: { id: string; original_name: string }[];
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button variant="secondary" className="w-full" onClick={() => setOpen(true)}>
        <Plus size={16} /> Neuer Vertrag
      </Button>
    );
  }

  return (
    <Card>
      <ContractForm
        action={createContractAction}
        documents={documents}
        onDone={() => setOpen(false)}
        submitLabel="Vertrag anlegen"
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
