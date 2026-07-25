"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WealthExpenseForm } from "@/components/wealth/wealth-expense-form";
import { createExpenseAction } from "@/lib/actions/wealth-expense-actions";

export function NewExpenseCard() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button variant="secondary" className="w-full" onClick={() => setOpen(true)}>
        <Plus size={16} /> Buchung hinzufügen
      </Button>
    );
  }

  return (
    <Card>
      <WealthExpenseForm action={createExpenseAction} onDone={() => setOpen(false)} submitLabel="Hinzufügen" />
      <button onClick={() => setOpen(false)} className="mt-3 w-full text-center text-sm text-foreground-muted hover:underline">
        Abbrechen
      </button>
    </Card>
  );
}
