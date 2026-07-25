"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { deleteEntityAction } from "@/lib/actions/entity-actions";

export type DeleteProposal = {
  entityType: string;
  id: string;
  label: string;
};

export function DeleteProposalCard({ proposal }: { proposal: DeleteProposal }) {
  const [deleted, setDeleted] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (dismissed) return null;
  if (deleted) {
    return (
      <Card className="flex items-center gap-2 border-success/30 bg-success/10 text-success">
        <CheckCircle2 size={18} />
        <span className="text-sm font-medium">&quot;{proposal.label}&quot; wurde gelöscht.</span>
      </Card>
    );
  }

  return (
    <Card>
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-danger">
        <Trash2 size={16} />
        Löschen bestätigen
      </div>
      <p className="mb-4 text-sm text-foreground-muted">
        Soll <span className="font-medium text-foreground">&quot;{proposal.label}&quot;</span>{" "}
        wirklich gelöscht werden? Das kann nicht rückgängig gemacht werden.
      </p>
      <div className="flex gap-2">
        <Button
          variant="danger"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await deleteEntityAction(proposal.entityType, proposal.id);
              setDeleted(true);
            })
          }
        >
          {isPending ? "Wird gelöscht…" : "Ja, löschen"}
        </Button>
        <Button variant="secondary" onClick={() => setDismissed(true)}>
          Abbrechen
        </Button>
      </div>
    </Card>
  );
}
