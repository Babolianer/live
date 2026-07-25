"use client";

import { useActionState, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { deleteAccountAction } from "@/lib/actions/settings-actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const inputClass =
  "w-full rounded-life border border-border bg-surface-muted px-3.5 py-2.5 text-sm outline-none focus:border-accent";

export function DeleteAccountForm() {
  const [confirming, setConfirming] = useState(false);
  const [state, formAction, pending] = useActionState(deleteAccountAction, undefined);

  return (
    <Card className="border-danger/30">
      <div className="mb-3 flex items-center gap-2 text-danger">
        <AlertTriangle size={18} />
        <p className="font-heading font-semibold">Account löschen</p>
      </div>
      <p className="mb-3 text-sm text-foreground-muted">
        Löscht dein Konto endgültig, inklusive aller Dokumente, Verträge, Ziele, Vermögenswerte und
        Chats. Das kann nicht rückgängig gemacht werden.
      </p>

      {!confirming ? (
        <Button variant="danger" onClick={() => setConfirming(true)}>
          Account löschen
        </Button>
      ) : (
        <form action={formAction} className="flex flex-col gap-3">
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="Passwort zur Bestätigung"
            className={inputClass}
          />
          {state?.error && (
            <p className="rounded-life bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
              {state.error}
            </p>
          )}
          <div className="flex gap-2">
            <Button type="submit" variant="danger" disabled={pending}>
              {pending ? "Wird gelöscht…" : "Endgültig löschen"}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setConfirming(false)}>
              Abbrechen
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}
