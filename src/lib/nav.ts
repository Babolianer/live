export type NavItem = {
  href: string;
  label: string;
  icon: string;
  comingSoon?: boolean;
};

// Full, working sections of the app (grows as more of the LIFE concept
// ships — nothing in here is a stub, everything is fully functional).
export const sidebarNav: NavItem[] = [
  { href: "/home", label: "Home", icon: "home" },
  { href: "/ai", label: "KI", icon: "sparkles" },
  { href: "/documents", label: "Dokumente", icon: "file" },
  { href: "/contracts", label: "Verträge", icon: "shield" },
  { href: "/goals", label: "Ziele", icon: "target" },
  { href: "/wealth", label: "Vermögen", icon: "trending-up" },
  { href: "/health", label: "Health & Fitness", icon: "heart" },
  { href: "/garage", label: "Garage", icon: "car" },
  { href: "/properties", label: "Immobilien", icon: "building" },
  { href: "/timeline", label: "Timeline", icon: "clock" },
  { href: "/settings", label: "Einstellungen", icon: "cog" },
];

// Not yet built — the mobile bottom nav intentionally stays at 4 core tabs
// (matches the LIFE design) regardless of how many sidebar sections exist.
export const comingSoonNav: NavItem[] = [];

export const bottomNav: NavItem[] = [
  { href: "/home", label: "Home", icon: "home" },
  { href: "/ai", label: "KI", icon: "sparkles" },
  { href: "/documents", label: "Dokumente", icon: "file" },
  { href: "/contracts", label: "Verträge", icon: "shield" },
];
