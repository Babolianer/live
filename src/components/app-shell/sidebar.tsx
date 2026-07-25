"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { Sparkles, Lock } from "lucide-react";
import { sidebarNav, comingSoonNav } from "@/lib/nav";
import { iconMap } from "@/components/icon-map";
import { LogoutButton } from "@/components/app-shell/logout-button";
import type { SessionUser } from "@/lib/auth";

export function Sidebar({ user }: { user: SessionUser }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface p-4 md:flex">
      <div className="mb-6 flex items-center gap-2 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/15 text-accent">
          <Sparkles size={18} />
        </div>
        <div>
          <p className="font-heading text-lg font-semibold leading-none">LIFE</p>
          <p className="text-xs text-foreground-muted">AI OS for your life</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
        {(user.role === "admin"
          ? [...sidebarNav, { href: "/admin", label: "Admin", icon: "cog" }]
          : sidebarNav
        ).map((item) => {
          const Icon = iconMap[item.icon];
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 rounded-life px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-accent text-accent-foreground"
                  : "text-foreground-muted hover:bg-surface-muted hover:text-foreground"
              )}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}

        <p className="mt-5 mb-1 px-3 text-xs font-medium uppercase tracking-wide text-foreground-muted/70">
          Demnächst
        </p>
        {comingSoonNav.map((item) => {
          const Icon = iconMap[item.icon];
          return (
            <div
              key={item.href}
              className="flex items-center gap-3 rounded-life px-3 py-2.5 text-sm font-medium text-foreground-muted/50"
              title="Kommt bald"
            >
              <Icon size={18} />
              <span className="flex-1">{item.label}</span>
              <Lock size={14} />
            </div>
          );
        })}
      </nav>

      <div className="mt-4 rounded-life bg-surface-muted p-3">
        <p className="truncate text-sm font-medium">{user.name}</p>
        <p className="truncate text-xs text-foreground-muted">{user.email}</p>
        <LogoutButton className="mt-3 w-full" />
      </div>
    </aside>
  );
}
