"use client";

import { useActionState } from "react";
import { WEALTH_CATEGORIES } from "@/lib/wealth-constants";
import { categoryLabel } from "@/lib/category-style";
import { Button } from "@/components/ui/button";
import type { WealthFormState } from "@/lib/actions/wealth-actions";
import type { WealthEntryRow } from "@/lib/wealth";

type Props = {
  action: (state: WealthFormState, formData: FormData) => Promise<WealthFormState>;
  entry?: Partial<WealthEntryRow>;
  onDone?: () => void;
  submitLabel?: string;
};

const inputClass =
  "w-full rounded-life border border-border bg-surface-muted px-3.5 py-2.5 text-sm outline-none focus:border-accent";
const labelClass = "mb-1.5 block text-sm font-medium";

export function WealthForm({ action, entry, onDone, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState<WealthFormState, FormData>(
    async (prevState, formData) => {
      const result = await action(prevState, formData);
      if (!result?.error) onDone?.();
      return result;
    },
    undefined
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <label className={labelClass} htmlFor="name">
          Name
        </label>
        <input
          id="name"
          name="name"
          required
          defaultValue={entry?.name}
          placeholder="z. B. Girokonto, Depot ING, Bitcoin Wallet"
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass} htmlFor="category">
            Kategorie
          </label>
          <select
            id="category"
            name="category"
            defaultValue={entry?.category ?? "konto"}
            className={inputClass}
          >
            {WEALTH_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {categoryLabel(c)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="value">
            Wert (€)
          </label>
          <input
            id="value"
            name="value"
            type="number"
            step="0.01"
            required
            defaultValue={entry?.value}
            placeholder="12500"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="notes">
          Notizen
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={2}
          defaultValue={entry?.notes ?? ""}
          className={inputClass}
        />
      </div>

      {state?.error && (
        <p className="rounded-life bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Wird gespeichert…" : (submitLabel ?? "Speichern")}
      </Button>
    </form>
  );
}
