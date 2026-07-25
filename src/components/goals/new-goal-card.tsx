"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GoalForm } from "@/components/goals/goal-form";
import { createGoalAction } from "@/lib/actions/goal-actions";

export function NewGoalCard() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button variant="secondary" className="w-full" onClick={() => setOpen(true)}>
        <Plus size={16} /> Neues Ziel
      </Button>
    );
  }

  return (
    <Card>
      <GoalForm action={createGoalAction} onDone={() => setOpen(false)} submitLabel="Ziel anlegen" />
      <button
        onClick={() => setOpen(false)}
        className="mt-3 w-full text-center text-sm text-foreground-muted hover:underline"
      >
        Abbrechen
      </button>
    </Card>
  );
}
