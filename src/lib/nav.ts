export type NavItem = {
  href: string;
  label: string;
  icon: string;
  comingSoon?: boolean;
};

// Only Home, AI, Documents, Contracts are wired up (MVP scope).
// Everything else from the LIFE concept is listed as "coming soon" so the
// nav communicates the full product shape without shipping empty pages.
export const primaryNav: NavItem[] = [
  { href: "/home", label: "Home", icon: "home" },
  { href: "/ai", label: "KI", icon: "sparkles" },
  { href: "/documents", label: "Dokumente", icon: "file" },
  { href: "/contracts", label: "Verträge", icon: "shield" },
];

export const comingSoonNav: NavItem[] = [
  { href: "/wealth", label: "Vermögen", icon: "trending-up", comingSoon: true },
  { href: "/health", label: "Health & Fitness", icon: "heart", comingSoon: true },
  { href: "/goals", label: "Ziele", icon: "target", comingSoon: true },
  { href: "/timeline", label: "Timeline", icon: "clock", comingSoon: true },
  { href: "/garage", label: "Garage", icon: "car", comingSoon: true },
  { href: "/properties", label: "Immobilien", icon: "building", comingSoon: true },
];

export const bottomNav: NavItem[] = primaryNav;
