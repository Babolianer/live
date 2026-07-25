"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const TABS = [
  { href: "/wealth", label: "Übersicht" },
  { href: "/wealth/vermoegen", label: "Vermögen" },
  { href: "/wealth/sparplaene", label: "Sparpläne" },
  { href: "/wealth/ziele", label: "Sparziele" },
  { href: "/wealth/ausgaben", label: "Ausgaben" },
  { href: "/wealth/hauskauf", label: "Hauskauf-Rechner" },
];

export function WealthTabs() {
  const pathname = usePathname();

  return (
    <nav className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
      {TABS.map((tab) => {
        const active = tab.href === "/wealth" ? pathname === "/wealth" : pathname?.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={clsx(
              "shrink-0 rounded-life px-3.5 py-2 text-sm font-medium transition-colors",
              active ? "bg-accent text-accent-foreground" : "text-foreground-muted hover:bg-surface-muted"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
