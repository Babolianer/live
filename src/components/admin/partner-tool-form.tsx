"use client";

import { useActionState } from "react";
import { CATEGORIES } from "@/lib/contract-constants";
import { categoryLabel } from "@/lib/category-style";
import { Button } from "@/components/ui/button";
import type { PartnerToolFormState } from "@/lib/actions/partner-tool-actions";
import type { PartnerToolRow } from "@/lib/partner-tools";

type Props = {
  action: (
    state: PartnerToolFormState,
    formData: FormData
  ) => Promise<PartnerToolFormState>;
  tool?: PartnerToolRow;
  onDone?: () => void;
  submitLabel?: string;
};

const inputClass =
  "w-full rounded-life border border-border bg-surface-muted px-3.5 py-2.5 text-sm outline-none focus:border-accent";
const labelClass = "mb-1.5 block text-sm font-medium";

export function PartnerToolForm({ action, tool, onDone, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState<PartnerToolFormState, FormData>(
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
        <label className={labelClass} htmlFor="providerName">
          Anbieter
        </label>
        <input
          id="providerName"
          name="providerName"
          required
          defaultValue={tool?.provider_name}
          placeholder="z. B. Check24"
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="category">
          Für Vertragskategorie
        </label>
        <select
          id="category"
          name="category"
          defaultValue={tool?.category ?? "alle"}
          className={inputClass}
        >
          <option value="alle">{categoryLabel("alle")}</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {categoryLabel(c)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass} htmlFor="deepLinkTemplate">
          Deep-Link-URL
        </label>
        <input
          id="deepLinkTemplate"
          name="deepLinkTemplate"
          required
          defaultValue={tool?.deep_link_template}
          placeholder="https://www.check24.de/versicherungen/?partner={affiliate_id}"
          className={inputClass}
        />
        <p className="mt-1 text-xs text-foreground-muted">
          {"{affiliate_id}"} wird automatisch durch deine Affiliate-ID ersetzt.
        </p>
      </div>

      <div>
        <label className={labelClass} htmlFor="affiliateId">
          Affiliate-/Partner-ID (optional)
        </label>
        <input
          id="affiliateId"
          name="affiliateId"
          defaultValue={tool?.affiliate_id ?? ""}
          placeholder="z. B. deine-partner-id-123"
          className={inputClass}
        />
      </div>

      <label className="flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          name="enabled"
          defaultChecked={tool ? tool.enabled === 1 : true}
          className="h-4 w-4 rounded border-border accent-[var(--accent)]"
        />
        Für Nutzer sichtbar
      </label>

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
