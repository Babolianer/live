import type { WealthSnapshotRow } from "@/lib/wealth";

export function WealthHistoryChart({ snapshots }: { snapshots: WealthSnapshotRow[] }) {
  if (snapshots.length < 2) {
    return (
      <p className="py-6 text-center text-sm text-foreground-muted">
        Noch nicht genug Verlaufsdaten — jede Änderung an deinem Vermögen wird ab jetzt
        aufgezeichnet.
      </p>
    );
  }

  const width = 600;
  const height = 140;
  const padding = 8;
  const values = snapshots.map((s) => s.total_value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = snapshots.map((s, i) => {
    const x = padding + (i / (snapshots.length - 1)) * (width - padding * 2);
    const y = height - padding - ((s.total_value - min) / range) * (height - padding * 2);
    return { x, y };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const areaPath = `${linePath} L${points[points.length - 1].x},${height} L${points[0].x},${height} Z`;

  const first = snapshots[0].total_value;
  const last = snapshots[snapshots.length - 1].total_value;
  const change = last - first;

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="none">
        <path d={areaPath} fill="var(--accent)" opacity="0.12" />
        <path d={linePath} fill="none" stroke="var(--accent)" strokeWidth="2.5" />
      </svg>
      <p className="mt-1 text-xs text-foreground-muted">
        {change >= 0 ? "+" : ""}
        {change.toLocaleString("de-DE", { maximumFractionDigits: 0 })} € seit erstem Eintrag
      </p>
    </div>
  );
}
