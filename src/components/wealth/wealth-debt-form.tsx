"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import type { WealthDebtFormState } from "@/lib/actions/wealth-debt-actions";
import type { WealthDebtRow } from "@/lib/wealth-finance";

type Props = {
  action: (state: WealthDebtFormState, formData: FormData) => Promise<WealthDebtFormState>;
  assetId: string;
  debt?: Partial<WealthDebtRow>;
  onDone?: () => void;
  submitLabel?: string;
};

const inputClass = "w-full rounded-life border border-border bg-surface-muted px-3.5 py-2.5 text-sm outline-none focus:border-accent";
const labelClass = "mb-1.5 block text-sm font-medium";

export function WealthDebtForm({ action, assetId, debt, onDone, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState<WealthDebtFormState, FormData>(async (prevState, formData) => {
    const result = await action(prevState, formData);
    if (!result?.error) onDone?.();
    return result;
  }, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="assetId" value={assetId} />
      <div>
        <label className={labelClass} htmlFor="name">
          Name
        </label>
        <input id="name" name="name" required defaultValue={debt?.name} placeholder="z. B. Baufinanzierung" className={inputClass} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass} htmlFor="originalAmount">
            Ursprungsbetrag (€)
          </label>
          <input id="originalAmount" name="originalAmount" type="number" step="any" required defaultValue={debt?.original_amount} className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="remainingAmount">
            Restschuld (€)
          </label>
          <input id="remainingAmount" name="remainingAmount" type="number" step="any" required defaultValue={debt?.remaining_amount} className={inputClass} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass} htmlFor="interestRate">
            Zinssatz (%)
          </label>
          <input id="interestRate" name="interestRate" type="number" step="any" required defaultValue={debt?.interest_rate ?? 0} className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="monthlyPayment">
            Monatliche Rate (€)
          </label>
          <input id="monthlyPayment" name="monthlyPayment" type="number" step="any" required defaultValue={debt?.monthly_payment ?? 0} className={inputClass} />
        </div>
      </div>
      <div>
        <label className={labelClass} htmlFor="startDate">
          Startdatum
        </label>
        <input id="startDate" name="startDate" type="date" required defaultValue={debt?.start_date?.slice(0, 10)} className={inputClass} />
      </div>

      {state?.error && <p className="rounded-life bg-danger/10 px-3.5 py-2.5 text-sm text-danger">{state.error}</p>}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Wird gespeichert…" : (submitLabel ?? "Speichern")}
      </Button>
    </form>
  );
}
