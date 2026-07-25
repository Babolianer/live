import { query, newId, nowIso } from "@/lib/db";
import { getWealthAsset } from "@/lib/wealth-assets";
import { addTransaction, deleteTransaction } from "@/lib/wealth-finance";
import { ensurePriceHistoryCoverage } from "@/lib/wealth-prices";
import type { SavingsPlanInterval } from "@/lib/wealth-asset-constants";

export type WealthSavingsPlanRow = {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  interval: SavingsPlanInterval;
  start_date: string;
  end_date: string | null;
  target_asset_id: string;
  notes: string | null;
  anchor_date: string | null;
  anchor_quantity: number | null;
  created_at: string;
  updated_at: string;
};

export async function listSavingsPlans(userId: string) {
  return query<WealthSavingsPlanRow[]>(`SELECT * FROM wealth_savings_plans WHERE user_id = ? ORDER BY start_date ASC`, [userId]);
}

export async function getSavingsPlan(id: string, userId: string) {
  const rows = await query<WealthSavingsPlanRow[]>(`SELECT * FROM wealth_savings_plans WHERE id = ? AND user_id = ?`, [id, userId]);
  return rows[0] ?? null;
}

export type SavingsPlanInput = {
  name: string;
  amount: number;
  interval: SavingsPlanInterval;
  startDate: string;
  endDate: string | null;
  targetAssetId: string;
  notes: string | null;
  anchorDate: string | null;
  anchorQuantity: number | null;
};

export async function insertSavingsPlan(userId: string, input: SavingsPlanInput) {
  const id = newId();
  const now = nowIso();
  await query(
    `INSERT INTO wealth_savings_plans (id, user_id, name, amount, interval, start_date, end_date, target_asset_id, notes, anchor_date, anchor_quantity, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, userId, input.name, input.amount, input.interval, input.startDate, input.endDate, input.targetAssetId, input.notes, input.anchorDate, input.anchorQuantity, now, now]
  );
  await setSavingsPlanAnchor(userId, id, input.targetAssetId, input.name, input.anchorDate, input.anchorQuantity);
  return id;
}

export async function updateSavingsPlan(id: string, userId: string, input: SavingsPlanInput) {
  await query(
    `UPDATE wealth_savings_plans SET name=?, amount=?, interval=?, start_date=?, end_date=?, notes=?, anchor_date=?, anchor_quantity=?, updated_at=?
     WHERE id=? AND user_id=?`,
    [input.name, input.amount, input.interval, input.startDate, input.endDate, input.notes, input.anchorDate, input.anchorQuantity, nowIso(), id, userId]
  );
  await setSavingsPlanAnchor(userId, id, input.targetAssetId, input.name, input.anchorDate, input.anchorQuantity);
}

export async function deleteSavingsPlan(id: string, userId: string) {
  await query(`DELETE FROM wealth_savings_plans WHERE id = ? AND user_id = ?`, [id, userId]);
}

// Sets/changes/removes a savings plan's starting-balance anchor. The anchor is
// a normal, visible BUY transaction (is_anchor=1) rather than a hidden extra
// value, so quantity/avg-cost/the transaction list stay consistent.
export async function setSavingsPlanAnchor(
  userId: string,
  planId: string,
  targetAssetId: string,
  planName: string,
  anchorDate: string | null,
  anchorQuantity: number | null
) {
  const existingRows = await query<{ id: string; date: string; quantity: number }[]>(
    `SELECT id, date, quantity FROM wealth_transactions WHERE savings_plan_id = ? AND is_anchor = 1`,
    [planId]
  );
  const existingAnchor = existingRows[0];

  if (!anchorDate || !anchorQuantity) {
    if (existingAnchor) await deleteTransaction(existingAnchor.id, userId);
    return;
  }

  const anchorDay = new Date(anchorDate);
  anchorDay.setHours(0, 0, 0, 0);

  if (existingAnchor) {
    const existingDay = new Date(existingAnchor.date);
    existingDay.setHours(0, 0, 0, 0);
    if (existingDay.getTime() === anchorDay.getTime() && existingAnchor.quantity === anchorQuantity) {
      return; // unchanged
    }
    await deleteTransaction(existingAnchor.id, userId);
  }

  // Other installments at/before the new anchor are now covered by it.
  const covered = await query<{ id: string }[]>(
    `SELECT id FROM wealth_transactions WHERE savings_plan_id = ? AND is_anchor = 0 AND date <= ?`,
    [planId, anchorDay.toISOString()]
  );
  for (const tx of covered) await deleteTransaction(tx.id, userId);

  const asset = await getWealthAsset(targetAssetId, userId);
  const price = asset ? asset.price_per_unit : 0;

  await addTransaction(
    userId,
    targetAssetId,
    { type: "BUY", quantity: anchorQuantity, pricePerUnit: price, date: anchorDay.toISOString(), notes: `Startbestand: ${planName}` },
    { savingsPlanId: planId, isAnchor: true }
  );
}

const INTERVAL_MONTHS: Record<SavingsPlanInterval, number> = { MONTHLY: 1, QUARTERLY: 3, YEARLY: 12 };

function nextDueDateFrom(effectiveStart: Date, intervalMonths: number, now: Date): Date {
  let i = 0;
  let due = new Date(effectiveStart);
  while (due < now) {
    i++;
    due = new Date(effectiveStart);
    due.setMonth(due.getMonth() + i * intervalMonths);
  }
  return due;
}

function planNextDueDate(plan: WealthSavingsPlanRow, now: Date): Date | null {
  const intervalMonths = INTERVAL_MONTHS[plan.interval] ?? 1;
  const anchor = plan.anchor_date ? new Date(plan.anchor_date) : null;
  const floor = anchor && anchor > now ? anchor : now;
  const dueDate = nextDueDateFrom(new Date(plan.start_date), intervalMonths, floor);
  if (plan.end_date && dueDate > new Date(plan.end_date)) return null;
  return dueDate;
}

export interface SavingsPlanSummary {
  id: string;
  name: string;
  amount: number;
  interval: SavingsPlanInterval;
  startDate: string;
  targetAssetName: string;
  targetAssetSymbol: string | null;
  executedInstallments: number;
  totalInvested: number;
  sharesAcquired: number;
  currentValue: number | null;
  currentPrice: number;
  nextDueDate: string | null;
  anchorDate: string | null;
  anchorQuantity: number | null;
}

export async function getSavingsPlanSummaries(userId: string): Promise<SavingsPlanSummary[]> {
  const plans = await listSavingsPlans(userId);
  const now = new Date();

  const summaries: SavingsPlanSummary[] = [];
  for (const plan of plans) {
    const asset = await getWealthAsset(plan.target_asset_id, userId);
    const buys = await query<{ quantity: number; price_per_unit: number }[]>(
      `SELECT quantity, price_per_unit FROM wealth_transactions WHERE savings_plan_id = ? AND type = 'BUY'`,
      [plan.id]
    );
    const totalInvested = buys.reduce((s, t) => s + t.quantity * t.price_per_unit, 0);
    const sharesAcquired = buys.reduce((s, t) => s + t.quantity, 0);
    const currentPrice = asset?.price_per_unit ?? 0;
    const nextDueDate = planNextDueDate(plan, now);

    summaries.push({
      id: plan.id,
      name: plan.name,
      amount: plan.amount,
      interval: plan.interval,
      startDate: plan.start_date,
      targetAssetName: asset?.name ?? "—",
      targetAssetSymbol: asset?.symbol ?? null,
      executedInstallments: buys.length,
      totalInvested,
      sharesAcquired: Math.round(sharesAcquired * 10000) / 10000,
      currentValue: sharesAcquired > 0 ? sharesAcquired * currentPrice : null,
      currentPrice,
      nextDueDate: nextDueDate ? nextDueDate.toISOString() : null,
      anchorDate: plan.anchor_date,
      anchorQuantity: plan.anchor_quantity,
    });
  }
  return summaries;
}

function dayStartOf(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

async function findHistoricalPrice(assetId: string, dueDate: Date): Promise<number | null> {
  const onOrBefore = await query<{ price: number }[]>(
    `SELECT price FROM wealth_price_history WHERE asset_id = ? AND date <= ? ORDER BY date DESC LIMIT 1`,
    [assetId, dueDate.toISOString()]
  );
  if (onOrBefore[0]) return onOrBefore[0].price;

  const earliest = await query<{ price: number }[]>(
    `SELECT price FROM wealth_price_history WHERE asset_id = ? ORDER BY date ASC LIMIT 1`,
    [assetId]
  );
  return earliest[0]?.price ?? null;
}

export interface SavingsPlanExecutionResult {
  planId: string;
  planName: string;
  installmentsCreated: number;
  amountInvested: number;
  usedHistoricalPrice: boolean;
}

// Books due-but-not-yet-executed savings plan installments (called on every
// visit to the savings plans page, same as createSnapshot()). Each installment
// is booked at the real historical price on its due date where available.
export async function executeDueSavingsPlanInstallments(userId: string): Promise<SavingsPlanExecutionResult[]> {
  const plans = await listSavingsPlans(userId);
  const results: SavingsPlanExecutionResult[] = [];
  const now = new Date();

  for (const plan of plans) {
    const intervalMonths = INTERVAL_MONTHS[plan.interval] ?? 1;
    const anchorDate = plan.anchor_date ? dayStartOf(new Date(plan.anchor_date)) : null;
    const start = new Date(plan.start_date);
    const cutoff = plan.end_date && new Date(plan.end_date) < now ? new Date(plan.end_date) : now;
    if (cutoff < start) continue;

    const dueDates: Date[] = [];
    let i = 0;
    while (true) {
      const dueDate = new Date(start);
      dueDate.setMonth(dueDate.getMonth() + i * intervalMonths);
      if (dueDate > cutoff) break;
      if (!anchorDate || dueDate > anchorDate) dueDates.push(dueDate);
      i++;
    }
    if (dueDates.length === 0) continue;

    const existingTx = await query<{ date: string }[]>(`SELECT date FROM wealth_transactions WHERE savings_plan_id = ?`, [plan.id]);
    const existingDays = new Set(existingTx.map((t) => dayStartOf(new Date(t.date)).getTime()));
    const missingDates = dueDates.filter((d) => !existingDays.has(dayStartOf(d).getTime()));
    if (missingDates.length === 0) continue;

    const asset = await getWealthAsset(plan.target_asset_id, userId);
    if (!asset) continue;
    await ensurePriceHistoryCoverage(userId, { id: asset.id, symbol: asset.symbol, typ: asset.typ });

    let installmentsCreated = 0;
    let amountInvested = 0;
    let allHistorical = true;

    for (const dueDate of missingDates) {
      const historicalPrice = await findHistoricalPrice(plan.target_asset_id, dueDate);
      const price = historicalPrice ?? asset.price_per_unit;
      if (historicalPrice === null) allHistorical = false;
      if (price <= 0) continue;

      const quantity = plan.amount / price;
      await addTransaction(
        userId,
        plan.target_asset_id,
        { type: "BUY", quantity, pricePerUnit: price, date: dueDate.toISOString(), notes: `Sparplan: ${plan.name}` },
        { savingsPlanId: plan.id }
      );
      installmentsCreated++;
      amountInvested += plan.amount;
    }

    if (installmentsCreated > 0) {
      results.push({ planId: plan.id, planName: plan.name, installmentsCreated, amountInvested, usedHistoricalPrice: allHistorical });
    }
  }

  return results;
}
