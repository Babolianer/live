"use client";

import { useActionState, useRef } from "react";
import { changePasswordAction } from "@/lib/actions/settings-actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const inputClass =
  "w-full rounded-life border border-border bg-surface-muted px-3.5 py-2.5 text-sm outline-none focus:border-accent";
const labelClass = "mb-1.5 block text-sm font-medium";

export function PasswordForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(async (prevState: Awaited<ReturnType<typeof changePasswordAction>>, formData: FormData) => {
    const result = await changePasswordAction(prevState, formData);
    if (result?.success) formRef.current?.reset();
    return result;
  }, undefined);

  return (
    <Card>
      <p className="mb-3 font-heading font-semibold">Passwort ändern</p>
      <form ref={formRef} action={formAction} className="flex flex-col gap-4">
        <div>
          <label className={labelClass} htmlFor="currentPassword">
            Aktuelles Passwort
          </label>
          <input
            id="currentPassword"
            name="currentPassword"
            type="password"
            required
            autoComplete="current-password"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="newPassword">
            Neues Passwort
          </label>
          <input
            id="newPassword"
            name="newPassword"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="confirmPassword">
            Neues Passwort bestätigen
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
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
          {pending ? "Wird geändert…" : "Passwort ändern"}
        </Button>
      </form>
    </Card>
  );
}
