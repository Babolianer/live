"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { WealthSavingsPlanForm } from "@/components/wealth/wealth-savings-plan-form";
import { updateSavingsPlanAction, deleteSavingsPlanAction } from "@/lib/actions/wealth-savings-plan-actions";
import type { WealthSavingsPlanRow } from "@/lib/wealth-savings-plans";
import type { SavingsPlanSummary } from "@/lib/wealth-savings-plans";
import type { WealthAssetRow } from "@/lib/wealth-assets";

export function WealthSavingsPlanRowItem({
  plan,
  summary,
  assets,
}: {
  plan: WealthSavingsPlanRow;
  summary: SavingsPlanSummary;
  assets: WealthAssetRow[];
}) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (editing) {
    return (
      <Card>
        <WealthSavingsPlanForm action={updateSavingsPlanAction.bind(null, plan.id)} plan={plan} assets={assets} onDone={() => setEditing(false)} submitLabel="Änderungen speichern" />
        <button onClick={() => setEditing(false)} className="mt-3 w-full text-center text-sm text-foreground-muted hover:underline">
          Abbrechen
        </button>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-medium">{summary.name}</p>
          <p className="text-sm text-foreground-muted">
            € {summary.amount.toLocaleString("de-DE")} · {summary.targetAssetName}
            {summary.targetAssetSymbol ? ` (${summary.targetAssetSymbol})` : ""}
          </p>
          <p className="mt-1 text-xs text-foreground-muted">
            {summary.executedInstallments} Rate(n) gebucht · € {summary.totalInvested.toLocaleString("de-DE", { maximumFractionDigits: 0 })} investiert
            {summary.currentValue !== null && ` · aktuell € ${summary.currentValue.toLocaleString("de-DE", { maximumFractionDigits: 0 })}`}
          </p>
          {summary.nextDueDate && (
            <p className="text-xs text-foreground-muted">Nächste Rate: {new Date(summary.nextDueDate).toLocaleDateString("de-DE")}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button aria-label="Bearbeiten" onClick={() => setEditing(true)} className="rounded-md p-1.5 text-foreground-muted hover:bg-surface-muted">
            <Pencil size={16} />
          </button>
          <button
            aria-label="Löschen"
            disabled={isPending}
            onClick={() => startTransition(() => deleteSavingsPlanAction(plan.id))}
            className="rounded-md p-1.5 text-danger hover:bg-surface-muted"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </Card>
  );
}
