import { requireSessionUser } from "@/lib/auth";
import { listGoals } from "@/lib/goals";
import { GoalItem } from "@/components/goals/goal-item";
import { NewGoalCard } from "@/components/goals/new-goal-card";

export default async function GoalsPage() {
  const user = await requireSessionUser();
  const goals = await listGoals(user.id);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Ziele & Fortschritt</h1>
        <p className="text-sm text-foreground-muted">
          Verfolge deine Sparziele und feiere, wenn du sie erreichst.
        </p>
      </div>

      <NewGoalCard />

      <div className="flex flex-col gap-3">
        {goals.length === 0 ? (
          <p className="py-8 text-center text-sm text-foreground-muted">
            Noch keine Ziele angelegt.
          </p>
        ) : (
          goals.map((g) => <GoalItem key={g.id} goal={g} />)
        )}
      </div>
    </div>
  );
}
