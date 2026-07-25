import { categoryLabel } from "@/lib/category-style";

const CATEGORY_HEX: Record<string, string> = {
  konto: "#8b7cf6",
  depot: "#22c55e",
  krypto: "#f59e0b",
  sachwert: "#38bdf8",
  sonstiges: "#9797a6",
};

export function WealthDonut({
  totals,
}: {
  totals: { category: string; value: number }[];
}) {
  const total = totals.reduce((sum, t) => sum + t.value, 0);
  const positive = totals.filter((t) => t.value > 0);

  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  let cumulative = 0;

  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 180 180" className="h-40 w-40 shrink-0 -rotate-90">
        <circle cx="90" cy="90" r={radius} fill="none" stroke="var(--surface-muted)" strokeWidth="20" />
        {total > 0 &&
          positive.map((t) => {
            const fraction = t.value / total;
            const dash = fraction * circumference;
            const offset = cumulative;
            cumulative += dash;
            return (
              <circle
                key={t.category}
                cx="90"
                cy="90"
                r={radius}
                fill="none"
                stroke={CATEGORY_HEX[t.category] ?? CATEGORY_HEX.sonstiges}
                strokeWidth="20"
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
              />
            );
          })}
      </svg>
      <div className="flex flex-1 flex-col gap-2">
        {positive.length === 0 && (
          <p className="text-sm text-foreground-muted">Noch keine Vermögenswerte erfasst.</p>
        )}
        {positive.map((t) => (
          <div key={t.category} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: CATEGORY_HEX[t.category] ?? CATEGORY_HEX.sonstiges }}
              />
              {categoryLabel(t.category)}
            </span>
            <span className="text-foreground-muted">
              {total > 0 ? Math.round((t.value / total) * 100) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
