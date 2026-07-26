import { notFound } from "next/navigation";
import { requireSessionUser } from "@/lib/auth";
import { getWealthAsset } from "@/lib/wealth-assets";
import { listWealthGroups } from "@/lib/wealth-groups";
import { listWealthSectors } from "@/lib/wealth-sectors";
import { getAssetTransactions, listDebtsForAsset } from "@/lib/wealth-finance";
import { ensurePriceHistoryCoverage, listPriceHistory } from "@/lib/wealth-prices";
import { getRealEstateDetails } from "@/lib/wealth-real-estate";
import { LIVE_PRICE_ASSET_TYPES } from "@/lib/wealth-asset-constants";
import { Card } from "@/components/ui/card";
import { WealthAssetHeader } from "@/components/wealth/wealth-asset-header";
import { NetWorthChart } from "@/components/wealth/net-worth-chart";
import { WealthTransactionForm } from "@/components/wealth/wealth-transaction-form";
import { WealthTransactionList } from "@/components/wealth/wealth-transaction-list";
import { WealthDebtSection } from "@/components/wealth/wealth-debt-section";
import { createTransactionAction } from "@/lib/actions/wealth-transaction-actions";

export default async function WealthAssetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireSessionUser();
  const { id } = await params;

  const asset = await getWealthAsset(id, user.id);
  if (!asset) notFound();

  const [groups, sectors, transactions, debts] = await Promise.all([
    listWealthGroups(user.id),
    listWealthSectors(user.id),
    getAssetTransactions(id, user.id),
    listDebtsForAsset(id, user.id),
  ]);

  const isLivePriced = LIVE_PRICE_ASSET_TYPES.includes(asset.typ) && !!asset.symbol;
  if (isLivePriced) {
    await ensurePriceHistoryCoverage(user.id, { id: asset.id, symbol: asset.symbol, typ: asset.typ });
  }
  const priceHistory = isLivePriced ? await listPriceHistory(id, user.id) : [];
  const realEstateDetails = asset.typ === "IMMOBILIE" ? await getRealEstateDetails(id, user.id) : null;

  const group = groups.find((g) => g.id === asset.group_id);

  return (
    <div className="flex flex-col gap-6">
      <WealthAssetHeader asset={asset} groupName={group?.name ?? "—"} groups={groups} sectors={sectors} />

      {realEstateDetails && (
        <Card>
          <p className="mb-3 font-heading font-semibold">Objektdaten</p>
          <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            {realEstateDetails.living_area !== null && (
              <div>
                <dt className="text-foreground-muted">Wohnfläche</dt>
                <dd className="font-medium">{realEstateDetails.living_area} m²</dd>
              </div>
            )}
            {realEstateDetails.land_area !== null && (
              <div>
                <dt className="text-foreground-muted">Grundstück</dt>
                <dd className="font-medium">{realEstateDetails.land_area} m²</dd>
              </div>
            )}
            {realEstateDetails.rooms !== null && (
              <div>
                <dt className="text-foreground-muted">Zimmer</dt>
                <dd className="font-medium">{realEstateDetails.rooms}</dd>
              </div>
            )}
            {realEstateDetails.build_year !== null && (
              <div>
                <dt className="text-foreground-muted">Baujahr</dt>
                <dd className="font-medium">{realEstateDetails.build_year}</dd>
              </div>
            )}
            {realEstateDetails.energy_class !== null && (
              <div>
                <dt className="text-foreground-muted">Energieklasse</dt>
                <dd className="font-medium">{realEstateDetails.energy_class}</dd>
              </div>
            )}
            {realEstateDetails.condition !== null && (
              <div>
                <dt className="text-foreground-muted">Zustand</dt>
                <dd className="font-medium">{realEstateDetails.condition}</dd>
              </div>
            )}
          </dl>
          {realEstateDetails.source_url && (
            <a
              href={realEstateDetails.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block text-sm text-accent hover:underline"
            >
              Quelle: {realEstateDetails.source_url}
            </a>
          )}
        </Card>
      )}

      {isLivePriced && (
        <Card>
          <p className="mb-3 font-heading font-semibold">Kursverlauf</p>
          <NetWorthChart points={priceHistory.map((p) => ({ date: p.date.slice(0, 10), value: p.price }))} />
        </Card>
      )}

      <Card>
        <p className="mb-3 font-heading font-semibold">Transaktion buchen</p>
        <WealthTransactionForm action={createTransactionAction.bind(null, id)} />
      </Card>

      <Card>
        <p className="mb-1 font-heading font-semibold">Transaktionen</p>
        <WealthTransactionList transactions={transactions} assetId={id} />
      </Card>

      <Card>
        <p className="mb-1 font-heading font-semibold">Schulden</p>
        <WealthDebtSection debts={debts} assetId={id} />
      </Card>
    </div>
  );
}
