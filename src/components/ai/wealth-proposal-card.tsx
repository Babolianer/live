"use client";

import { useState } from "react";
import { CheckCircle2, Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { WealthForm } from "@/components/wealth/wealth-form";
import { createWealthEntryAction, updateWealthEntryAction } from "@/lib/actions/wealth-actions";
import type { WealthEntryRow } from "@/lib/wealth";

export type WealthProposal = {
  id?: string;
  name: string;
  category: string;
  value?: number | null;
  notes?: string | null;
};

export function WealthProposalCard({ proposal }: { proposal: WealthProposal }) {
  const [saved, setSaved] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const isUpdate = !!proposal.id;

  if (dismissed) return null;
  if (saved) {
    return (
      <Card className="flex items-center gap-2 border-success/30 bg-success/10 text-success">
        <CheckCircle2 size={18} />
        <span className="text-sm font-medium">
          Vermögenswert &quot;{proposal.name}&quot; wurde {isUpdate ? "aktualisiert" : "angelegt"}.
        </span>
      </Card>
    );
  }

  return (
    <Card>
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-accent">
        <Wallet size={16} />
        {isUpdate ? "Änderung" : "Vermögenswert-Vorschlag"} — bitte prüfen und bestätigen
      </div>
      <WealthForm
        action={isUpdate ? updateWealthEntryAction.bind(null, proposal.id!) : createWealthEntryAction}
        entry={{
          name: proposal.name,
          category: proposal.category as WealthEntryRow["category"],
          value: proposal.value ?? undefined,
          notes: proposal.notes ?? null,
        }}
        onDone={() => setSaved(true)}
        submitLabel={isUpdate ? "Änderungen speichern" : "Hinzufügen"}
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
