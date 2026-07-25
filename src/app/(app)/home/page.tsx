import Link from "next/link";
import {
  Sparkles,
  FileText,
  ShieldCheck,
  Upload,
  Target,
  TrendingUp,
  HeartPulse,
} from "lucide-react";
import { requireSessionUser } from "@/lib/auth";
import { countDocuments } from "@/lib/documents";
import { listDueSoon, countContracts } from "@/lib/contracts";
import { listGoals } from "@/lib/goals";
import { categoryLabel, categoryColor } from "@/lib/category-style";
import { Card } from "@/components/ui/card";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 11) return "Guten Morgen";
  if (hour < 18) return "Guten Tag";
  return "Guten Abend";
}

export default async function HomePage() {
  const user = await requireSessionUser();
  const [documentCount, contractCount, dueSoon, goals] = await Promise.all([
    countDocuments(user.id),
    countContracts(user.id),
    listDueSoon(user.id, 30),
    listGoals(user.id),
  ]);
  const openGoals = goals.filter((g) => !g.achieved_at).slice(0, 3);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">
          {greeting()}, {user.name.split(" ")[0]}! 👋
        </h1>
        <p className="text-sm text-foreground-muted">
          Hier ist dein Überblick über Dokumente, Verträge und Ziele.
        </p>
      </div>

      <Link href="/ai">
        <Card className="flex items-center gap-4 bg-accent text-accent-foreground hover:opacity-90">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15">
            <Sparkles size={22} />
          </div>
          <div>
            <p className="font-heading font-semibold">Ask LIFE</p>
            <p className="text-sm opacity-90">
              Stell eine Frage zu deinen Dokumenten oder Verträgen.
            </p>
          </div>
        </Card>
      </Link>

      <div className="grid grid-cols-3 gap-4">
        <Link href="/documents">
          <Card className="h-full hover:border-accent/50">
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-accent/15 text-accent">
              <FileText size={18} />
            </div>
            <p className="text-2xl font-semibold">{documentCount}</p>
            <p className="text-sm text-foreground-muted">Dokumente</p>
          </Card>
        </Link>
        <Link href="/contracts">
          <Card className="h-full hover:border-accent/50">
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-accent/15 text-accent">
              <ShieldCheck size={18} />
            </div>
            <p className="text-2xl font-semibold">{contractCount}</p>
            <p className="text-sm text-foreground-muted">Verträge</p>
          </Card>
        </Link>
        <Link href="/goals">
          <Card className="h-full hover:border-accent/50">
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-accent/15 text-accent">
              <Target size={18} />
            </div>
            <p className="text-2xl font-semibold">{goals.length}</p>
            <p className="text-sm text-foreground-muted">Ziele</p>
          </Card>
        </Link>
      </div>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <p className="font-heading font-semibold">Bald fällig</p>
          <Link href="/contracts" className="text-sm text-accent">
            Alle ansehen
          </Link>
        </div>
        {dueSoon.length === 0 ? (
          <p className="text-sm text-foreground-muted">
            Keine Kündigungsfristen in den nächsten 30 Tagen.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {dueSoon.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${categoryColor(c.category)}`}
                  >
                    {categoryLabel(c.category)}
                  </span>
                  <span className="font-medium">{c.name}</span>
                </div>
                <span className="text-foreground-muted">
                  {new Date(c.cancellation_deadline!).toLocaleDateString("de-DE")}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <p className="font-heading font-semibold">Deine Ziele</p>
          <Link href="/goals" className="text-sm text-accent">
            Alle ansehen
          </Link>
        </div>
        {openGoals.length === 0 ? (
          <p className="text-sm text-foreground-muted">
            Noch keine Ziele angelegt.{" "}
            <Link href="/goals" className="text-accent">
              Jetzt anlegen
            </Link>
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {openGoals.map((g) => {
              const percent = Math.min(
                100,
                Math.round((g.current_amount / g.target_amount) * 100)
              );
              return (
                <div key={g.id}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium">{g.name}</span>
                    <span className="text-foreground-muted">
                      € {g.current_amount.toLocaleString("de-DE")} / €{" "}
                      {g.target_amount.toLocaleString("de-DE")} · {percent}%
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <div>
        <p className="mb-2 font-heading font-semibold">Schnellaktionen</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Link href="/documents">
            <Card className="flex flex-col items-center gap-2 py-4 text-center hover:border-accent/50">
              <Upload size={18} className="text-accent" />
              <span className="text-xs font-medium">Dokument hochladen</span>
            </Card>
          </Link>
          <Link href="/contracts">
            <Card className="flex flex-col items-center gap-2 py-4 text-center hover:border-accent/50">
              <ShieldCheck size={18} className="text-accent" />
              <span className="text-xs font-medium">Vertrag hinzufügen</span>
            </Card>
          </Link>
          <Link href="/goals">
            <Card className="flex flex-col items-center gap-2 py-4 text-center hover:border-accent/50">
              <Target size={18} className="text-accent" />
              <span className="text-xs font-medium">Ziel hinzufügen</span>
            </Card>
          </Link>
          <Link href="/ai">
            <Card className="flex flex-col items-center gap-2 py-4 text-center hover:border-accent/50">
              <Sparkles size={18} className="text-accent" />
              <span className="text-xs font-medium">KI fragen</span>
            </Card>
          </Link>
        </div>
      </div>

      <div>
        <p className="mb-2 font-heading font-semibold">Demnächst in LIFE</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Card className="flex flex-col items-center gap-2 py-5 text-center opacity-60">
            <TrendingUp size={20} />
            <span className="text-xs font-medium">Vermögensübersicht</span>
          </Card>
          <Card className="flex flex-col items-center gap-2 py-5 text-center opacity-60">
            <HeartPulse size={20} />
            <span className="text-xs font-medium">Health & Fitness</span>
          </Card>
        </div>
      </div>
    </div>
  );
}
