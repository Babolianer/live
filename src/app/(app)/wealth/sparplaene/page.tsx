import { requireSessionUser } from "@/lib/auth";
import { listWealthAssets } from "@/lib/wealth-assets";
import { listSavingsPlans, getSavingsPlanSummaries, executeDueSavingsPlanInstallments } from "@/lib/wealth-savings-plans";
import { WealthSavingsPlanRowItem } from "@/components/wealth/wealth-savings-plan-row";
import { NewSavingsPlanCard } from "@/components/wealth/new-savings-plan-card";
import { Card } from "@/components/ui/card";

export default async function WealthSavingsPlansPage() {
  const user = await requireSessionUser();

  await executeDueSavingsPlanInstallments(user.id);

  const [plans, summaries, assets] = await Promise.all([
    listSavingsPlans(user.id),
    getSavingsPlanSummaries(user.id),
    listWealthAssets(user.id),
  ]);
  const summaryById = new Map(summaries.map((s) => [s.id, s]));

  return (
    <div className="flex flex-col gap-4">
      {plans.length === 0 && (
        <Card>
          <p className="text-center text-sm text-foreground-muted">Noch keine Sparpläne angelegt.</p>
        </Card>
      )}
      {plans.map((plan) => {
        const summary = summaryById.get(plan.id);
        if (!summary) return null;
        return <WealthSavingsPlanRowItem key={plan.id} plan={plan} summary={summary} assets={assets} />;
      })}
      <NewSavingsPlanCard assets={assets} />
    </div>
  );
}
