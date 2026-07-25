"use client";

import { useActionState } from "react";
import { CATEGORIES } from "@/lib/contract-constants";
import { categoryLabel } from "@/lib/category-style";
import { Button } from "@/components/ui/button";
import type { ContractFormState } from "@/lib/actions/contract-actions";
import type { ContractRow } from "@/lib/contracts";

type Props = {
  action: (
    state: ContractFormState,
    formData: FormData
  ) => Promise<ContractFormState>;
  contract?: Partial<ContractRow>;
  documents: { id: string; original_name: string }[];
  onDone?: () => void;
  submitLabel?: string;
};

const inputClass =
  "w-full rounded-life border border-border bg-surface-muted px-3.5 py-2.5 text-sm outline-none focus:border-accent";
const labelClass = "mb-1.5 block text-sm font-medium";

export function ContractForm({ action, contract, documents, onDone, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState<ContractFormState, FormData>(
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
          defaultValue={contract?.name}
          placeholder="z. B. Haftpflichtversicherung"
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass} htmlFor="category">
            Kategorie
          </label>
          <select
            id="category"
            name="category"
            defaultValue={contract?.category ?? "sonstiges"}
            className={inputClass}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {categoryLabel(c)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="billingCycle">
            Zyklus
          </label>
          <select
            id="billingCycle"
            name="billingCycle"
            defaultValue={contract?.billing_cycle ?? "monthly"}
            className={inputClass}
          >
            <option value="monthly">Monatlich</option>
            <option value="yearly">Jährlich</option>
            <option value="one_time">Einmalig</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass} htmlFor="amount">
            Betrag (€)
          </label>
          <input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            min="0"
            defaultValue={contract?.amount ?? ""}
            placeholder="9.99"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="documentId">
            Verknüpftes Dokument
          </label>
          <select
            id="documentId"
            name="documentId"
            defaultValue={contract?.document_id ?? ""}
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
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass} htmlFor="contractEnd">
            Vertragsende
          </label>
          <input
            id="contractEnd"
            name="contractEnd"
            type="date"
            defaultValue={contract?.contract_end ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="cancellationDeadline">
            Kündigungsfrist bis
          </label>
          <input
            id="cancellationDeadline"
            name="cancellationDeadline"
            type="date"
            defaultValue={contract?.cancellation_deadline ?? ""}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="notes">
          Notizen
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={2}
          defaultValue={contract?.notes ?? ""}
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
