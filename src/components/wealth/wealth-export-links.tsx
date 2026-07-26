import { Download } from "lucide-react";
import { Card } from "@/components/ui/card";

const linkClass =
  "flex items-center gap-1.5 rounded-life border border-border bg-surface-muted px-3 py-2 text-sm text-foreground-muted hover:bg-surface-muted/70";

export function WealthExportLinks() {
  return (
    <Card className="flex flex-col gap-2">
      <p className="text-sm font-medium">Daten exportieren</p>
      <div className="flex flex-wrap gap-2">
        <a href="/api/wealth/export" download className={linkClass}>
          <Download size={14} /> Komplettexport (JSON)
        </a>
        <a href="/api/wealth/export?table=wealth_transactions" download className={linkClass}>
          <Download size={14} /> Transaktionen (CSV)
        </a>
      </div>
    </Card>
  );
}
