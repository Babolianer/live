import Link from "next/link";
import {
  Sparkles,
  FileText,
  ShieldCheck,
  Upload,
  Target,
  Wallet,
  Car,
  Building2,
  HeartPulse,
  Clock,
} from "lucide-react";
import { requireSessionUser } from "@/lib/auth";
import { countDocuments } from "@/lib/documents";
import { listDueSoon, countContracts } from "@/lib/contracts";
import { listGoals } from "@/lib/goals";
import { countUserMessages } from "@/lib/ai-messages";
import { listPartnerTools } from "@/lib/partner-tools";
import { getTotalWealth } from "@/lib/wealth";
import { countVehicles } from "@/lib/vehicles";
import { countProperties } from "@/lib/properties";
import { getHealthLogByDate } from "@/lib/health";
import { computeLifeScore } from "@/lib/life-score";
import { buildTimeline } from "@/lib/timeline";
import { categoryLabel, categoryColor } from "@/lib/category-style";
import { Card } from "@/components/ui/card";
import { OnboardingChecklist } from "@/components/onboarding/onboarding-checklist";
import { HomeChatStarter } from "@/components/home/home-chat-starter";
import { LifeScoreCard } from "@/components/home/life-score-card";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 11) return "Guten Morgen";
  if (hour < 18) return "Guten Tag";
  return "Guten Abend";
}

export default async function HomePage() {
  const user = await requireSessionUser();
  const today = new Date().toISOString().slice(0, 10);
  const [
    documentCount,
    contractCount,
    dueSoon,
    goals,
    aiMessageCount,
    partnerTools,
    totalWealth,
    vehicleCount,
    propertyCount,
    todayHealth,
    lifeScore,
    timeline,
  ] = await Promise.all([
    countDocuments(user.id),
    countContracts(user.id),
    listDueSoon(user.id, 30),
    listGoals(user.id),
    countUserMessages(user.id),
    listPartnerTools(),
    getTotalWealth(user.id),
    countVehicles(user.id),
    countProperties(user.id),
    getHealthLogByDate(user.id, today),
    computeLifeScore(user.id),
    buildTimeline(user.id, 3),
  ]);
  const openGoals = goals.filter((g) => !g.achieved_at).slice(0, 3);

  const onboardingSteps = [
    {
      label: "Erstes Dokument hochladen",
      done: documentCount > 0,
      href: "/documents",
      cta: "Hochladen",
    },
    {
      label: "Ersten Vertrag anlegen",
      done: contractCount > 0,
      href: "/contracts",
      cta: "Anlegen",
    },
    { label: "Erstes Ziel setzen", done: goals.length > 0, href: "/goals", cta: "Setzen" },
    { label: "Ask LIFE etwas fragen", done: aiMessageCount > 0, href: "/ai", cta: "Fragen" },
  ];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">
          {greeting()}, {user.name.split(" ")[0]}! 👋
        </h1>
        <p className="text-sm text-foreground-muted">
          Hier ist dein Überblick über dein digitales Leben.
        </p>
      </div>

      <HomeChatStarter />

      {!user.onboardingDismissed && (
        <OnboardingChecklist
          steps={onboardingSteps}
          isAdmin={user.role === "admin"}
          partnerToolCount={partnerTools.filter((t) => t.enabled === 1).length}
        />
      )}

      <LifeScoreCard lifeScore={lifeScore} />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Link href="/wealth">
          <Card className="h-full hover:border-accent/50">
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-accent/15 text-accent">
              <Wallet size={18} />
            </div>
            <p className="text-2xl font-semibold">
              € {totalWealth.toLocaleString("de-DE", { maximumFractionDigits: 0 })}
            </p>
            <p className="text-sm text-foreground-muted">Vermögen</p>
          </Card>
        </Link>
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

      <div className="grid grid-cols-3 gap-4">
        <Link href="/garage">
          <Card className="h-full hover:border-accent/50">
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-accent/15 text-accent">
              <Car size={18} />
            </div>
            <p className="text-2xl font-semibold">{vehicleCount}</p>
            <p className="text-sm text-foreground-muted">Fahrzeuge</p>
          </Card>
        </Link>
        <Link href="/properties">
          <Card className="h-full hover:border-accent/50">
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-accent/15 text-accent">
              <Building2 size={18} />
            </div>
            <p className="text-2xl font-semibold">{propertyCount}</p>
            <p className="text-sm text-foreground-muted">Immobilien</p>
          </Card>
        </Link>
        <Link href="/health">
          <Card className="h-full hover:border-accent/50">
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-accent/15 text-accent">
              <HeartPulse size={18} />
            </div>
            <p className="text-2xl font-semibold">{todayHealth?.steps ?? "–"}</p>
            <p className="text-sm text-foreground-muted">Schritte heute</p>
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

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <p className="font-heading font-semibold">Letzte Aktivität</p>
          <Link href="/timeline" className="flex items-center gap-1 text-sm text-accent">
            <Clock size={14} /> Timeline ansehen
          </Link>
        </div>
        {timeline.length === 0 ? (
          <p className="text-sm text-foreground-muted">Noch keine Aktivität.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {timeline.map((e) => (
              <div key={e.id} className="flex items-center justify-between text-sm">
                <span className="font-medium">{e.label}</span>
                <span className="truncate pl-2 text-foreground-muted">{e.detail}</span>
              </div>
            ))}
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
    </div>
  );
}
