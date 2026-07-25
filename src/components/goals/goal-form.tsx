"use client";

import { useActionState } from "react";
import { GOAL_CATEGORIES } from "@/lib/goal-constants";
import { categoryLabel } from "@/lib/category-style";
import { Button } from "@/components/ui/button";
import type { GoalFormState } from "@/lib/actions/goal-actions";
import type { GoalRow } from "@/lib/goals";

type Props = {
  action: (state: GoalFormState, formData: FormData) => Promise<GoalFormState>;
  goal?: GoalRow;
  onDone?: () => void;
  submitLabel?: string;
};

const inputClass =
  "w-full rounded-life border border-border bg-surface-muted px-3.5 py-2.5 text-sm outline-none focus:border-accent";
const labelClass = "mb-1.5 block text-sm font-medium";

export function GoalForm({ action, goal, onDone, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState<GoalFormState, FormData>(
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
          defaultValue={goal?.name}
          placeholder="z. B. Thailand Reise 2026"
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="category">
          Kategorie
        </label>
        <select
          id="category"
          name="category"
          defaultValue={goal?.category ?? "sonstiges"}
          className={inputClass}
        >
          {GOAL_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {categoryLabel(c)}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass} htmlFor="targetAmount">
            Zielbetrag (€)
          </label>
          <input
            id="targetAmount"
            name="targetAmount"
            type="number"
            step="0.01"
            min="0.01"
            required
            defaultValue={goal?.target_amount}
            placeholder="4000"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="currentAmount">
            Aktueller Stand (€)
          </label>
          <input
            id="currentAmount"
            name="currentAmount"
            type="number"
            step="0.01"
            min="0"
            defaultValue={goal?.current_amount ?? 0}
            placeholder="0"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="targetDate">
          Zieldatum (optional)
        </label>
        <input
          id="targetDate"
          name="targetDate"
          type="date"
          defaultValue={goal?.target_date ?? ""}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="notes">
          Notizen
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={2}
          defaultValue={goal?.notes ?? ""}
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
