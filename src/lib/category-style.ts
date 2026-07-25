export const CATEGORY_LABELS: Record<string, string> = {
  versicherung: "Versicherung",
  miete: "Miete",
  streaming: "Streaming",
  mobilfunk: "Mobilfunk",
  fitness: "Fitness",
  sonstiges: "Sonstiges",
  reise: "Reise",
  immobilie: "Immobilie",
  vermoegen: "Vermögen",
  fahrzeug: "Fahrzeug",
  bildung: "Bildung",
};

export const CATEGORY_COLORS: Record<string, string> = {
  versicherung: "bg-accent/15 text-accent",
  miete: "bg-warning/15 text-warning",
  streaming: "bg-foreground-muted/15 text-foreground-muted",
  mobilfunk: "bg-success/15 text-success",
  fitness: "bg-danger/15 text-danger",
  sonstiges: "bg-surface-muted text-foreground-muted",
  reise: "bg-accent/15 text-accent",
  immobilie: "bg-warning/15 text-warning",
  vermoegen: "bg-success/15 text-success",
  fahrzeug: "bg-danger/15 text-danger",
  bildung: "bg-foreground-muted/15 text-foreground-muted",
};

export function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}

export function categoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? CATEGORY_COLORS.sonstiges;
}
