"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { VehicleForm } from "@/components/garage/vehicle-form";
import { updateVehicleAction, deleteVehicleAction } from "@/lib/actions/vehicle-actions";
import type { VehicleRow } from "@/lib/vehicles";

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  return Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export function VehicleItem({
  vehicle,
  documents,
}: {
  vehicle: VehicleRow;
  documents: { id: string; original_name: string }[];
}) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const daysToInspection = daysUntil(vehicle.inspection_due);
  const inspectionUrgent = daysToInspection !== null && daysToInspection <= 60;

  if (editing) {
    return (
      <Card>
        <VehicleForm
          action={updateVehicleAction.bind(null, vehicle.id)}
          vehicle={vehicle}
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
    <Card className="flex items-center justify-between gap-3">
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          {vehicle.license_plate && (
            <span className="rounded-full bg-surface-muted px-2.5 py-0.5 text-xs font-medium">
              {vehicle.license_plate}
            </span>
          )}
          {inspectionUrgent && (
            <span className="rounded-full bg-danger/15 px-2.5 py-0.5 text-xs font-medium text-danger">
              TÜV bald fällig
            </span>
          )}
          {vehicle.document_id && <FileText size={14} className="text-foreground-muted" />}
        </div>
        <p className="truncate font-medium">{vehicle.name}</p>
        <p className="text-sm text-foreground-muted">
          {vehicle.value ? `€ ${vehicle.value.toLocaleString("de-DE")}` : "kein Wert hinterlegt"}
          {vehicle.inspection_due && ` · TÜV: ${formatDate(vehicle.inspection_due)}`}
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
          onClick={() => startTransition(() => deleteVehicleAction(vehicle.id))}
          className="rounded-md p-1.5 text-danger hover:bg-surface-muted"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </Card>
  );
}
