"use client";

import { useState } from "react";
import { CheckCircle2, Car } from "lucide-react";
import { Card } from "@/components/ui/card";
import { VehicleForm } from "@/components/garage/vehicle-form";
import { createVehicleAction, updateVehicleAction } from "@/lib/actions/vehicle-actions";

export type VehicleProposal = {
  id?: string;
  name: string;
  licensePlate?: string | null;
  purchaseDate?: string | null;
  value?: number | null;
  inspectionDue?: string | null;
  notes?: string | null;
};

export function VehicleProposalCard({ proposal }: { proposal: VehicleProposal }) {
  const [saved, setSaved] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const isUpdate = !!proposal.id;

  if (dismissed) return null;
  if (saved) {
    return (
      <Card className="flex items-center gap-2 border-success/30 bg-success/10 text-success">
        <CheckCircle2 size={18} />
        <span className="text-sm font-medium">
          Fahrzeug &quot;{proposal.name}&quot; wurde {isUpdate ? "aktualisiert" : "angelegt"}.
        </span>
      </Card>
    );
  }

  return (
    <Card>
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-accent">
        <Car size={16} />
        {isUpdate ? "Änderung" : "Fahrzeug-Vorschlag"} — bitte prüfen und bestätigen
      </div>
      <VehicleForm
        action={isUpdate ? updateVehicleAction.bind(null, proposal.id!) : createVehicleAction}
        vehicle={{
          name: proposal.name,
          license_plate: proposal.licensePlate ?? null,
          purchase_date: proposal.purchaseDate ?? null,
          value: proposal.value ?? null,
          inspection_due: proposal.inspectionDue ?? null,
          notes: proposal.notes ?? null,
        }}
        documents={[]}
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
