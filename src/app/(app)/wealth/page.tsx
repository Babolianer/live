import { requireSessionUser } from "@/lib/auth";
import { getDashboardData } from "@/lib/wealth-finance";
import { Card } from "@/components/ui/card";
import { AllocationDonut } from "@/components/wealth/allocation-donut";
import { NetWorthChart } from "@/components/wealth/net-worth-chart";
import { RefreshPricesButton } from "@/components/wealth/refresh-prices-button";
import { WealthSnapshotEditor } from "@/components/wealth/wealth-snapshot-editor";

function formatEuro(value: number) {
  return `€ ${value.toLocaleString("de-DE", { maximumFractionDigits: 0 })}`;
}

export default async function WealthDashboardPage() {
  const user = await requireSessionUser();
  const data = await getDashboardData(user.id);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-foreground-muted">Gesamtvermögen</p>
            <p className="font-heading text-3xl font-semibold">{formatEuro(data.overview.totalNetWorth)}</p>
            {data.overview.totalDebts > 0 && (
              <p className="text-xs text-foreground-muted">
                {formatEuro(data.overview.totalAssets)} Vermögen − {formatEuro(data.overview.totalDebts)} Schulden
              </p>
            )}
          </div>
          <RefreshPricesButton />
        </div>
        <div className="mt-4">
          <NetWorthChart points={data.history} />
        </div>
      </Card>

      <WealthSnapshotEditor snapshots={data.snapshots} />

      {data.staleAssets.length > 0 && (
        <Card className="bg-warning/10">
          <p className="mb-2 text-sm font-medium text-warning">Veraltete Kurse</p>
          <ul className="flex flex-col gap-1 text-sm text-foreground-muted">
            {data.staleAssets.map((a) => (
              <li key={a.id}>
                {a.name} ({a.groupName}) —{" "}
                {a.daysSinceUpdate === null ? "noch nie aktualisiert" : `seit ${a.daysSinceUpdate} Tagen nicht aktualisiert`}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card>
        <p className="mb-3 font-heading font-semibold">Vermögensaufteilung</p>
        <AllocationDonut allocation={data.allocation} />
      </Card>

      {data.topPositions.length > 0 && (
        <Card>
          <p className="mb-3 font-heading font-semibold">Top-Positionen</p>
          <div className="flex flex-col gap-2">
            {data.topPositions.map((p) => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <span className="truncate">
                  {p.name} {p.symbol && <span className="text-foreground-muted">({p.symbol})</span>}
                </span>
                <span className="shrink-0 font-medium">{formatEuro(p.value)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {data.goals.length > 0 && (
        <Card>
          <p className="mb-3 font-heading font-semibold">Sparziele</p>
          <div className="flex flex-col gap-3">
            {data.goals.map((g) => (
              <div key={g.goalId}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span>{g.name}</span>
                  <span className="text-foreground-muted">{g.progressPercent}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
                  <div className="h-full bg-accent" style={{ width: `${Math.min(g.progressPercent, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {data.groups.length === 0 && (
        <Card>
          <p className="text-center text-sm text-foreground-muted">
            Noch keine Vermögensgruppen angelegt — starte unter &bdquo;Vermögen&ldquo;.
          </p>
        </Card>
      )}
    </div>
  );
}
