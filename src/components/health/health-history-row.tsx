"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteHealthLogAction } from "@/lib/actions/health-actions";
import type { HealthLogRow } from "@/lib/health";

export function HealthHistoryRow({ log }: { log: HealthLogRow }) {
  const [isPending, startTransition] = useTransition();
  const date = new Date(log.log_date).toLocaleDateString("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });

  return (
    <div className="flex items-center justify-between gap-3 rounded-life border border-border bg-surface p-3 text-sm">
      <span className="w-20 shrink-0 font-medium">{date}</span>
      <span className="flex-1 truncate text-foreground-muted">
        {log.steps != null && `${log.steps} Schritte`}
        {log.water_liters != null && ` · ${log.water_liters} L`}
        {log.sleep_hours != null && ` · ${log.sleep_hours} h Schlaf`}
        {log.workout && ` · ${log.workout}`}
      </span>
      <button
        aria-label="Löschen"
        disabled={isPending}
        onClick={() => startTransition(() => deleteHealthLogAction(log.id))}
        className="shrink-0 rounded-md p-1.5 text-danger hover:bg-surface-muted"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
