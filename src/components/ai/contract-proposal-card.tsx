"use client";

import { useState } from "react";
import { CheckCircle2, FileSignature } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ContractForm } from "@/components/contracts/contract-form";
import { createContractAction, updateContractAction } from "@/lib/actions/contract-actions";
import type { ContractRow } from "@/lib/contracts";

export type ContractProposal = {
  id?: string;
  name: string;
  category: string;
  amount?: number | null;
  billingCycle: "monthly" | "yearly" | "one_time";
  contractEnd?: string | null;
  cancellationDeadline?: string | null;
  notes?: string | null;
};

export function ContractProposalCard({ proposal }: { proposal: ContractProposal }) {
  const [saved, setSaved] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const isUpdate = !!proposal.id;

  if (dismissed) return null;

  if (saved) {
    return (
      <Card className="flex items-center gap-2 border-success/30 bg-success/10 text-success">
        <CheckCircle2 size={18} />
        <span className="text-sm font-medium">
          Vertrag &quot;{proposal.name}&quot; wurde {isUpdate ? "aktualisiert" : "angelegt"}.
        </span>
      </Card>
    );
  }

  const draft: Partial<ContractRow> = {
    name: proposal.name,
    category: proposal.category,
    amount: proposal.amount ?? null,
    billing_cycle: proposal.billingCycle,
    contract_end: proposal.contractEnd ?? null,
    cancellation_deadline: proposal.cancellationDeadline ?? null,
    notes: proposal.notes ?? null,
  };

  return (
    <Card>
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-accent">
        <FileSignature size={16} />
        {isUpdate ? "Änderung" : "Vertragsvorschlag"} — bitte prüfen und bestätigen
      </div>
      <ContractForm
        action={isUpdate ? updateContractAction.bind(null, proposal.id!) : createContractAction}
        contract={draft}
        documents={[]}
        onDone={() => setSaved(true)}
        submitLabel={isUpdate ? "Änderungen speichern" : "Vertrag anlegen"}
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
