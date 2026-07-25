"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { WealthExpenseForm } from "@/components/wealth/wealth-expense-form";
import { updateExpenseAction, deleteExpenseAction } from "@/lib/actions/wealth-expense-actions";
import type { WealthExpenseRow } from "@/lib/wealth-expenses";

export function WealthExpenseRowItem({ expense }: { expense: WealthExpenseRow }) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (editing) {
    return (
      <div className="rounded-life border border-border p-3">
        <WealthExpenseForm action={updateExpenseAction.bind(null, expense.id)} expense={expense} onDone={() => setEditing(false)} submitLabel="Änderungen speichern" />
        <button onClick={() => setEditing(false)} className="mt-2 w-full text-center text-xs text-foreground-muted hover:underline">
          Abbrechen
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{expense.description}</p>
        <p className="text-xs text-foreground-muted">
          {new Date(expense.date).toLocaleDateString("de-DE")} · {expense.category}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span className={`font-semibold ${expense.type === "INCOME" ? "text-success" : "text-foreground"}`}>
          {expense.type === "INCOME" ? "+" : "−"}€ {expense.amount.toLocaleString("de-DE", { maximumFractionDigits: 0 })}
        </span>
        <button aria-label="Bearbeiten" onClick={() => setEditing(true)} className="rounded-md p-1.5 text-foreground-muted hover:bg-surface-muted">
          <Pencil size={14} />
        </button>
        <button
          aria-label="Löschen"
          disabled={isPending}
          onClick={() => startTransition(() => deleteExpenseAction(expense.id))}
          className="rounded-md p-1.5 text-danger hover:bg-surface-muted"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
