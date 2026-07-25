import { requireSessionUser } from "@/lib/auth";
import { listHealthLogs, getHealthLogByDate } from "@/lib/health";
import { Card } from "@/components/ui/card";
import { HealthTodayCard } from "@/components/health/health-today-card";
import { HealthHistoryRow } from "@/components/health/health-history-row";

export default async function HealthPage() {
  const user = await requireSessionUser();
  const today = new Date().toISOString().slice(0, 10);
  const [todayLog, history] = await Promise.all([
    getHealthLogByDate(user.id, today),
    listHealthLogs(user.id, 14),
  ]);
  const pastLogs = history.filter((h) => h.log_date !== today);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Health & Fitness</h1>
        <p className="text-sm text-foreground-muted">
          Manuelles Tracking — Schritte, Wasser, Schlaf und Workouts.
        </p>
      </div>

      <HealthTodayCard log={todayLog} today={today} />

      <Card>
        <p className="mb-3 font-heading font-semibold">Verlauf</p>
        {pastLogs.length === 0 ? (
          <p className="text-sm text-foreground-muted">Noch keine weiteren Einträge.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {pastLogs.map((log) => (
              <HealthHistoryRow key={log.id} log={log} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
