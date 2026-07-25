"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { ASSET_TYPE_LABELS } from "@/lib/wealth-asset-constants";
import { deleteWealthAssetAction } from "@/lib/actions/wealth-asset-actions";
import type { WealthAssetRow } from "@/lib/wealth-assets";

export function WealthAssetRowItem({ asset }: { asset: WealthAssetRow }) {
  const [isPending, startTransition] = useTransition();
  const value = asset.quantity * asset.price_per_unit;

  return (
    <Link
      href={`/wealth/assets/${asset.id}`}
      className="flex items-center justify-between gap-3 rounded-life px-3 py-2.5 hover:bg-surface-muted"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{asset.name}</p>
        <p className="truncate text-xs text-foreground-muted">
          {ASSET_TYPE_LABELS[asset.typ]}
          {asset.symbol ? ` · ${asset.symbol}` : ""} · {asset.quantity.toLocaleString("de-DE")} Stk.
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span className="font-semibold">€ {value.toLocaleString("de-DE", { maximumFractionDigits: 0 })}</span>
        <button
          type="button"
          aria-label="Löschen"
          disabled={isPending}
          onClick={(e) => {
            e.preventDefault();
            startTransition(() => deleteWealthAssetAction(asset.id));
          }}
          className="rounded-md p-1.5 text-danger hover:bg-surface"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </Link>
  );
}
