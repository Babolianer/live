"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2, FileText, Sparkles, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { categoryLabel, categoryColor } from "@/lib/category-style";
import { ContractForm } from "@/components/contracts/contract-form";
import { buildDeepLink } from "@/lib/deep-link";
import {
  updateContractAction,
  deleteContractAction,
} from "@/lib/actions/contract-actions";
import type { ContractRow } from "@/lib/contracts";
import type { PartnerToolRow } from "@/lib/partner-tools";

const CYCLE_LABELS: Record<string, string> = {
  monthly: "monatlich",
  yearly: "jährlich",
  one_time: "einmalig",
};

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function ContractItem({
  contract,
  documents,
  partnerTool,
}: {
  contract: ContractRow;
  documents: { id: string; original_name: string }[];
  partnerTool?: PartnerToolRow | null;
}) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const deadlineDays = daysUntil(contract.cancellation_deadline);
  const isUrgent = deadlineDays !== null && deadlineDays <= 30;

  if (editing) {
    return (
      <Card>
        <ContractForm
          action={updateContractAction.bind(null, contract.id)}
          contract={contract}
          documents={documents}
          onDone={() => setEditing(false)}
          submitLabel="Änderungen speichern"
        />
        <button
          onClick={() => setEditing(false)}
          className="mt-3 w-full text-center text-sm text-foreground-muted hover:underline"
        >
          Abbrechen
        </button>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${categoryColor(contract.category)}`}
            >
              {categoryLabel(contract.category)}
            </span>
            {isUrgent && (
              <span className="rounded-full bg-danger/15 px-2.5 py-0.5 text-xs font-medium text-danger">
                Bald fällig
              </span>
            )}
            {contract.document_id && (
              <FileText size={14} className="text-foreground-muted" />
            )}
          </div>
          <p className="truncate font-medium">{contract.name}</p>
          <p className="text-sm text-foreground-muted">
            {contract.amount ? `${contract.amount} € · ${CYCLE_LABELS[contract.billing_cycle]}` : CYCLE_LABELS[contract.billing_cycle]}
            {contract.cancellation_deadline &&
              ` · Kündigungsfrist: ${formatDate(contract.cancellation_deadline)}`}
            {!contract.cancellation_deadline &&
              contract.contract_end &&
              ` · Vertragsende: ${formatDate(contract.contract_end)}`}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            aria-label="Bearbeiten"
            onClick={() => setEditing(true)}
            className="rounded-md p-1.5 text-foreground-muted hover:bg-surface-muted"
          >
            <Pencil size={16} />
          </button>
          <button
            aria-label="Löschen"
            disabled={isPending}
            onClick={() => startTransition(() => deleteContractAction(contract.id))}
            className="rounded-md p-1.5 text-danger hover:bg-surface-muted"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {partnerTool && (
        <a
          href={buildDeepLink(partnerTool)}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="mt-3 flex items-center justify-between rounded-life bg-accent/10 px-3.5 py-2.5 text-sm font-medium text-accent hover:bg-accent/15"
        >
          <span className="flex items-center gap-2">
            <Sparkles size={14} />
            Günstigeren Tarif finden ({partnerTool.provider_name})
          </span>
          <ExternalLink size={14} />
        </a>
      )}
    </Card>
  );
}
