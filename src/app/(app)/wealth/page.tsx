import { requireSessionUser } from "@/lib/auth";
import { listWealthEntries, listWealthSnapshots } from "@/lib/wealth";
import { WEALTH_CATEGORIES } from "@/lib/wealth-constants";
import { Card } from "@/components/ui/card";
import { WealthItem } from "@/components/wealth/wealth-item";
import { NewWealthCard } from "@/components/wealth/new-wealth-card";
import { WealthDonut } from "@/components/wealth/wealth-donut";
import { WealthHistoryChart } from "@/components/wealth/wealth-history-chart";

export default async function WealthPage() {
  const user = await requireSessionUser();
  const [entries, snapshots] = await Promise.all([
    listWealthEntries(user.id),
    listWealthSnapshots(user.id),
  ]);

  const total = entries.reduce((sum, e) => sum + e.value, 0);
  const totals = WEALTH_CATEGORIES.map((category) => ({
    category,
    value: entries.filter((e) => e.category === category).reduce((sum, e) => sum + e.value, 0),
  }));

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Vermögensübersicht</h1>
        <p className="text-sm text-foreground-muted">
          Konten, Depots, Krypto und Sachwerte manuell erfassen — noch keine Bankanbindung.
        </p>
      </div>

      <Card>
        <p className="text-sm text-foreground-muted">Gesamtvermögen</p>
        <p className="font-heading text-3xl font-semibold">
          € {total.toLocaleString("de-DE", { maximumFractionDigits: 0 })}
        </p>
        <div className="mt-4">
          <WealthHistoryChart snapshots={snapshots} />
        </div>
      </Card>

      <Card>
        <p className="mb-3 font-heading font-semibold">Vermögensaufteilung</p>
        <WealthDonut totals={totals} />
      </Card>

      <NewWealthCard />

      <div className="flex flex-col gap-3">
        {entries.length === 0 ? (
          <p className="py-8 text-center text-sm text-foreground-muted">
            Noch keine Vermögenswerte erfasst.
          </p>
        ) : (
          entries.map((e) => <WealthItem key={e.id} entry={e} />)
        )}
      </div>
    </div>
  );
}
