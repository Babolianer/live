import { Card } from "@/components/ui/card";
import type { LifeScore } from "@/lib/life-score";

function scoreLabel(score: number): string {
  if (score >= 80) return "Sehr gut";
  if (score >= 60) return "Gut";
  if (score >= 40) return "Ausbaufähig";
  return "Starte durch";
}

export function LifeScoreCard({ lifeScore }: { lifeScore: LifeScore }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const dash = (lifeScore.score / 100) * circumference;

  return (
    <Card>
      <div className="flex items-center gap-4">
        <svg viewBox="0 0 100 100" className="h-20 w-20 shrink-0 -rotate-90">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--surface-muted)" strokeWidth="9" />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference - dash}`}
          />
          <text
            x="50"
            y="50"
            textAnchor="middle"
            dominantBaseline="central"
            transform="rotate(90 50 50)"
            className="fill-foreground font-heading text-[26px] font-semibold"
          >
            {lifeScore.score}
          </text>
        </svg>
        <div className="flex-1">
          <p className="font-heading font-semibold">LIFE Score: {scoreLabel(lifeScore.score)}</p>
          <div className="mt-1.5 flex flex-col gap-1">
            {lifeScore.breakdown.map((b) => (
              <div key={b.label} className="flex items-center justify-between text-xs text-foreground-muted">
                <span>{b.label}</span>
                <span>
                  {b.points}/{b.max}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
