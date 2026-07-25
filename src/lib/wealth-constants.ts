export const WEALTH_CATEGORIES = ["konto", "depot", "krypto", "sachwert", "sonstiges"] as const;
export type WealthCategory = (typeof WEALTH_CATEGORIES)[number];
