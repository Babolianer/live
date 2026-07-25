export const GOAL_CATEGORIES = [
  "reise",
  "immobilie",
  "vermoegen",
  "fahrzeug",
  "bildung",
  "sonstiges",
] as const;

export type GoalCategory = (typeof GOAL_CATEGORIES)[number];
