import { query, newId, nowIso } from "@/lib/db";
import { listWealthGroups } from "@/lib/wealth-groups";
import { listWealthAssets, getWealthAsset, setWealthAssetQuantityAndPrice } from "@/lib/wealth-assets";
import {
  ASSET_TYPE_LABELS,
  LONG_TERM_GROUP_TYPES,
  type AssetTyp,
} from "@/lib/wealth-asset-constants";
import type {
  AssetAllocation,
  GroupSummary,
  NetWorthSnapshotRow,
  SavingsGoalProgress,
  SectorAllocation,
  StaleAssetInfo,
  TopPosition,
  WealthDashboardData,
  WealthOverview,
} from "@/lib/wealth-types";

function safePercent(part: number, total: number): number {
  if (!total) return 0;
  return Math.round((part / total) * 1000) / 10;
}

// ── Asset values / allocation ──────────────────────────────────────────

export async function getAssetValues(userId: string): Promise<Record<AssetTyp, number>> {
  const assets = await listWealthAssets(userId);
  const values: Record<string, number> = {
    CASH: 0, ETF: 0, STOCK: 0, CRYPTO: 0, METAL: 0, TAGESGELD: 0, IMMOBILIE: 0, OTHER: 0,
  };
  for (const asset of assets) {
    values[asset.typ] = (values[asset.typ] || 0) + asset.quantity * asset.price_per_unit;
  }
  return values as Record<AssetTyp, number>;
}

export async function getTotalAssetsValue(userId: string): Promise<number> {
  const values = await getAssetValues(userId);
  return Object.values(values).reduce((a, b) => a + b, 0);
}

export async function getGroupSummaries(userId: string): Promise<GroupSummary[]> {
  const [groups, assets] = await Promise.all([listWealthGroups(userId), listWealthAssets(userId)]);
  return groups.map((g) => {
    const groupAssets = assets.filter((a) => a.group_id === g.id);
    return {
      id: g.id,
      name: g.name,
      typ: g.typ,
      farbe: g.farbe,
      icon: g.icon,
      totalValue: groupAssets.reduce((sum, a) => sum + a.quantity * a.price_per_unit, 0),
      assetCount: groupAssets.length,
    };
  });
}

export async function getStaleAssets(userId: string): Promise<StaleAssetInfo[]> {
  const [groups, assets] = await Promise.all([listWealthGroups(userId), listWealthAssets(userId)]);
  const groupById = new Map(groups.map((g) => [g.id, g]));
  const now = Date.now();

  return assets
    .map((a) => {
      const group = groupById.get(a.group_id);
      const daysSinceUpdate = a.price_updated_at ? Math.floor((now - new Date(a.price_updated_at).getTime()) / 86_400_000) : null;
      return {
        id: a.id,
        name: a.name,
        groupName: group?.name ?? "—",
        daysSinceUpdate,
        staleAfterDays: group?.stale_after_days ?? 30,
      };
    })
    .filter((a) => a.daysSinceUpdate === null || a.daysSinceUpdate > a.staleAfterDays);
}

export async function getTotalDebts(userId: string): Promise<number> {
  const rows = await query<{ total: number | null }[]>(
    `SELECT SUM(remaining_amount) as total FROM wealth_debts WHERE user_id = ?`,
    [userId]
  );
  return rows[0]?.total ?? 0;
}

export async function getTopPositions(userId: string, limit = 10): Promise<TopPosition[]> {
  const [groups, assets] = await Promise.all([listWealthGroups(userId), listWealthAssets(userId)]);
  const groupById = new Map(groups.map((g) => [g.id, g]));

  return assets
    .map((a) => ({
      id: a.id,
      name: a.name,
      symbol: a.symbol,
      assetTyp: a.typ,
      value: a.quantity * a.price_per_unit,
      groupName: groupById.get(a.group_id)?.name ?? "—",
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

export async function getSectorAllocation(userId: string): Promise<SectorAllocation[]> {
  const rows = await query<{ sector_name: string; sector_color: string; quantity: number; price_per_unit: number }[]>(
    `SELECT s.name as sector_name, s.color as sector_color, a.quantity, a.price_per_unit
     FROM wealth_assets a JOIN wealth_sectors s ON s.id = a.sector_id
     WHERE a.user_id = ?`,
    [userId]
  );
  const total = rows.reduce((sum, r) => sum + r.quantity * r.price_per_unit, 0);
  if (total === 0) return [];

  const bySector = new Map<string, { color: string; value: number }>();
  for (const r of rows) {
    const entry = bySector.get(r.sector_name) ?? { color: r.sector_color, value: 0 };
    entry.value += r.quantity * r.price_per_unit;
    bySector.set(r.sector_name, entry);
  }

  return Array.from(bySector.entries())
    .map(([sectorName, { color, value }]) => ({ sectorName, sectorColor: color, value, percent: safePercent(value, total) }))
    .sort((a, b) => b.value - a.value);
}

// ── Net worth snapshots ─────────────────────────────────────────────────

export async function createSnapshot(userId: string) {
  const values = await getAssetValues(userId);
  const totalAssets = Object.values(values).reduce((a, b) => a + b, 0);
  const totalDebts = await getTotalDebts(userId);
  const netWorth = totalAssets - totalDebts;
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  const dateIso = date.toISOString();

  const existing = await query<{ id: string }[]>(
    `SELECT id FROM wealth_net_worth_snapshots WHERE user_id = ? AND date = ?`,
    [userId, dateIso]
  );
  if (existing[0]) {
    await query(`UPDATE wealth_net_worth_snapshots SET net_worth=?, total_debts=?, breakdown_json=? WHERE id=?`, [
      netWorth,
      totalDebts,
      JSON.stringify(values),
      existing[0].id,
    ]);
  } else {
    await query(
      `INSERT INTO wealth_net_worth_snapshots (id, user_id, date, net_worth, total_debts, breakdown_json) VALUES (?, ?, ?, ?, ?, ?)`,
      [newId(), userId, dateIso, netWorth, totalDebts, JSON.stringify(values)]
    );
  }
}

export async function listNetWorthSnapshots(userId: string, limit = 365): Promise<NetWorthSnapshotRow[]> {
  const rows = await query<NetWorthSnapshotRow[]>(
    `SELECT id, date, net_worth, total_debts FROM wealth_net_worth_snapshots WHERE user_id = ? ORDER BY date DESC LIMIT ?`,
    [userId, limit]
  );
  return rows.reverse();
}

// ── Manual snapshot editing ──────────────────────────────────────────────
// Lets a user enter/correct real historical net-worth figures they know from
// old statements — separate from createSnapshot's automatic, current-value
// snapshots. breakdown_json stays empty ({}) for manual entries since we have
// no real per-type split for a point the user just typed in.

export async function insertManualSnapshot(userId: string, date: string, netWorth: number, totalDebts: number) {
  const dayIso = new Date(date).toISOString();
  const existing = await query<{ id: string }[]>(
    `SELECT id FROM wealth_net_worth_snapshots WHERE user_id = ? AND date = ?`,
    [userId, dayIso]
  );
  if (existing[0]) {
    await query(`UPDATE wealth_net_worth_snapshots SET net_worth=?, total_debts=? WHERE id=?`, [netWorth, totalDebts, existing[0].id]);
    return existing[0].id;
  }
  const id = newId();
  await query(
    `INSERT INTO wealth_net_worth_snapshots (id, user_id, date, net_worth, total_debts, breakdown_json) VALUES (?, ?, ?, ?, ?, '{}')`,
    [id, userId, dayIso, netWorth, totalDebts]
  );
  return id;
}

export async function updateManualSnapshot(id: string, userId: string, netWorth: number, totalDebts: number) {
  await query(`UPDATE wealth_net_worth_snapshots SET net_worth=?, total_debts=? WHERE id=? AND user_id=?`, [
    netWorth,
    totalDebts,
    id,
    userId,
  ]);
}

export async function deleteSnapshot(id: string, userId: string) {
  await query(`DELETE FROM wealth_net_worth_snapshots WHERE id = ? AND user_id = ?`, [id, userId]);
}

// ── Dashboard ─────────────────────────────────────────────────────────

export async function getGoalProgress(userId: string, values?: Record<AssetTyp, number>): Promise<SavingsGoalProgress[]> {
  const assetValues = values ?? (await getAssetValues(userId));
  const goals = await query<{
    id: string; name: string; target_type: AssetTyp; target_amount: number; monthly_contribution: number; unit_label: string;
  }[]>(`SELECT id, name, target_type, target_amount, monthly_contribution, unit_label FROM wealth_savings_goals WHERE user_id = ? ORDER BY created_at ASC`, [userId]);

  return goals.map((goal) => {
    const currentValue = assetValues[goal.target_type] ?? 0;
    const remaining = Math.max(goal.target_amount - currentValue, 0);
    const months = goal.monthly_contribution > 0 ? Math.ceil(remaining / goal.monthly_contribution) : null;
    const estimatedDate = months === null ? null : new Date(new Date().setMonth(new Date().getMonth() + months)).toISOString();

    return {
      goalId: goal.id,
      name: goal.name,
      targetLabel: `${goal.target_amount.toLocaleString("de-DE")} ${goal.unit_label}`,
      currentValue,
      targetValue: goal.target_amount,
      progressPercent: Math.min(safePercent(currentValue, goal.target_amount), 100),
      remaining,
      estimatedCompletionDate: remaining === 0 ? new Date().toISOString() : estimatedDate,
    };
  });
}

function calculateDiversificationScore(allocation: AssetAllocation) {
  if (!allocation.length) return 0;
  const ideal = 100 / allocation.length;
  const deviation = allocation.reduce((sum, slice) => sum + Math.abs(slice.percent - ideal), 0);
  return Math.max(0, Math.round(100 - deviation));
}

export async function getDashboardData(userId: string): Promise<WealthDashboardData> {
  const values = await getAssetValues(userId);
  const [snapshots, goals, groups, staleAssets, sectorAllocation, topPositions, totalDebts] = await Promise.all([
    listNetWorthSnapshots(userId),
    getGoalProgress(userId, values),
    getGroupSummaries(userId),
    getStaleAssets(userId),
    getSectorAllocation(userId),
    getTopPositions(userId),
    getTotalDebts(userId),
  ]);

  const totalAssets = Object.values(values).reduce((a, b) => a + b, 0);
  const totalNetWorth = totalAssets - totalDebts;

  const longTermGroups = groups.filter((g) => LONG_TERM_GROUP_TYPES.includes(g.typ));
  const longTermValue = longTermGroups.reduce((s, g) => s + g.totalValue, 0);
  const longTermGroupIds = new Set(longTermGroups.map((g) => g.id));

  const previousSnapshot = snapshots.at(-2)?.net_worth;
  const previousMonthValue = previousSnapshot ?? totalNetWorth * 0.96;
  const changeThisMonthAbsolute = totalNetWorth - previousMonthValue;

  const overview: WealthOverview = {
    totalNetWorth,
    totalAssets,
    totalDebts,
    liquidAssets: values.CASH + values.TAGESGELD,
    investedAssets: values.ETF + values.STOCK + values.CRYPTO,
    changeThisMonthAbsolute,
    changeThisMonthPercent: safePercent(changeThisMonthAbsolute, previousMonthValue),
    asOf: new Date().toISOString(),
  };

  const assetsForAllocation = await listWealthAssets(userId);
  const allocationBuckets: Record<string, number> = { ALTERSVORSORGE: 0 };
  for (const a of assetsForAllocation) {
    const value = a.quantity * a.price_per_unit;
    const key = longTermGroupIds.has(a.group_id) ? "ALTERSVORSORGE" : a.typ;
    allocationBuckets[key] = (allocationBuckets[key] || 0) + value;
  }

  const allocation: AssetAllocation = Object.entries(allocationBuckets)
    .map(([key, value]) => ({
      assetTyp: key as AssetTyp | "ALTERSVORSORGE",
      label: key === "ALTERSVORSORGE" ? "Altersvorsorge" : ASSET_TYPE_LABELS[key as AssetTyp] || key,
      value,
      percent: safePercent(value, totalAssets),
    }))
    .filter((slice) => slice.value > 0)
    .sort((a, b) => b.value - a.value);

  return {
    overview,
    cards: [
      { label: "Gesamtvermögen", value: totalAssets },
      { label: "Cash", value: values.CASH },
      { label: "Tagesgeld", value: values.TAGESGELD },
      { label: "ETF", value: values.ETF },
      { label: "Aktien", value: values.STOCK },
      { label: "Krypto", value: values.CRYPTO },
      { label: "Edelmetalle", value: values.METAL },
      { label: "Immobilien", value: values.IMMOBILIE },
      { label: "Altersvorsorge", value: longTermValue },
      { label: "Sonstiges", value: values.OTHER },
    ],
    allocation,
    history: snapshots.map((s) => ({ date: s.date.slice(0, 10), value: s.net_worth })),
    snapshots,
    goals,
    groups,
    staleAssets,
    sectorAllocation,
    topPositions,
    diversificationScore: calculateDiversificationScore(allocation),
  };
}

// ── Transactions (buy/sell), average-cost recomputation ────────────────

export type WealthTransactionRow = {
  id: string;
  user_id: string;
  asset_id: string;
  date: string;
  type: "BUY" | "SELL";
  quantity: number;
  price_per_unit: number;
  notes: string | null;
  savings_plan_id: string | null;
  is_anchor: number;
  created_at: string;
};

export async function getAssetTransactions(assetId: string, userId: string) {
  return query<WealthTransactionRow[]>(
    `SELECT * FROM wealth_transactions WHERE asset_id = ? AND user_id = ? ORDER BY date DESC`,
    [assetId, userId]
  );
}

// Replays a chronologically-sorted transaction list into a resulting
// quantity + average cost — mirrors the source app's deriveFromTransactions.
function deriveFromTransactions(transactions: { type: string; quantity: number; price_per_unit: number }[]) {
  let qty = 0;
  let avgCost = 0;
  for (const t of transactions) {
    if (t.type === "BUY") {
      const newQty = qty + t.quantity;
      avgCost = qty > 0 ? (qty * avgCost + t.quantity * t.price_per_unit) / newQty : t.price_per_unit;
      qty = newQty;
    } else {
      qty = Math.max(0, qty - t.quantity);
      if (qty === 0) avgCost = 0;
    }
  }
  return { quantity: qty, avgCost };
}

// Recomputes an asset's quantity + average price from scratch out of its real
// transaction history rather than incrementally tracking it — self-healing
// against drift. pricePerUnit is only overwritten when the transactions
// themselves yield a cost basis (avgCost > 0); otherwise the last live price
// stays untouched.
export async function recomputeAssetFromTransactions(assetId: string, userId: string) {
  const transactions = await query<{ type: string; quantity: number; price_per_unit: number }[]>(
    `SELECT type, quantity, price_per_unit FROM wealth_transactions WHERE asset_id = ? ORDER BY date ASC`,
    [assetId]
  );
  const { quantity, avgCost } = deriveFromTransactions(transactions);
  await setWealthAssetQuantityAndPrice(assetId, quantity, avgCost > 0 ? avgCost : null);
  await createSnapshot(userId);
}

export async function addTransaction(
  userId: string,
  assetId: string,
  input: { type: "BUY" | "SELL"; quantity: number; pricePerUnit: number; date: string; notes: string | null },
  options?: { savingsPlanId?: string; isAnchor?: boolean }
) {
  const asset = await getWealthAsset(assetId, userId);
  if (!asset) throw new Error("Asset nicht gefunden");

  if (input.type === "SELL") {
    const transactions = await query<{ type: string; quantity: number; price_per_unit: number }[]>(
      `SELECT type, quantity, price_per_unit FROM wealth_transactions WHERE asset_id = ? ORDER BY date ASC`,
      [assetId]
    );
    const { quantity: currentQty } = deriveFromTransactions(transactions);
    if (input.quantity > currentQty) throw new Error("Verkaufsmenge übersteigt Bestand");
  }

  const id = newId();
  await query(
    `INSERT INTO wealth_transactions (id, user_id, asset_id, date, type, quantity, price_per_unit, notes, savings_plan_id, is_anchor, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      userId,
      assetId,
      input.date,
      input.type,
      input.quantity,
      input.pricePerUnit,
      input.notes,
      options?.savingsPlanId ?? null,
      options?.isAnchor ? 1 : 0,
      nowIso(),
    ]
  );
  await recomputeAssetFromTransactions(assetId, userId);
  return id;
}

export async function updateTransaction(
  id: string,
  userId: string,
  changes: { type?: "BUY" | "SELL"; quantity?: number; pricePerUnit?: number; date?: string; notes?: string | null }
) {
  const rows = await query<WealthTransactionRow[]>(`SELECT * FROM wealth_transactions WHERE id = ? AND user_id = ?`, [id, userId]);
  const tx = rows[0];
  if (!tx) throw new Error("Transaktion nicht gefunden");

  const newType = changes.type ?? tx.type;
  const newQuantity = changes.quantity ?? tx.quantity;
  const newPrice = changes.pricePerUnit ?? tx.price_per_unit;

  if (newType === "SELL") {
    const others = await query<{ type: string; quantity: number; price_per_unit: number }[]>(
      `SELECT type, quantity, price_per_unit FROM wealth_transactions WHERE asset_id = ? AND id != ? ORDER BY date ASC`,
      [tx.asset_id, id]
    );
    const { quantity: baseQty } = deriveFromTransactions(others);
    if (newQuantity > baseQty) throw new Error("Verkaufsmenge übersteigt Bestand");
  }

  await query(
    `UPDATE wealth_transactions SET type=?, quantity=?, price_per_unit=?, date=?, notes=? WHERE id=? AND user_id=?`,
    [newType, newQuantity, newPrice, changes.date ?? tx.date, changes.notes !== undefined ? changes.notes : tx.notes, id, userId]
  );
  await recomputeAssetFromTransactions(tx.asset_id, userId);
}

export async function deleteTransaction(id: string, userId: string) {
  const rows = await query<WealthTransactionRow[]>(`SELECT * FROM wealth_transactions WHERE id = ? AND user_id = ?`, [id, userId]);
  const tx = rows[0];
  if (!tx) return;
  await query(`DELETE FROM wealth_transactions WHERE id = ? AND user_id = ?`, [id, userId]);
  await recomputeAssetFromTransactions(tx.asset_id, userId);
}

// ── Debts ────────────────────────────────────────────────────────────

export type WealthDebtRow = {
  id: string;
  user_id: string;
  asset_id: string;
  name: string;
  original_amount: number;
  remaining_amount: number;
  interest_rate: number;
  monthly_payment: number;
  start_date: string;
  created_at: string;
  updated_at: string;
};

export async function listDebtsForAsset(assetId: string, userId: string) {
  return query<WealthDebtRow[]>(`SELECT * FROM wealth_debts WHERE asset_id = ? AND user_id = ? ORDER BY created_at ASC`, [assetId, userId]);
}

export type WealthDebtInput = {
  assetId: string;
  name: string;
  originalAmount: number;
  remainingAmount: number;
  interestRate: number;
  monthlyPayment: number;
  startDate: string;
};

export async function insertDebt(userId: string, input: WealthDebtInput) {
  const id = newId();
  const now = nowIso();
  await query(
    `INSERT INTO wealth_debts (id, user_id, asset_id, name, original_amount, remaining_amount, interest_rate, monthly_payment, start_date, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, userId, input.assetId, input.name, input.originalAmount, input.remainingAmount, input.interestRate, input.monthlyPayment, input.startDate, now, now]
  );
  return id;
}

export async function updateDebt(id: string, userId: string, input: WealthDebtInput) {
  await query(
    `UPDATE wealth_debts SET name=?, original_amount=?, remaining_amount=?, interest_rate=?, monthly_payment=?, start_date=?, updated_at=?
     WHERE id=? AND user_id=?`,
    [input.name, input.originalAmount, input.remainingAmount, input.interestRate, input.monthlyPayment, input.startDate, nowIso(), id, userId]
  );
}

export async function deleteDebt(id: string, userId: string) {
  await query(`DELETE FROM wealth_debts WHERE id = ? AND user_id = ?`, [id, userId]);
}

export { deriveFromTransactions };
