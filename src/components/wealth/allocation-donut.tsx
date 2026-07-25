import type { AssetAllocation } from "@/lib/wealth-types";

const SLICE_HEX: Record<string, string> = {
  STOCK: "#22c55e",
  ETF: "#8b7cf6",
  CRYPTO: "#f59e0b",
  CASH: "#38bdf8",
  METAL: "#eab308",
  TAGESGELD: "#14b8a6",
  IMMOBILIE: "#ef4444",
  ALTERSVORSORGE: "#6366f1",
  OTHER: "#9797a6",
};

export function AllocationDonut({ allocation }: { allocation: AssetAllocation }) {
  const total = allocation.reduce((sum, s) => sum + s.value, 0);
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  let cumulative = 0;

  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 180 180" className="h-40 w-40 shrink-0 -rotate-90">
        <circle cx="90" cy="90" r={radius} fill="none" stroke="var(--surface-muted)" strokeWidth="20" />
        {total > 0 &&
          allocation.map((slice) => {
            const fraction = slice.value / total;
            const dash = fraction * circumference;
            const offset = cumulative;
            cumulative += dash;
            return (
              <circle
                key={slice.assetTyp}
                cx="90"
                cy="90"
                r={radius}
                fill="none"
                stroke={SLICE_HEX[slice.assetTyp] ?? SLICE_HEX.OTHER}
                strokeWidth="20"
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
              />
            );
          })}
      </svg>
      <div className="flex flex-1 flex-col gap-2">
        {allocation.length === 0 && <p className="text-sm text-foreground-muted">Noch keine Vermögenswerte erfasst.</p>}
        {allocation.map((slice) => (
          <div key={slice.assetTyp} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: SLICE_HEX[slice.assetTyp] ?? SLICE_HEX.OTHER }} />
              {slice.label}
            </span>
            <span className="text-foreground-muted">{slice.percent}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
