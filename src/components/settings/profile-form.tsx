"use client";

import { useActionState } from "react";
import { updateProfileAction } from "@/lib/actions/settings-actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { SessionUser } from "@/lib/auth";

const inputClass =
  "w-full rounded-life border border-border bg-surface-muted px-3.5 py-2.5 text-sm outline-none focus:border-accent";
const labelClass = "mb-1.5 block text-sm font-medium";

export function ProfileForm({ user }: { user: SessionUser }) {
  const [state, formAction, pending] = useActionState(updateProfileAction, undefined);

  return (
    <Card>
      <p className="mb-3 font-heading font-semibold">Profil</p>
      <form action={formAction} className="flex flex-col gap-4">
        <div>
          <label className={labelClass} htmlFor="name">
            Name
          </label>
          <input id="name" name="name" required defaultValue={user.name} className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="email">
            E-Mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            defaultValue={user.email}
            className={inputClass}
          />
        </div>
        {state?.error && (
          <p className="rounded-life bg-danger/10 px-3.5 py-2.5 text-sm text-danger">{state.error}</p>
        )}
        {state?.success && (
          <p className="rounded-life bg-success/10 px-3.5 py-2.5 text-sm text-success">
            {state.success}
          </p>
        )}
        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
          {pending ? "Wird gespeichert…" : "Speichern"}
        </Button>
      </form>
    </Card>
  );
}
