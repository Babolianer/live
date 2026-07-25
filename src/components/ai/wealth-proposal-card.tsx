"use client";

import { useActionState, useState } from "react";
import { CheckCircle2, Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  createWealthAssetQuickAction,
  updateWealthAssetQuickAction,
  type WealthAssetFormState,
} from "@/lib/actions/wealth-asset-actions";
import { ASSET_TYPES, ASSET_TYPE_LABELS } from "@/lib/wealth-asset-constants";

export type WealthProposal = {
  id?: string;
  name: string;
  typ?: string;
  value?: number | null;
  notes?: string | null;
};

const inputClass = "w-full rounded-life border border-border bg-surface-muted px-3.5 py-2.5 text-sm outline-none focus:border-accent";
const labelClass = "mb-1.5 block text-sm font-medium";

export function WealthProposalCard({ proposal }: { proposal: WealthProposal }) {
  const [saved, setSaved] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const isUpdate = !!proposal.id;

  const action = isUpdate ? updateWealthAssetQuickAction.bind(null, proposal.id!) : createWealthAssetQuickAction;
  const [state, formAction, pending] = useActionState<WealthAssetFormState, FormData>(async (prevState, formData) => {
    const result = await action(prevState, formData);
    if (!result?.error) setSaved(true);
    return result;
  }, undefined);

  if (dismissed) return null;
  if (saved) {
    return (
      <Card className="flex items-center gap-2 border-success/30 bg-success/10 text-success">
        <CheckCircle2 size={18} />
        <span className="text-sm font-medium">
          Vermögenswert &quot;{proposal.name}&quot; wurde {isUpdate ? "aktualisiert" : "angelegt"}.
        </span>
      </Card>
    );
  }

  return (
    <Card>
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-accent">
        <Wallet size={16} />
        {isUpdate ? "Änderung" : "Vermögenswert-Vorschlag"} — bitte prüfen und bestätigen
      </div>
      <form action={formAction} className="flex flex-col gap-4">
        <div>
          <label className={labelClass} htmlFor="name">
            Name
          </label>
          <input id="name" name="name" required defaultValue={proposal.name} className={inputClass} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass} htmlFor="typ">
              Typ
            </label>
            <select id="typ" name="typ" defaultValue={proposal.typ ?? "OTHER"} className={inputClass}>
              {ASSET_TYPES.map((t) => (
                <option key={t} value={t}>
                  {ASSET_TYPE_LABELS[t]}
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
              defaultValue={proposal.value ?? undefined}
              className={inputClass}
            />
          </div>
        </div>
        <div>
          <label className={labelClass} htmlFor="notes">
            Notizen
          </label>
          <textarea id="notes" name="notes" rows={2} defaultValue={proposal.notes ?? ""} className={inputClass} />
        </div>

        {state?.error && <p className="rounded-life bg-danger/10 px-3.5 py-2.5 text-sm text-danger">{state.error}</p>}

        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Wird gespeichert…" : isUpdate ? "Änderungen speichern" : "Hinzufügen"}
        </Button>
      </form>
      <button onClick={() => setDismissed(true)} className="mt-3 w-full text-center text-sm text-foreground-muted hover:underline">
        Verwerfen
      </button>
    </Card>
  );
}
