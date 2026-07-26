"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { GROUP_TYPES, GROUP_TYPE_LABELS } from "@/lib/wealth-asset-constants";
import type { WealthGroupFormState } from "@/lib/actions/wealth-group-actions";
import type { WealthGroupRow } from "@/lib/wealth-groups";

type Props = {
  action: (state: WealthGroupFormState, formData: FormData) => Promise<WealthGroupFormState>;
  group?: Partial<WealthGroupRow>;
  onDone?: () => void;
  submitLabel?: string;
};

const inputClass = "w-full rounded-life border border-border bg-surface-muted px-3.5 py-2.5 text-sm outline-none focus:border-accent";
const labelClass = "mb-1.5 block text-sm font-medium";

const GROUP_ICON_OPTIONS = [
  { value: "wallet", label: "Geldbeutel" },
  { value: "landmark", label: "Bank" },
  { value: "trending-up", label: "Trend" },
  { value: "piggy-bank", label: "Sparschwein" },
  { value: "coins", label: "Münzen" },
  { value: "building", label: "Gebäude" },
  { value: "home", label: "Haus" },
  { value: "shield", label: "Schild" },
] as const;

export function WealthGroupForm({ action, group, onDone, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState<WealthGroupFormState, FormData>(async (prevState, formData) => {
    const result = await action(prevState, formData);
    if (!result?.error) onDone?.();
    return result;
  }, undefined);

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
          defaultValue={group?.name}
          placeholder="z. B. Girokonto Sparkasse, Depot ING"
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass} htmlFor="typ">
            Typ
          </label>
          <select id="typ" name="typ" defaultValue={group?.typ ?? "OTHER"} className={inputClass}>
            {GROUP_TYPES.map((t) => (
              <option key={t} value={t}>
                {GROUP_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="staleAfterDays">
            Kurs &bdquo;veraltet&ldquo; nach (Tagen)
          </label>
          <input
            id="staleAfterDays"
            name="staleAfterDays"
            type="number"
            min={1}
            required
            defaultValue={group?.stale_after_days ?? 30}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass} htmlFor="farbe">
            Farbe
          </label>
          <input id="farbe" name="farbe" type="color" defaultValue={group?.farbe ?? "#6366f1"} className="h-10 w-16 rounded-life border border-border bg-surface-muted" />
        </div>
        <div>
          <label className={labelClass} htmlFor="icon">
            Icon
          </label>
          <select id="icon" name="icon" defaultValue={group?.icon ?? "wallet"} className={inputClass}>
            {GROUP_ICON_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {state?.error && <p className="rounded-life bg-danger/10 px-3.5 py-2.5 text-sm text-danger">{state.error}</p>}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Wird gespeichert…" : (submitLabel ?? "Speichern")}
      </Button>
    </form>
  );
}
