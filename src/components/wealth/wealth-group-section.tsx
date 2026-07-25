"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { WealthGroupForm } from "@/components/wealth/wealth-group-form";
import { WealthAssetForm } from "@/components/wealth/wealth-asset-form";
import { WealthAssetRowItem } from "@/components/wealth/wealth-asset-row";
import { updateWealthGroupAction, deleteWealthGroupAction } from "@/lib/actions/wealth-group-actions";
import { createWealthAssetAction } from "@/lib/actions/wealth-asset-actions";
import { GROUP_TYPE_LABELS } from "@/lib/wealth-asset-constants";
import type { WealthGroupRow } from "@/lib/wealth-groups";
import type { WealthAssetRow } from "@/lib/wealth-assets";
import type { WealthSectorRow } from "@/lib/wealth-sectors";

type Props = {
  group: WealthGroupRow;
  assets: WealthAssetRow[];
  allGroups: WealthGroupRow[];
  sectors: WealthSectorRow[];
};

export function WealthGroupSection({ group, assets, allGroups, sectors }: Props) {
  const [editing, setEditing] = useState(false);
  const [addingAsset, setAddingAsset] = useState(false);
  const [isPending, startTransition] = useTransition();
  const total = assets.reduce((sum, a) => sum + a.quantity * a.price_per_unit, 0);

  if (editing) {
    return (
      <Card>
        <WealthGroupForm action={updateWealthGroupAction.bind(null, group.id)} group={group} onDone={() => setEditing(false)} submitLabel="Änderungen speichern" />
        <button onClick={() => setEditing(false)} className="mt-3 w-full text-center text-sm text-foreground-muted hover:underline">
          Abbrechen
        </button>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: group.farbe }} />
            <p className="truncate font-medium">{group.name}</p>
            <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs text-foreground-muted">{GROUP_TYPE_LABELS[group.typ]}</span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="font-semibold">€ {total.toLocaleString("de-DE", { maximumFractionDigits: 0 })}</span>
          <button aria-label="Bearbeiten" onClick={() => setEditing(true)} className="rounded-md p-1.5 text-foreground-muted hover:bg-surface-muted">
            <Pencil size={16} />
          </button>
          <button
            aria-label="Löschen"
            disabled={isPending}
            onClick={() => startTransition(() => deleteWealthGroupAction(group.id))}
            className="rounded-md p-1.5 text-danger hover:bg-surface-muted"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="mt-2 flex flex-col divide-y divide-border">
        {assets.map((asset) => (
          <WealthAssetRowItem key={asset.id} asset={asset} />
        ))}
      </div>

      {addingAsset ? (
        <div className="mt-2 border-t border-border pt-3">
          <WealthAssetForm
            action={createWealthAssetAction}
            groups={allGroups}
            sectors={sectors}
            defaultGroupId={group.id}
            onDone={() => setAddingAsset(false)}
            submitLabel="Asset hinzufügen"
          />
          <button onClick={() => setAddingAsset(false)} className="mt-3 w-full text-center text-sm text-foreground-muted hover:underline">
            Abbrechen
          </button>
        </div>
      ) : (
        <button
          onClick={() => setAddingAsset(true)}
          className="mt-2 flex items-center justify-center gap-1.5 rounded-life border border-dashed border-border py-2 text-sm text-foreground-muted hover:bg-surface-muted"
        >
          <Plus size={14} /> Asset hinzufügen
        </button>
      )}
    </Card>
  );
}
