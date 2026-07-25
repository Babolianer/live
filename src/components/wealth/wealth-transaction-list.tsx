"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { WealthTransactionForm } from "@/components/wealth/wealth-transaction-form";
import { updateTransactionAction, deleteTransactionAction } from "@/lib/actions/wealth-transaction-actions";
import type { WealthTransactionRow } from "@/lib/wealth-finance";

function TransactionRow({ tx, assetId }: { tx: WealthTransactionRow; assetId: string }) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (editing) {
    return (
      <div className="rounded-life border border-border p-3">
        <WealthTransactionForm
          action={updateTransactionAction.bind(null, tx.id, assetId)}
          transaction={tx}
          onDone={() => setEditing(false)}
          submitLabel="Änderungen speichern"
        />
        <button onClick={() => setEditing(false)} className="mt-2 w-full text-center text-xs text-foreground-muted hover:underline">
          Abbrechen
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">
          {tx.type === "BUY" ? "Kauf" : "Verkauf"} {tx.quantity.toLocaleString("de-DE")} @ € {tx.price_per_unit.toLocaleString("de-DE")}
          {tx.is_anchor ? <span className="ml-1.5 text-xs text-foreground-muted">(Startbestand)</span> : null}
        </p>
        <p className="text-xs text-foreground-muted">
          {new Date(tx.date).toLocaleDateString("de-DE")}
          {tx.notes ? ` · ${tx.notes}` : ""}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button aria-label="Bearbeiten" onClick={() => setEditing(true)} className="rounded-md p-1.5 text-foreground-muted hover:bg-surface-muted">
          <Pencil size={14} />
        </button>
        <button
          aria-label="Löschen"
          disabled={isPending}
          onClick={() => startTransition(() => deleteTransactionAction(tx.id, assetId))}
          className="rounded-md p-1.5 text-danger hover:bg-surface-muted"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

export function WealthTransactionList({ transactions, assetId }: { transactions: WealthTransactionRow[]; assetId: string }) {
  if (transactions.length === 0) {
    return <p className="py-4 text-center text-sm text-foreground-muted">Noch keine Transaktionen.</p>;
  }
  return (
    <div className="flex flex-col divide-y divide-border">
      {transactions.map((tx) => (
        <TransactionRow key={tx.id} tx={tx} assetId={assetId} />
      ))}
    </div>
  );
}
