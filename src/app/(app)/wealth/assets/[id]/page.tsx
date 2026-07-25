import { notFound } from "next/navigation";
import { requireSessionUser } from "@/lib/auth";
import { getWealthAsset } from "@/lib/wealth-assets";
import { listWealthGroups } from "@/lib/wealth-groups";
import { listWealthSectors } from "@/lib/wealth-sectors";
import { getAssetTransactions, listDebtsForAsset } from "@/lib/wealth-finance";
import { ensurePriceHistoryCoverage, listPriceHistory } from "@/lib/wealth-prices";
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

  const group = groups.find((g) => g.id === asset.group_id);

  return (
    <div className="flex flex-col gap-6">
      <WealthAssetHeader asset={asset} groupName={group?.name ?? "—"} groups={groups} sectors={sectors} />

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
