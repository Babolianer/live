"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2, Plus } from "lucide-react";
import { WealthDebtForm } from "@/components/wealth/wealth-debt-form";
import { updateDebtAction, deleteDebtAction, createDebtAction } from "@/lib/actions/wealth-debt-actions";
import type { WealthDebtRow } from "@/lib/wealth-finance";

function DebtRow({ debt, assetId }: { debt: WealthDebtRow; assetId: string }) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (editing) {
    return (
      <div className="rounded-life border border-border p-3">
        <WealthDebtForm action={updateDebtAction.bind(null, debt.id)} assetId={assetId} debt={debt} onDone={() => setEditing(false)} submitLabel="Änderungen speichern" />
        <button onClick={() => setEditing(false)} className="mt-2 w-full text-center text-xs text-foreground-muted hover:underline">
          Abbrechen
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{debt.name}</p>
        <p className="text-xs text-foreground-muted">
          Restschuld € {debt.remaining_amount.toLocaleString("de-DE")} · {debt.interest_rate}% · € {debt.monthly_payment.toLocaleString("de-DE")}/Monat
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button aria-label="Bearbeiten" onClick={() => setEditing(true)} className="rounded-md p-1.5 text-foreground-muted hover:bg-surface-muted">
          <Pencil size={14} />
        </button>
        <button
          aria-label="Löschen"
          disabled={isPending}
          onClick={() => startTransition(() => deleteDebtAction(debt.id, assetId))}
          className="rounded-md p-1.5 text-danger hover:bg-surface-muted"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

export function WealthDebtSection({ debts, assetId }: { debts: WealthDebtRow[]; assetId: string }) {
  const [adding, setAdding] = useState(false);

  return (
    <div className="flex flex-col divide-y divide-border">
      {debts.map((debt) => (
        <DebtRow key={debt.id} debt={debt} assetId={assetId} />
      ))}
      {adding ? (
        <div className="pt-3">
          <WealthDebtForm action={createDebtAction} assetId={assetId} onDone={() => setAdding(false)} submitLabel="Schuld hinzufügen" />
          <button onClick={() => setAdding(false)} className="mt-2 w-full text-center text-xs text-foreground-muted hover:underline">
            Abbrechen
          </button>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="mt-2 flex items-center justify-center gap-1.5 rounded-life border border-dashed border-border py-2 text-sm text-foreground-muted hover:bg-surface-muted"
        >
          <Plus size={14} /> Schuld hinzufügen
        </button>
      )}
    </div>
  );
}
