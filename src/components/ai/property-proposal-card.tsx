"use client";

import { useState } from "react";
import { CheckCircle2, Building2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PropertyForm } from "@/components/properties/property-form";
import { createPropertyAction } from "@/lib/actions/property-actions";

export type PropertyProposal = {
  name: string;
  address?: string | null;
  purchaseDate?: string | null;
  value?: number | null;
  notes?: string | null;
};

export function PropertyProposalCard({ proposal }: { proposal: PropertyProposal }) {
  const [saved, setSaved] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;
  if (saved) {
    return (
      <Card className="flex items-center gap-2 border-success/30 bg-success/10 text-success">
        <CheckCircle2 size={18} />
        <span className="text-sm font-medium">
          Immobilie &quot;{proposal.name}&quot; wurde angelegt.
        </span>
      </Card>
    );
  }

  return (
    <Card>
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-accent">
        <Building2 size={16} />
        Immobilien-Vorschlag — bitte prüfen und bestätigen
      </div>
      <PropertyForm
        action={createPropertyAction}
        property={{
          name: proposal.name,
          address: proposal.address ?? null,
          purchase_date: proposal.purchaseDate ?? null,
          value: proposal.value ?? null,
          notes: proposal.notes ?? null,
        }}
        documents={[]}
        onDone={() => setSaved(true)}
        submitLabel="Hinzufügen"
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
