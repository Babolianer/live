"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { ASSET_TYPES, ASSET_TYPE_LABELS } from "@/lib/wealth-asset-constants";
import type { WealthSavingsGoalFormState } from "@/lib/actions/wealth-savings-goal-actions";
import type { WealthSavingsGoalRow } from "@/lib/wealth-savings-goals";

type Props = {
  action: (state: WealthSavingsGoalFormState, formData: FormData) => Promise<WealthSavingsGoalFormState>;
  goal?: Partial<WealthSavingsGoalRow>;
  onDone?: () => void;
  submitLabel?: string;
};

const inputClass = "w-full rounded-life border border-border bg-surface-muted px-3.5 py-2.5 text-sm outline-none focus:border-accent";
const labelClass = "mb-1.5 block text-sm font-medium";

export function WealthSavingsGoalForm({ action, goal, onDone, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState<WealthSavingsGoalFormState, FormData>(async (prevState, formData) => {
    const result = await action(prevState, formData);
    if (!result?.error) onDone?.();
    return result;
  }, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div>
        <label className={labelClass} htmlFor="name">
          Name
        </label>
        <input id="name" name="name" required defaultValue={goal?.name} placeholder="z. B. Notgroschen, Kryptoquote" className={inputClass} />
      </div>
      <div>
        <label className={labelClass} htmlFor="targetType">
          Bezieht sich auf
        </label>
        <select id="targetType" name="targetType" defaultValue={goal?.target_type ?? "CASH"} className={inputClass}>
          {ASSET_TYPES.map((t) => (
            <option key={t} value={t}>
              {ASSET_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass} htmlFor="targetAmount">
            Zielbetrag (€)
          </label>
          <input id="targetAmount" name="targetAmount" type="number" step="any" required defaultValue={goal?.target_amount} className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="monthlyContribution">
            Monatlicher Beitrag (€)
          </label>
          <input id="monthlyContribution" name="monthlyContribution" type="number" step="any" defaultValue={goal?.monthly_contribution ?? 0} className={inputClass} />
        </div>
      </div>
      <input type="hidden" name="unitLabel" value="EUR" />

      {state?.error && <p className="rounded-life bg-danger/10 px-3.5 py-2.5 text-sm text-danger">{state.error}</p>}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Wird gespeichert…" : (submitLabel ?? "Speichern")}
      </Button>
    </form>
  );
}
