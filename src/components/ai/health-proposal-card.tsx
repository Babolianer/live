"use client";

import { useState } from "react";
import { CheckCircle2, HeartPulse } from "lucide-react";
import { Card } from "@/components/ui/card";
import { HealthLogForm } from "@/components/health/health-log-form";

export type HealthProposal = {
  logDate: string;
  steps?: number | null;
  waterLiters?: number | null;
  sleepHours?: number | null;
  workout?: string | null;
  notes?: string | null;
};

export function HealthProposalCard({ proposal }: { proposal: HealthProposal }) {
  const [saved, setSaved] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;
  if (saved) {
    return (
      <Card className="flex items-center gap-2 border-success/30 bg-success/10 text-success">
        <CheckCircle2 size={18} />
        <span className="text-sm font-medium">Eintrag für {proposal.logDate} wurde gespeichert.</span>
      </Card>
    );
  }

  return (
    <Card>
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-accent">
        <HeartPulse size={16} />
        Gesundheits-Eintrag-Vorschlag — bitte prüfen und bestätigen
      </div>
      <HealthLogForm
        log={{
          log_date: proposal.logDate,
          steps: proposal.steps ?? null,
          water_liters: proposal.waterLiters ?? null,
          sleep_hours: proposal.sleepHours ?? null,
          workout: proposal.workout ?? null,
          notes: proposal.notes ?? null,
        }}
        defaultDate={proposal.logDate}
        onDone={() => setSaved(true)}
      />
      <button
        onClick={() => setDismissed(true)}
        className="mt-3 w-full text-center text-sm text-foreground-muted hover:underline"
      >
        Verwerfen
      </button>
    </Card>
  );
}
