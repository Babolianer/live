"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Check, X, Sparkles, Plug } from "lucide-react";
import { Card } from "@/components/ui/card";
import { dismissOnboardingAction } from "@/lib/actions/onboarding-actions";

type Step = {
  label: string;
  done: boolean;
  href: string;
  cta: string;
};

export function OnboardingChecklist({
  steps,
  isAdmin,
  partnerToolCount,
}: {
  steps: Step[];
  isAdmin: boolean;
  partnerToolCount: number;
}) {
  const [isPending, startTransition] = useTransition();
  const doneCount = steps.filter((s) => s.done).length;
  const allDone = doneCount === steps.length;

  return (
    <Card>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="font-heading font-semibold">Erste Schritte in LIFE</p>
          <p className="text-sm text-foreground-muted">
            {doneCount}/{steps.length} erledigt — bau dir dein LIFE mit echten Daten auf.
          </p>
        </div>
        <button
          aria-label="Ausblenden"
          disabled={isPending}
          onClick={() => startTransition(() => dismissOnboardingAction())}
          className="rounded-md p-1.5 text-foreground-muted hover:bg-surface-muted"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {steps.map((step) => (
          <div
            key={step.label}
            className="flex items-center justify-between gap-3 rounded-life bg-surface-muted px-3.5 py-2.5"
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                  step.done ? "bg-success text-white" : "border border-border"
                }`}
              >
                {step.done && <Check size={12} />}
              </div>
              <span className={`text-sm ${step.done ? "text-foreground-muted line-through" : "font-medium"}`}>
                {step.label}
              </span>
            </div>
            {!step.done && (
              <Link href={step.href} className="shrink-0 text-sm font-medium text-accent">
                {step.cta}
              </Link>
            )}
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 rounded-life bg-surface-muted px-3.5 py-2.5">
        <div className="flex items-center gap-2.5">
          <Plug size={16} className="text-foreground-muted" />
          <div>
            <p className="text-sm font-medium">Tools & Vergleichs-Angebote</p>
            <p className="text-xs text-foreground-muted">
              {partnerToolCount > 0
                ? `${partnerToolCount} Vergleichs-Tool${partnerToolCount === 1 ? "" : "s"} aktiv — erscheint automatisch bei passenden Verträgen.`
                : "Noch keine Vergleichs-Tools hinterlegt."}{" "}
              Bank-, E-Mail- und WhatsApp-Anbindung sind in Vorbereitung und brauchen noch echte Partner-Zugänge.
            </p>
          </div>
        </div>
        {isAdmin && (
          <Link href="/admin" className="shrink-0 text-sm font-medium text-accent">
            Verwalten
          </Link>
        )}
      </div>

      {allDone && (
        <div className="mt-3 flex items-center gap-2 rounded-life bg-success/10 px-3.5 py-2.5 text-sm text-success">
          <Sparkles size={16} />
          Alles startklar — LIFE lernt jetzt mit jeder neuen Angabe mehr über dich.
        </div>
      )}
    </Card>
  );
}
