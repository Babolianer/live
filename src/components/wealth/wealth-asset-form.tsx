"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { ASSET_TYPES, ASSET_TYPE_LABELS } from "@/lib/wealth-asset-constants";
import { RealEstateListingImport } from "@/components/wealth/real-estate-listing-import";
import type { WealthAssetFormState } from "@/lib/actions/wealth-asset-actions";
import type { WealthAssetRow } from "@/lib/wealth-assets";
import type { WealthGroupRow } from "@/lib/wealth-groups";
import type { WealthSectorRow } from "@/lib/wealth-sectors";

type Props = {
  action: (state: WealthAssetFormState, formData: FormData) => Promise<WealthAssetFormState>;
  asset?: Partial<WealthAssetRow>;
  groups: WealthGroupRow[];
  sectors: WealthSectorRow[];
  defaultGroupId?: string;
  onDone?: () => void;
  submitLabel?: string;
};

const inputClass = "w-full rounded-life border border-border bg-surface-muted px-3.5 py-2.5 text-sm outline-none focus:border-accent";
const labelClass = "mb-1.5 block text-sm font-medium";

export function WealthAssetForm({ action, asset, groups, sectors, defaultGroupId, onDone, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState<WealthAssetFormState, FormData>(async (prevState, formData) => {
    const result = await action(prevState, formData);
    if (!result?.error) onDone?.();
    return result;
  }, undefined);

  const [typ, setTyp] = useState(asset?.typ ?? "OTHER");
  const [name, setName] = useState(asset?.name ?? "");
  const [pricePerUnit, setPricePerUnit] = useState(asset?.price_per_unit ?? 0);
  const [notes, setNotes] = useState(asset?.notes ?? "");

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {typ === "IMMOBILIE" && !asset?.id && (
        <RealEstateListingImport
          onApply={(data) => {
            if (data.name) setName(data.name);
            if (data.purchasePrice !== undefined) setPricePerUnit(data.purchasePrice);
            if (data.notes) setNotes(data.notes);
          }}
        />
      )}

      <div>
        <label className={labelClass} htmlFor="name">
          Name
        </label>
        <input
          id="name"
          name="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="z. B. Apple Aktie, Bitcoin"
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass} htmlFor="groupId">
            Gruppe
          </label>
          <select id="groupId" name="groupId" required defaultValue={asset?.group_id ?? defaultGroupId} className={inputClass}>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="typ">
            Typ
          </label>
          <select id="typ" name="typ" value={typ} onChange={(e) => setTyp(e.target.value as typeof typ)} className={inputClass}>
            {ASSET_TYPES.map((t) => (
              <option key={t} value={t}>
                {ASSET_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {sectors.length > 0 && (
        <div>
          <label className={labelClass} htmlFor="sectorId">
            Sektor (optional)
          </label>
          <select id="sectorId" name="sectorId" defaultValue={asset?.sector_id ?? ""} className={inputClass}>
            <option value="">Kein Sektor</option>
            {sectors.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass} htmlFor="quantity">
            Menge
          </label>
          <input id="quantity" name="quantity" type="number" step="any" required defaultValue={asset?.quantity ?? 1} className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="pricePerUnit">
            Preis/Einheit (€)
          </label>
          <input
            id="pricePerUnit"
            name="pricePerUnit"
            type="number"
            step="any"
            required
            value={Number.isNaN(pricePerUnit) ? "" : pricePerUnit}
            onChange={(e) => setPricePerUnit(e.target.valueAsNumber)}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass} htmlFor="symbol">
            Symbol (für Live-Kurse)
          </label>
          <input id="symbol" name="symbol" defaultValue={asset?.symbol ?? ""} placeholder="z. B. AAPL, BTC" className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="isin">
            ISIN
          </label>
          <input id="isin" name="isin" defaultValue={asset?.isin ?? ""} className={inputClass} />
        </div>
      </div>

      <input type="hidden" name="currency" value="EUR" />

      <div>
        <label className={labelClass} htmlFor="notes">
          Notizen
        </label>
        <textarea id="notes" name="notes" rows={2} value={notes ?? ""} onChange={(e) => setNotes(e.target.value)} className={inputClass} />
      </div>

      {state?.error && <p className="rounded-life bg-danger/10 px-3.5 py-2.5 text-sm text-danger">{state.error}</p>}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Wird gespeichert…" : (submitLabel ?? "Speichern")}
      </Button>
    </form>
  );
}
