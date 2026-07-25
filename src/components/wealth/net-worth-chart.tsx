import type { TimeSeriesPoint } from "@/lib/wealth-types";

export function NetWorthChart({ points }: { points: TimeSeriesPoint[] }) {
  if (points.length < 2) {
    return (
      <p className="py-6 text-center text-sm text-foreground-muted">
        Noch nicht genug Verlaufsdaten — jede Änderung an deinem Vermögen wird ab jetzt aufgezeichnet.
      </p>
    );
  }

  const width = 600;
  const height = 140;
  const padding = 8;
  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const svgPoints = points.map((p, i) => {
    const x = padding + (i / (points.length - 1)) * (width - padding * 2);
    const y = height - padding - ((p.value - min) / range) * (height - padding * 2);
    return { x, y };
  });

  const linePath = svgPoints.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const areaPath = `${linePath} L${svgPoints[svgPoints.length - 1].x},${height} L${svgPoints[0].x},${height} Z`;

  const change = points[points.length - 1].value - points[0].value;

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
