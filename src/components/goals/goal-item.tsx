"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2, PartyPopper } from "lucide-react";
import { Card } from "@/components/ui/card";
import { categoryLabel, categoryColor } from "@/lib/category-style";
import { GoalForm } from "@/components/goals/goal-form";
import {
  updateGoalAction,
  deleteGoalAction,
  updateGoalProgressAction,
} from "@/lib/actions/goal-actions";
import type { GoalRow } from "@/lib/goals";

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function GoalItem({ goal }: { goal: GoalRow }) {
  const [editing, setEditing] = useState(false);
  const [addAmount, setAddAmount] = useState("");
  const [isPending, startTransition] = useTransition();
  const percent = Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100));
  const achieved = !!goal.achieved_at;

  if (editing) {
    return (
      <Card>
        <GoalForm
          action={updateGoalAction.bind(null, goal.id)}
          goal={goal}
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
    <Card>
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${categoryColor(goal.category)}`}
            >
              {categoryLabel(goal.category)}
            </span>
            {achieved && (
              <span className="flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-medium text-success">
                <PartyPopper size={12} /> Erreicht
              </span>
            )}
          </div>
          <p className="truncate font-medium">{goal.name}</p>
          {goal.target_date && (
            <p className="text-sm text-foreground-muted">Ziel: {formatDate(goal.target_date)}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
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
            onClick={() => startTransition(() => deleteGoalAction(goal.id))}
            className="rounded-md p-1.5 text-danger hover:bg-surface-muted"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="font-medium">
          € {goal.current_amount.toLocaleString("de-DE")} / €{" "}
          {goal.target_amount.toLocaleString("de-DE")}
        </span>
        <span className="text-foreground-muted">{percent}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
        <div
          className={`h-full rounded-full ${achieved ? "bg-success" : "bg-accent"}`}
          style={{ width: `${percent}%` }}
        />
      </div>

      {!achieved && (
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const value = Number(addAmount);
            if (!value) return;
            startTransition(() =>
              updateGoalProgressAction(goal.id, goal.current_amount + value)
            );
            setAddAmount("");
          }}
        >
          <input
            type="number"
            step="0.01"
            value={addAmount}
            onChange={(e) => setAddAmount(e.target.value)}
            placeholder="Betrag hinzufügen (€)"
            className="flex-1 rounded-life border border-border bg-surface-muted px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={isPending || !addAmount}
            className="rounded-life bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-40"
          >
            +
          </button>
        </form>
      )}
    </Card>
  );
}
