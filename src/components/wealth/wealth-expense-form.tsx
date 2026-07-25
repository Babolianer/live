"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { EXPENSE_CATEGORIES } from "@/lib/wealth-asset-constants";
import type { WealthExpenseFormState } from "@/lib/actions/wealth-expense-actions";
import type { WealthExpenseRow } from "@/lib/wealth-expenses";

type Props = {
  action: (state: WealthExpenseFormState, formData: FormData) => Promise<WealthExpenseFormState>;
  expense?: Partial<WealthExpenseRow>;
  onDone?: () => void;
  submitLabel?: string;
};

const inputClass = "w-full rounded-life border border-border bg-surface-muted px-3.5 py-2.5 text-sm outline-none focus:border-accent";
const labelClass = "mb-1.5 block text-sm font-medium";

export function WealthExpenseForm({ action, expense, onDone, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState<WealthExpenseFormState, FormData>(async (prevState, formData) => {
    const result = await action(prevState, formData);
    if (!result?.error) onDone?.();
    return result;
  }, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div>
        <label className={labelClass} htmlFor="description">
          Beschreibung
        </label>
        <input id="description" name="description" required defaultValue={expense?.description} placeholder="z. B. Gehalt, Miete" className={inputClass} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass} htmlFor="type">
            Typ
          </label>
          <select id="type" name="type" defaultValue={expense?.type ?? "EXPENSE"} className={inputClass}>
            <option value="INCOME">Einnahme</option>
            <option value="EXPENSE">Ausgabe</option>
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="amount">
            Betrag (€)
          </label>
          <input id="amount" name="amount" type="number" step="any" required defaultValue={expense?.amount} className={inputClass} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass} htmlFor="category">
            Kategorie
          </label>
          <select id="category" name="category" defaultValue={expense?.category ?? "Sonstiges"} className={inputClass}>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="date">
            Datum
          </label>
          <input id="date" name="date" type="date" required defaultValue={expense?.date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10)} className={inputClass} />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isRecurring" defaultChecked={!!expense?.is_recurring} />
        Wiederkehrend
      </label>

      {state?.error && <p className="rounded-life bg-danger/10 px-3.5 py-2.5 text-sm text-danger">{state.error}</p>}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Wird gespeichert…" : (submitLabel ?? "Speichern")}
      </Button>
    </form>
  );
}
