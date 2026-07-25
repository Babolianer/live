"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import type { VehicleFormState } from "@/lib/actions/vehicle-actions";
import type { VehicleRow } from "@/lib/vehicles";

type Props = {
  action: (state: VehicleFormState, formData: FormData) => Promise<VehicleFormState>;
  vehicle?: Partial<VehicleRow>;
  documents: { id: string; original_name: string }[];
  onDone?: () => void;
  submitLabel?: string;
};

const inputClass =
  "w-full rounded-life border border-border bg-surface-muted px-3.5 py-2.5 text-sm outline-none focus:border-accent";
const labelClass = "mb-1.5 block text-sm font-medium";

export function VehicleForm({ action, vehicle, documents, onDone, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState<VehicleFormState, FormData>(
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
          defaultValue={vehicle?.name}
          placeholder="z. B. BMW M140i"
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass} htmlFor="licensePlate">
            Kennzeichen
          </label>
          <input
            id="licensePlate"
            name="licensePlate"
            defaultValue={vehicle?.license_plate ?? ""}
            placeholder="M-AB 1234"
            className={inputClass}
          />
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
            min="0"
            defaultValue={vehicle?.value ?? ""}
            placeholder="18000"
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass} htmlFor="purchaseDate">
            Kaufdatum
          </label>
          <input
            id="purchaseDate"
            name="purchaseDate"
            type="date"
            defaultValue={vehicle?.purchase_date ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="inspectionDue">
            Nächster TÜV
          </label>
          <input
            id="inspectionDue"
            name="inspectionDue"
            type="date"
            defaultValue={vehicle?.inspection_due ?? ""}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="documentId">
          Verknüpftes Dokument
        </label>
        <select
          id="documentId"
          name="documentId"
          defaultValue={vehicle?.document_id ?? ""}
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
          defaultValue={vehicle?.notes ?? ""}
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
