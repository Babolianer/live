"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { saveHealthLogAction, type HealthFormState } from "@/lib/actions/health-actions";
import type { HealthLogRow } from "@/lib/health";

const inputClass =
  "w-full rounded-life border border-border bg-surface-muted px-3.5 py-2.5 text-sm outline-none focus:border-accent";
const labelClass = "mb-1.5 block text-sm font-medium";

export function HealthLogForm({
  log,
  defaultDate,
  onDone,
}: {
  log?: Partial<HealthLogRow> | null;
  defaultDate: string;
  onDone?: () => void;
}) {
  const [state, formAction, pending] = useActionState<HealthFormState, FormData>(
    async (prevState, formData) => {
      const result = await saveHealthLogAction(prevState, formData);
      if (!result?.error) onDone?.();
      return result;
    },
    undefined
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="logDate" value={log?.log_date ?? defaultDate} />

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={labelClass} htmlFor="steps">
            Schritte
          </label>
          <input
            id="steps"
            name="steps"
            type="number"
            min="0"
            defaultValue={log?.steps ?? ""}
            placeholder="8000"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="waterLiters">
            Wasser (L)
          </label>
          <input
            id="waterLiters"
            name="waterLiters"
            type="number"
            step="0.1"
            min="0"
            defaultValue={log?.water_liters ?? ""}
            placeholder="2.5"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="sleepHours">
            Schlaf (h)
          </label>
          <input
            id="sleepHours"
            name="sleepHours"
            type="number"
            step="0.1"
            min="0"
            defaultValue={log?.sleep_hours ?? ""}
            placeholder="7.5"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="workout">
          Workout
        </label>
        <input
          id="workout"
          name="workout"
          defaultValue={log?.workout ?? ""}
          placeholder="z. B. Push Day, 45 Min Laufen"
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="notes">
          Notizen
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={2}
          defaultValue={log?.notes ?? ""}
          className={inputClass}
        />
      </div>

      {state?.error && (
        <p className="rounded-life bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Wird gespeichert…" : "Speichern"}
      </Button>
    </form>
  );
}
