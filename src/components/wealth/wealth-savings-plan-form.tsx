"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { SAVINGS_PLAN_INTERVALS, SAVINGS_PLAN_INTERVAL_LABELS } from "@/lib/wealth-asset-constants";
import type { WealthSavingsPlanFormState } from "@/lib/actions/wealth-savings-plan-actions";
import type { WealthSavingsPlanRow } from "@/lib/wealth-savings-plans";
import type { WealthAssetRow } from "@/lib/wealth-assets";

type Props = {
  action: (state: WealthSavingsPlanFormState, formData: FormData) => Promise<WealthSavingsPlanFormState>;
  plan?: Partial<WealthSavingsPlanRow>;
  assets: WealthAssetRow[];
  onDone?: () => void;
  submitLabel?: string;
};

const inputClass = "w-full rounded-life border border-border bg-surface-muted px-3.5 py-2.5 text-sm outline-none focus:border-accent";
const labelClass = "mb-1.5 block text-sm font-medium";

export function WealthSavingsPlanForm({ action, plan, assets, onDone, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState<WealthSavingsPlanFormState, FormData>(async (prevState, formData) => {
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
        <input id="name" name="name" required defaultValue={plan?.name} placeholder="z. B. MSCI World Sparplan" className={inputClass} />
      </div>
      <div>
        <label className={labelClass} htmlFor="targetAssetId">
          Ziel-Asset
        </label>
        <select id="targetAssetId" name="targetAssetId" required defaultValue={plan?.target_asset_id} className={inputClass}>
          <option value="">Bitte wählen…</option>
          {assets.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
              {a.symbol ? ` (${a.symbol})` : ""}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass} htmlFor="amount">
            Rate (€)
          </label>
          <input id="amount" name="amount" type="number" step="any" required defaultValue={plan?.amount} className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="interval">
            Rhythmus
          </label>
          <select id="interval" name="interval" defaultValue={plan?.interval ?? "MONTHLY"} className={inputClass}>
            {SAVINGS_PLAN_INTERVALS.map((i) => (
              <option key={i} value={i}>
                {SAVINGS_PLAN_INTERVAL_LABELS[i]}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass} htmlFor="startDate">
            Start
          </label>
          <input id="startDate" name="startDate" type="date" required defaultValue={plan?.start_date?.slice(0, 10)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="endDate">
            Ende (optional)
          </label>
          <input id="endDate" name="endDate" type="date" defaultValue={plan?.end_date?.slice(0, 10) ?? ""} className={inputClass} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass} htmlFor="anchorDate">
            Startbestand-Datum (optional)
          </label>
          <input id="anchorDate" name="anchorDate" type="date" defaultValue={plan?.anchor_date?.slice(0, 10) ?? ""} className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="anchorQuantity">
            Startbestand (Stk., optional)
          </label>
          <input id="anchorQuantity" name="anchorQuantity" type="number" step="any" defaultValue={plan?.anchor_quantity ?? ""} className={inputClass} />
        </div>
      </div>
      <div>
        <label className={labelClass} htmlFor="notes">
          Notizen
        </label>
        <input id="notes" name="notes" defaultValue={plan?.notes ?? ""} className={inputClass} />
      </div>

      {state?.error && <p className="rounded-life bg-danger/10 px-3.5 py-2.5 text-sm text-danger">{state.error}</p>}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Wird gespeichert…" : (submitLabel ?? "Speichern")}
      </Button>
    </form>
  );
}
