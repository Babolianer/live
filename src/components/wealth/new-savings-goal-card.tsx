"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WealthSavingsGoalForm } from "@/components/wealth/wealth-savings-goal-form";
import { createSavingsGoalAction } from "@/lib/actions/wealth-savings-goal-actions";

export function NewSavingsGoalCard() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button variant="secondary" className="w-full" onClick={() => setOpen(true)}>
        <Plus size={16} /> Sparziel hinzufügen
      </Button>
    );
  }

  return (
    <Card>
      <WealthSavingsGoalForm action={createSavingsGoalAction} onDone={() => setOpen(false)} submitLabel="Hinzufügen" />
      <button onClick={() => setOpen(false)} className="mt-3 w-full text-center text-sm text-foreground-muted hover:underline">
        Abbrechen
      </button>
    </Card>
  );
}
