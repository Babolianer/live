import { getContract, updateContract, deleteContractRow } from "@/lib/contracts";
import { getGoal, updateGoal, deleteGoalRow } from "@/lib/goals";
import { getWealthAsset, updateWealthAsset, deleteWealthAsset } from "@/lib/wealth-assets";
import { getVehicle, updateVehicle, deleteVehicle } from "@/lib/vehicles";
import { getProperty, updateProperty, deleteProperty } from "@/lib/properties";
import { getHealthLog, upsertHealthLog, deleteHealthLog } from "@/lib/health";

export type EntityType = "contract" | "goal" | "wealth_asset" | "vehicle" | "property" | "health_log";

export const ENTITY_TYPES: EntityType[] = [
  "contract",
  "goal",
  "wealth_asset",
  "vehicle",
  "property",
  "health_log",
];

type Row = Record<string, unknown>;
type Input = Record<string, unknown>;

type Handler = {
  get: (id: string, userId: string) => Promise<Row | null>;
  toInput: (row: Row) => Input;
  update: (id: string, userId: string, input: Input) => Promise<void>;
  del: (id: string, userId: string) => Promise<void>;
  label: (row: Row) => string;
  revalidate: string[];
};

export const ENTITY_HANDLERS: Record<EntityType, Handler> = {
  contract: {
    get: getContract,
    toInput: (row) => ({
      name: row.name,
      category: row.category,
      amount: row.amount,
      billingCycle: row.billing_cycle,
      contractEnd: row.contract_end,
      cancellationDeadline: row.cancellation_deadline,
      documentId: row.document_id,
      notes: row.notes,
    }),
    update: (id, userId, input) =>
      updateContract(id, userId, input as Parameters<typeof updateContract>[2]),
    del: deleteContractRow,
    label: (row) => String(row.name),
    revalidate: ["/contracts", "/home"],
  },
  goal: {
    get: getGoal,
    toInput: (row) => ({
      name: row.name,
      category: row.category,
      targetAmount: row.target_amount,
      currentAmount: row.current_amount,
      targetDate: row.target_date,
      notes: row.notes,
    }),
    update: (id, userId, input) => updateGoal(id, userId, input as Parameters<typeof updateGoal>[2]),
    del: deleteGoalRow,
    label: (row) => String(row.name),
    revalidate: ["/goals", "/home"],
  },
  wealth_asset: {
    get: getWealthAsset,
    // Simplified shape for AI-driven quick capture (matches propose_wealth_asset's
    // schema) — value stands in for quantity*price on quantity-1 manual assets.
    // Detailed multi-transaction assets are managed on the Vermögen pages, not via chat.
    toInput: (row) => ({
      name: row.name,
      typ: row.typ,
      value: Number(row.quantity) * Number(row.price_per_unit),
      notes: row.notes,
    }),
    update: async (id, userId, input) => {
      const existing = await getWealthAsset(id, userId);
      if (!existing) return;
      const changes = input as { name: string; typ: typeof existing.typ; value: number; notes: string | null };
      await updateWealthAsset(id, userId, {
        groupId: existing.group_id,
        sectorId: existing.sector_id,
        name: changes.name,
        typ: changes.typ,
        quantity: existing.quantity,
        pricePerUnit: changes.value,
        currency: existing.currency,
        isin: existing.isin,
        symbol: existing.symbol,
        notes: changes.notes,
      });
    },
    del: deleteWealthAsset,
    label: (row) => String(row.name),
    revalidate: ["/wealth", "/wealth/vermoegen", "/home"],
  },
  vehicle: {
    get: getVehicle,
    toInput: (row) => ({
      name: row.name,
      licensePlate: row.license_plate,
      purchaseDate: row.purchase_date,
      value: row.value,
      inspectionDue: row.inspection_due,
      documentId: row.document_id,
      notes: row.notes,
    }),
    update: (id, userId, input) =>
      updateVehicle(id, userId, input as Parameters<typeof updateVehicle>[2]),
    del: deleteVehicle,
    label: (row) => String(row.name),
    revalidate: ["/garage", "/home"],
  },
  property: {
    get: getProperty,
    toInput: (row) => ({
      name: row.name,
      address: row.address,
      purchaseDate: row.purchase_date,
      value: row.value,
      documentId: row.document_id,
      notes: row.notes,
    }),
    update: (id, userId, input) =>
      updateProperty(id, userId, input as Parameters<typeof updateProperty>[2]),
    del: deleteProperty,
    label: (row) => String(row.name),
    revalidate: ["/properties", "/home"],
  },
  health_log: {
    get: getHealthLog,
    toInput: (row) => ({
      logDate: row.log_date,
      steps: row.steps,
      waterLiters: row.water_liters,
      sleepHours: row.sleep_hours,
      workout: row.workout,
      notes: row.notes,
    }),
    update: (_id, userId, input) =>
      upsertHealthLog(userId, input as Parameters<typeof upsertHealthLog>[1]),
    del: deleteHealthLog,
    label: (row) => `Eintrag vom ${row.log_date}`,
    revalidate: ["/health", "/home"],
  },
};
