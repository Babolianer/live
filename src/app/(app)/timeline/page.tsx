import Link from "next/link";
import {
  FileText,
  ShieldCheck,
  Target,
  PartyPopper,
  Wallet,
  Car,
  Building2,
  HeartPulse,
} from "lucide-react";
import { requireSessionUser } from "@/lib/auth";
import { buildTimeline, type TimelineEvent } from "@/lib/timeline";
import { Card } from "@/components/ui/card";

const ICONS: Record<TimelineEvent["type"], typeof FileText> = {
  document: FileText,
  contract: ShieldCheck,
  goal_created: Target,
  goal_achieved: PartyPopper,
  wealth: Wallet,
  vehicle: Car,
  property: Building2,
  health: HeartPulse,
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function TimelinePage() {
  const user = await requireSessionUser();
  const events = await buildTimeline(user.id);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Timeline</h1>
        <p className="text-sm text-foreground-muted">
          Deine echte Aktivitäts-Historie — alles, was du in LIFE angelegt hast.
        </p>
      </div>

      {events.length === 0 ? (
        <p className="py-8 text-center text-sm text-foreground-muted">
          Noch keine Aktivität — leg dein erstes Dokument, Ziel oder Vertrag an.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {events.map((e) => {
            const Icon = ICONS[e.type];
            return (
              <Link key={e.id} href={e.href}>
                <Card className="flex items-center gap-3 hover:border-accent/50">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{e.label}</p>
                    {e.detail && (
                      <p className="truncate text-sm text-foreground-muted">{e.detail}</p>
                    )}
                  </div>
                  <span className="shrink-0 text-xs text-foreground-muted">
                    {formatDateTime(e.at)}
                  </span>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
