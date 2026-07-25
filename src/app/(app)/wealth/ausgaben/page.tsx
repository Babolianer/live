import { requireSessionUser } from "@/lib/auth";
import { listExpenses, getMonthlySummary } from "@/lib/wealth-expenses";
import { WealthExpenseRowItem } from "@/components/wealth/wealth-expense-row";
import { NewExpenseCard } from "@/components/wealth/new-expense-card";
import { Card } from "@/components/ui/card";

export default async function WealthExpensesPage() {
  const user = await requireSessionUser();
  const now = new Date();
  const [expenses, summary] = await Promise.all([
    listExpenses(user.id, { year: now.getFullYear(), month: now.getMonth() + 1 }),
    getMonthlySummary(user.id, now.getFullYear(), now.getMonth() + 1),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <p className="mb-3 font-heading font-semibold">{now.toLocaleDateString("de-DE", { month: "long", year: "numeric" })}</p>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-xs text-foreground-muted">Einnahmen</p>
            <p className="font-semibold text-success">€ {summary.income.toLocaleString("de-DE", { maximumFractionDigits: 0 })}</p>
          </div>
          <div>
            <p className="text-xs text-foreground-muted">Ausgaben</p>
            <p className="font-semibold">€ {summary.outflow.toLocaleString("de-DE", { maximumFractionDigits: 0 })}</p>
          </div>
          <div>
            <p className="text-xs text-foreground-muted">Saldo</p>
            <p className={`font-semibold ${summary.balance >= 0 ? "text-success" : "text-danger"}`}>
              € {summary.balance.toLocaleString("de-DE", { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>
      </Card>

      <NewExpenseCard />

      <Card>
        <p className="mb-1 font-heading font-semibold">Buchungen diesen Monat</p>
        {expenses.length === 0 ? (
          <p className="py-4 text-center text-sm text-foreground-muted">Noch keine Buchungen in diesem Monat.</p>
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {expenses.map((e) => (
              <WealthExpenseRowItem key={e.id} expense={e} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
