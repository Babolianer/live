"use client";

import { useActionState, useState, useTransition } from "react";
import { Pencil, Trash2, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  createManualSnapshotAction,
  updateManualSnapshotAction,
  deleteSnapshotAction,
  type SnapshotFormState,
} from "@/lib/actions/wealth-snapshot-actions";
import type { NetWorthSnapshotRow } from "@/lib/wealth-types";

type Props = { snapshots: NetWorthSnapshotRow[] };

const inputClass = "w-full rounded-life border border-border bg-surface-muted px-3.5 py-2.5 text-sm outline-none focus:border-accent";
const labelClass = "mb-1.5 block text-sm font-medium";

function toDateInputValue(iso: string) {
  return iso.slice(0, 10);
}

function SnapshotForm({
  action,
  snapshot,
  onDone,
  submitLabel,
}: {
  action: (state: SnapshotFormState, formData: FormData) => Promise<SnapshotFormState>;
  snapshot?: NetWorthSnapshotRow;
  onDone: () => void;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState<SnapshotFormState, FormData>(async (prevState, formData) => {
    const result = await action(prevState, formData);
    if (!result?.error) onDone();
    return result;
  }, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={labelClass} htmlFor="date">
            Datum
          </label>
          <input
            id="date"
            name="date"
            type="date"
            required
            defaultValue={snapshot ? toDateInputValue(snapshot.date) : new Date().toISOString().slice(0, 10)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="netWorth">
            Nettovermögen (€)
          </label>
          <input id="netWorth" name="netWorth" type="number" step="any" required defaultValue={snapshot?.net_worth} className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="totalDebts">
            Schulden (€)
          </label>
          <input id="totalDebts" name="totalDebts" type="number" step="any" defaultValue={snapshot?.total_debts ?? 0} className={inputClass} />
        </div>
      </div>
      {state?.error && <p className="rounded-life bg-danger/10 px-3.5 py-2.5 text-sm text-danger">{state.error}</p>}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Wird gespeichert…" : submitLabel}
      </Button>
    </form>
  );
}

export function WealthSnapshotEditor({ snapshots }: Props) {
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const recent = [...snapshots].reverse().slice(0, 15);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="w-full text-center text-sm text-foreground-muted hover:underline">
        Verlauf manuell bearbeiten
      </button>
    );
  }

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="font-heading font-semibold">Verlauf bearbeiten</p>
        <button onClick={() => setOpen(false)} className="text-sm text-foreground-muted hover:underline">
          Schließen
        </button>
      </div>
      <p className="text-sm text-foreground-muted">
        Trage einen historischen Nettovermögens-Stand nach (z. B. aus einem alten Kontoauszug) oder korrigiere einen bestehenden.
      </p>

      <div className="flex flex-col divide-y divide-border">
        {recent.map((s) =>
          editingId === s.id ? (
            <div key={s.id} className="py-3">
              <SnapshotForm
                action={updateManualSnapshotAction.bind(null, s.id)}
                snapshot={s}
                onDone={() => setEditingId(null)}
                submitLabel="Änderungen speichern"
              />
              <button onClick={() => setEditingId(null)} className="mt-2 w-full text-center text-sm text-foreground-muted hover:underline">
                Abbrechen
              </button>
            </div>
          ) : (
            <div key={s.id} className="flex items-center justify-between gap-3 py-2 text-sm">
              <span className="text-foreground-muted">{s.date.slice(0, 10)}</span>
              <span className="font-medium">€ {s.net_worth.toLocaleString("de-DE", { maximumFractionDigits: 0 })}</span>
              <div className="flex shrink-0 items-center gap-2">
                <button aria-label="Bearbeiten" onClick={() => setEditingId(s.id)} className="rounded-md p-1.5 text-foreground-muted hover:bg-surface-muted">
                  <Pencil size={14} />
                </button>
                <button
                  aria-label="Löschen"
                  disabled={isPending}
                  onClick={() => startTransition(() => deleteSnapshotAction(s.id))}
                  className="rounded-md p-1.5 text-danger hover:bg-surface-muted"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          )
        )}
        {recent.length === 0 && <p className="py-2 text-sm text-foreground-muted">Noch keine Einträge.</p>}
      </div>

      {adding ? (
        <div className="border-t border-border pt-3">
          <SnapshotForm action={createManualSnapshotAction} onDone={() => setAdding(false)} submitLabel="Hinzufügen" />
          <button onClick={() => setAdding(false)} className="mt-2 w-full text-center text-sm text-foreground-muted hover:underline">
            Abbrechen
          </button>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center justify-center gap-1.5 rounded-life border border-dashed border-border py-2 text-sm text-foreground-muted hover:bg-surface-muted"
        >
          <Plus size={14} /> Stand hinzufügen
        </button>
      )}
    </Card>
  );
}
