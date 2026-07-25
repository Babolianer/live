"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { Card } from "@/components/ui/card";
import { WealthAssetForm } from "@/components/wealth/wealth-asset-form";
import { updateWealthAssetAction } from "@/lib/actions/wealth-asset-actions";
import { ASSET_TYPE_LABELS } from "@/lib/wealth-asset-constants";
import type { WealthAssetRow } from "@/lib/wealth-assets";
import type { WealthGroupRow } from "@/lib/wealth-groups";
import type { WealthSectorRow } from "@/lib/wealth-sectors";

export function WealthAssetHeader({
  asset,
  groupName,
  groups,
  sectors,
}: {
  asset: WealthAssetRow;
  groupName: string;
  groups: WealthGroupRow[];
  sectors: WealthSectorRow[];
}) {
  const [editing, setEditing] = useState(false);
  const router = useRouter();
  const value = asset.quantity * asset.price_per_unit;

  if (editing) {
    return (
      <Card>
        <WealthAssetForm
          action={updateWealthAssetAction.bind(null, asset.id)}
          asset={asset}
          groups={groups}
          sectors={sectors}
          onDone={() => {
            setEditing(false);
            router.refresh();
          }}
          submitLabel="Änderungen speichern"
        />
        <button onClick={() => setEditing(false)} className="mt-3 w-full text-center text-sm text-foreground-muted hover:underline">
          Abbrechen
        </button>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-foreground-muted">
            {groupName} · {ASSET_TYPE_LABELS[asset.typ]}
            {asset.symbol ? ` · ${asset.symbol}` : ""}
          </p>
          <p className="font-heading text-2xl font-semibold">{asset.name}</p>
          <p className="mt-1 text-lg font-semibold">€ {value.toLocaleString("de-DE", { maximumFractionDigits: 2 })}</p>
          <p className="text-xs text-foreground-muted">
            {asset.quantity.toLocaleString("de-DE")} Stk. à € {asset.price_per_unit.toLocaleString("de-DE", { maximumFractionDigits: 2 })}
          </p>
          {asset.notes && <p className="mt-2 text-sm text-foreground-muted">{asset.notes}</p>}
        </div>
        <button aria-label="Bearbeiten" onClick={() => setEditing(true)} className="shrink-0 rounded-md p-1.5 text-foreground-muted hover:bg-surface-muted">
          <Pencil size={18} />
        </button>
      </div>
    </Card>
  );
}
