"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import type { WealthTransactionFormState } from "@/lib/actions/wealth-transaction-actions";
import type { WealthTransactionRow } from "@/lib/wealth-finance";

type Props = {
  action: (state: WealthTransactionFormState, formData: FormData) => Promise<WealthTransactionFormState>;
  transaction?: Partial<WealthTransactionRow>;
  onDone?: () => void;
  submitLabel?: string;
};

const inputClass = "w-full rounded-life border border-border bg-surface-muted px-3.5 py-2.5 text-sm outline-none focus:border-accent";
const labelClass = "mb-1.5 block text-sm font-medium";

function toDateInputValue(iso?: string) {
  if (!iso) return new Date().toISOString().slice(0, 10);
  return iso.slice(0, 10);
}

export function WealthTransactionForm({ action, transaction, onDone, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState<WealthTransactionFormState, FormData>(async (prevState, formData) => {
    const result = await action(prevState, formData);
    if (!result?.error) onDone?.();
    return result;
  }, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={labelClass} htmlFor="type">
            Typ
          </label>
          <select id="type" name="type" defaultValue={transaction?.type ?? "BUY"} className={inputClass}>
            <option value="BUY">Kauf</option>
            <option value="SELL">Verkauf</option>
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="quantity">
            Menge
          </label>
          <input id="quantity" name="quantity" type="number" step="any" required defaultValue={transaction?.quantity} className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="pricePerUnit">
            Preis/Einheit (€)
          </label>
          <input id="pricePerUnit" name="pricePerUnit" type="number" step="any" required defaultValue={transaction?.price_per_unit} className={inputClass} />
        </div>
      </div>
      <div>
        <label className={labelClass} htmlFor="date">
          Datum
        </label>
        <input id="date" name="date" type="date" required defaultValue={toDateInputValue(transaction?.date)} className={inputClass} />
      </div>
      <div>
        <label className={labelClass} htmlFor="notes">
          Notizen
        </label>
        <input id="notes" name="notes" defaultValue={transaction?.notes ?? ""} className={inputClass} />
      </div>

      {state?.error && <p className="rounded-life bg-danger/10 px-3.5 py-2.5 text-sm text-danger">{state.error}</p>}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Wird gespeichert…" : (submitLabel ?? "Buchen")}
      </Button>
    </form>
  );
}
