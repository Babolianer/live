"use client";

import { useState, type ReactNode } from "react";
import { Pencil, Footprints, Droplet, Moon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { HealthLogForm } from "@/components/health/health-log-form";
import type { HealthLogRow } from "@/lib/health";

const TARGET_STEPS = 10000;
const TARGET_WATER = 3;
const TARGET_SLEEP = 8;

function Bar({ label, value, target, unit, icon }: { label: string; value: number; target: number; unit: string; icon: ReactNode }) {
  const percent = Math.min(100, Math.round((value / target) * 100));
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 font-medium">
          {icon}
          {label}
        </span>
        <span className="text-foreground-muted">
          {value} / {target} {unit}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
        <div className="h-full rounded-full bg-accent" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export function HealthTodayCard({ log, today }: { log: HealthLogRow | null; today: string }) {
  const [editing, setEditing] = useState(!log);

  if (editing) {
    return (
      <Card>
        <p className="mb-3 font-heading font-semibold">Heute — {today}</p>
        <HealthLogForm log={log} defaultDate={today} onDone={() => setEditing(false)} />
        {log && (
          <button
            onClick={() => setEditing(false)}
            className="mt-3 w-full text-center text-sm text-foreground-muted hover:underline"
          >
            Abbrechen
          </button>
        )}
      </Card>
    );
  }

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <p className="font-heading font-semibold">Heute — {today}</p>
        <button
          aria-label="Bearbeiten"
          onClick={() => setEditing(true)}
          className="rounded-md p-1.5 text-foreground-muted hover:bg-surface-muted"
        >
          <Pencil size={16} />
        </button>
      </div>
      <div className="flex flex-col gap-3">
        <Bar label="Schritte" value={log?.steps ?? 0} target={TARGET_STEPS} unit="" icon={<Footprints size={14} />} />
        <Bar label="Wasser" value={log?.water_liters ?? 0} target={TARGET_WATER} unit="L" icon={<Droplet size={14} />} />
        <Bar label="Schlaf" value={log?.sleep_hours ?? 0} target={TARGET_SLEEP} unit="h" icon={<Moon size={14} />} />
      </div>
      {log?.workout && (
        <p className="mt-3 text-sm text-foreground-muted">Workout: {log.workout}</p>
      )}
    </Card>
  );
}
