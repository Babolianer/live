"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { WealthSavingsGoalForm } from "@/components/wealth/wealth-savings-goal-form";
import { updateSavingsGoalAction, deleteSavingsGoalAction } from "@/lib/actions/wealth-savings-goal-actions";
import type { WealthSavingsGoalRow } from "@/lib/wealth-savings-goals";
import type { SavingsGoalProgress } from "@/lib/wealth-types";

export function WealthSavingsGoalRowItem({ goal, progress }: { goal: WealthSavingsGoalRow; progress?: SavingsGoalProgress }) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (editing) {
    return (
      <Card>
        <WealthSavingsGoalForm action={updateSavingsGoalAction.bind(null, goal.id)} goal={goal} onDone={() => setEditing(false)} submitLabel="Änderungen speichern" />
        <button onClick={() => setEditing(false)} className="mt-3 w-full text-center text-sm text-foreground-muted hover:underline">
          Abbrechen
        </button>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-medium">{goal.name}</p>
          {progress && (
            <>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-muted">
                <div className="h-full bg-accent" style={{ width: `${Math.min(progress.progressPercent, 100)}%` }} />
              </div>
              <p className="mt-1 text-xs text-foreground-muted">
                € {progress.currentValue.toLocaleString("de-DE", { maximumFractionDigits: 0 })} / {progress.targetLabel} ({progress.progressPercent}%)
              </p>
            </>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button aria-label="Bearbeiten" onClick={() => setEditing(true)} className="rounded-md p-1.5 text-foreground-muted hover:bg-surface-muted">
            <Pencil size={16} />
          </button>
          <button
            aria-label="Löschen"
            disabled={isPending}
            onClick={() => startTransition(() => deleteSavingsGoalAction(goal.id))}
            className="rounded-md p-1.5 text-danger hover:bg-surface-muted"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </Card>
  );
}
