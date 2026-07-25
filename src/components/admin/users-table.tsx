"use client";

import { useTransition } from "react";
import { ShieldCheck, Shield } from "lucide-react";
import { setUserRoleAction } from "@/lib/actions/admin-user-actions";
import type { AdminUserRow } from "@/lib/actions/admin-user-actions";
import type { SessionUser } from "@/lib/auth";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function UsersTable({
  users,
  currentUser,
}: {
  users: AdminUserRow[];
  currentUser: SessionUser;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-2">
      {users.map((u) => (
        <div
          key={u.id}
          className="flex items-center justify-between gap-3 rounded-life border border-border bg-surface p-3"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {u.name} {u.id === currentUser.id && <span className="text-foreground-muted">(du)</span>}
            </p>
            <p className="truncate text-xs text-foreground-muted">
              {u.email} · seit {formatDate(u.created_at)}
            </p>
          </div>
          <button
            disabled={isPending || (u.id === currentUser.id && u.role === "admin")}
            onClick={() =>
              startTransition(() =>
                setUserRoleAction(u.id, u.role === "admin" ? "user" : "admin")
              )
            }
            className={`flex shrink-0 items-center gap-1.5 rounded-life px-3 py-1.5 text-xs font-medium disabled:opacity-40 ${
              u.role === "admin"
                ? "bg-accent/15 text-accent"
                : "bg-surface-muted text-foreground-muted"
            }`}
            title={
              u.id === currentUser.id && u.role === "admin"
                ? "Du kannst dir selbst die Admin-Rolle nicht entziehen"
                : undefined
            }
          >
            {u.role === "admin" ? <ShieldCheck size={14} /> : <Shield size={14} />}
            {u.role === "admin" ? "Admin" : "Nutzer"}
          </button>
        </div>
      ))}
    </div>
  );
}
