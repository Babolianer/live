"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VehicleForm } from "@/components/garage/vehicle-form";
import { createVehicleAction } from "@/lib/actions/vehicle-actions";

export function NewVehicleCard({
  documents,
}: {
  documents: { id: string; original_name: string }[];
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button variant="secondary" className="w-full" onClick={() => setOpen(true)}>
        <Plus size={16} /> Fahrzeug hinzufügen
      </Button>
    );
  }

  return (
    <Card>
      <VehicleForm
        action={createVehicleAction}
        documents={documents}
        onDone={() => setOpen(false)}
        submitLabel="Hinzufügen"
      />
      <button
        onClick={() => setOpen(false)}
        className="mt-3 w-full text-center text-sm text-foreground-muted hover:underline"
      >
        Abbrechen
      </button>
    </Card>
  );
}
