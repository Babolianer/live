export const ASSET_TYPES = [
  "STOCK",
  "ETF",
  "CRYPTO",
  "CASH",
  "METAL",
  "TAGESGELD",
  "IMMOBILIE",
  "OTHER",
] as const;
export type AssetTyp = (typeof ASSET_TYPES)[number];

export const ASSET_TYPE_LABELS: Record<AssetTyp, string> = {
  STOCK: "Aktie",
  ETF: "ETF",
  CRYPTO: "Krypto",
  CASH: "Cash",
  METAL: "Edelmetall",
  TAGESGELD: "Tagesgeld",
  IMMOBILIE: "Immobilie",
  OTHER: "Sonstiges",
};

// Types priced automatically via the price-refresh route — everything else
// (CASH, TAGESGELD, IMMOBILIE, OTHER) is manually maintained.
export const LIVE_PRICE_ASSET_TYPES: readonly AssetTyp[] = ["STOCK", "ETF", "METAL", "CRYPTO"];

export const GROUP_TYPES = [
  "BANK",
  "BROKER",
  "RETIREMENT",
  "CRYPTO_EXCHANGE",
  "METALS",
  "REAL_ESTATE",
  "SAVINGS",
  "LONGTERM",
  "OTHER",
] as const;
export type GroupTyp = (typeof GROUP_TYPES)[number];

export const GROUP_TYPE_LABELS: Record<GroupTyp, string> = {
  BANK: "Bankkonto",
  BROKER: "Broker",
  RETIREMENT: "Altersvorsorge",
  CRYPTO_EXCHANGE: "Krypto-Exchange",
  METALS: "Edelmetalle",
  REAL_ESTATE: "Immobilien",
  SAVINGS: "Bauspar",
  LONGTERM: "Langzeitinvestment",
  OTHER: "Sonstiges",
};

// Groups whose assets count as "Altersvorsorge" in the dashboard allocation,
// pulled out of their normal asset-type bucket to avoid double counting.
export const LONG_TERM_GROUP_TYPES: readonly GroupTyp[] = ["LONGTERM", "RETIREMENT"];

export const SAVINGS_PLAN_INTERVALS = ["MONTHLY", "QUARTERLY", "YEARLY"] as const;
export type SavingsPlanInterval = (typeof SAVINGS_PLAN_INTERVALS)[number];

export const SAVINGS_PLAN_INTERVAL_LABELS: Record<SavingsPlanInterval, string> = {
  MONTHLY: "Monatlich",
  QUARTERLY: "Vierteljährlich",
  YEARLY: "Jährlich",
};

export const EXPENSE_CATEGORIES = [
  "Einkommen",
  "Versicherungen",
  "Wohnen",
  "Sonstiges",
  "Freizeit",
  "Lifestyle",
  "Finanzen",
  "Mobilität",
  "Sparen",
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
