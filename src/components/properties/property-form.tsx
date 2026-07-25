"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import type { PropertyFormState } from "@/lib/actions/property-actions";
import type { PropertyRow } from "@/lib/properties";

type Props = {
  action: (state: PropertyFormState, formData: FormData) => Promise<PropertyFormState>;
  property?: Partial<PropertyRow>;
  documents: { id: string; original_name: string }[];
  onDone?: () => void;
  submitLabel?: string;
};

const inputClass =
  "w-full rounded-life border border-border bg-surface-muted px-3.5 py-2.5 text-sm outline-none focus:border-accent";
const labelClass = "mb-1.5 block text-sm font-medium";

export function PropertyForm({ action, property, documents, onDone, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState<PropertyFormState, FormData>(
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
          defaultValue={property?.name}
          placeholder="z. B. Eigentumswohnung Musterstraße 1"
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="address">
          Adresse
        </label>
        <input
          id="address"
          name="address"
          defaultValue={property?.address ?? ""}
          placeholder="Musterstraße 1, 12345 Musterstadt"
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass} htmlFor="value">
            Wert (€)
          </label>
          <input
            id="value"
            name="value"
            type="number"
            step="0.01"
            min="0"
            defaultValue={property?.value ?? ""}
            placeholder="350000"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="purchaseDate">
            Kaufdatum
          </label>
          <input
            id="purchaseDate"
            name="purchaseDate"
            type="date"
            defaultValue={property?.purchase_date ?? ""}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="documentId">
          Verknüpftes Dokument (z. B. Hypothek)
        </label>
        <select
          id="documentId"
          name="documentId"
          defaultValue={property?.document_id ?? ""}
          className={inputClass}
        >
          <option value="">Kein Dokument</option>
          {documents.map((d) => (
            <option key={d.id} value={d.id}>
              {d.original_name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass} htmlFor="notes">
          Notizen
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={2}
          defaultValue={property?.notes ?? ""}
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
