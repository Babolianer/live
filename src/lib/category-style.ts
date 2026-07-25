export const CATEGORY_LABELS: Record<string, string> = {
  versicherung: "Versicherung",
  miete: "Miete",
  streaming: "Streaming",
  mobilfunk: "Mobilfunk",
  fitness: "Fitness",
  sonstiges: "Sonstiges",
};

export const CATEGORY_COLORS: Record<string, string> = {
  versicherung: "bg-accent/15 text-accent",
  miete: "bg-warning/15 text-warning",
  streaming: "bg-foreground-muted/15 text-foreground-muted",
  mobilfunk: "bg-success/15 text-success",
  fitness: "bg-danger/15 text-danger",
  sonstiges: "bg-surface-muted text-foreground-muted",
};

export function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}

export function categoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? CATEGORY_COLORS.sonstiges;
}
