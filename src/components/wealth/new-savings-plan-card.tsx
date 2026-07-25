"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WealthSavingsPlanForm } from "@/components/wealth/wealth-savings-plan-form";
import { createSavingsPlanAction } from "@/lib/actions/wealth-savings-plan-actions";
import type { WealthAssetRow } from "@/lib/wealth-assets";

export function NewSavingsPlanCard({ assets }: { assets: WealthAssetRow[] }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button variant="secondary" className="w-full" onClick={() => setOpen(true)}>
        <Plus size={16} /> Sparplan hinzufügen
      </Button>
    );
  }

  return (
    <Card>
      <WealthSavingsPlanForm action={createSavingsPlanAction} assets={assets} onDone={() => setOpen(false)} submitLabel="Hinzufügen" />
      <button onClick={() => setOpen(false)} className="mt-3 w-full text-center text-sm text-foreground-muted hover:underline">
        Abbrechen
      </button>
    </Card>
  );
}
