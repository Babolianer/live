import { requireSessionUser } from "@/lib/auth";
import { listSavingsGoals } from "@/lib/wealth-savings-goals";
import { getGoalProgress } from "@/lib/wealth-finance";
import { WealthSavingsGoalRowItem } from "@/components/wealth/wealth-savings-goal-row";
import { NewSavingsGoalCard } from "@/components/wealth/new-savings-goal-card";
import { Card } from "@/components/ui/card";

export default async function WealthSavingsGoalsPage() {
  const user = await requireSessionUser();
  const [goals, progress] = await Promise.all([listSavingsGoals(user.id), getGoalProgress(user.id)]);
  const progressById = new Map(progress.map((p) => [p.goalId, p]));

  return (
    <div className="flex flex-col gap-4">
      {goals.length === 0 && (
        <Card>
          <p className="text-center text-sm text-foreground-muted">Noch keine Sparziele angelegt.</p>
        </Card>
      )}
      {goals.map((goal) => (
        <WealthSavingsGoalRowItem key={goal.id} goal={goal} progress={progressById.get(goal.id)} />
      ))}
      <NewSavingsGoalCard />
    </div>
  );
}
