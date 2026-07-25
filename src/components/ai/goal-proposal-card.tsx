"use client";

import { useState } from "react";
import { CheckCircle2, Target } from "lucide-react";
import { Card } from "@/components/ui/card";
import { GoalForm } from "@/components/goals/goal-form";
import { createGoalAction, updateGoalAction } from "@/lib/actions/goal-actions";
import type { GoalRow } from "@/lib/goals";

export type GoalProposal = {
  id?: string;
  name: string;
  category: string;
  targetAmount?: number | null;
  currentAmount?: number;
  targetDate?: string | null;
  notes?: string | null;
};

export function GoalProposalCard({ proposal }: { proposal: GoalProposal }) {
  const [saved, setSaved] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const isUpdate = !!proposal.id;

  if (dismissed) return null;
  if (saved) {
    return (
      <Card className="flex items-center gap-2 border-success/30 bg-success/10 text-success">
        <CheckCircle2 size={18} />
        <span className="text-sm font-medium">
          Ziel &quot;{proposal.name}&quot; wurde {isUpdate ? "aktualisiert" : "angelegt"}.
        </span>
      </Card>
    );
  }

  const draft: Partial<GoalRow> = {
    name: proposal.name,
    category: proposal.category as GoalRow["category"],
    target_amount: proposal.targetAmount ?? undefined,
    current_amount: proposal.currentAmount ?? 0,
    target_date: proposal.targetDate ?? null,
    notes: proposal.notes ?? null,
  };

  return (
    <Card>
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-accent">
        <Target size={16} />
        {isUpdate ? "Änderung" : "Zielvorschlag"} — bitte prüfen und bestätigen
      </div>
      <GoalForm
        action={isUpdate ? updateGoalAction.bind(null, proposal.id!) : createGoalAction}
        goal={draft}
        onDone={() => setSaved(true)}
        submitLabel={isUpdate ? "Änderungen speichern" : "Ziel anlegen"}
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
