"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark";

function subscribe(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
}

function getSnapshot(): Theme {
  return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
}

// Matches the CSS default so SSR markup and the pre-hydration DOM agree;
// useSyncExternalStore reconciles any client-only difference (e.g. a stored
// "light" preference) after mount without a manual effect+setState.
function getServerSnapshot(): Theme {
  return "dark";
}

export function ThemeToggle({ className }: { className?: string }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", next === "dark" ? "#0b0b12" : "#f6f6f4");
    try {
      localStorage.setItem("life-theme", next);
    } catch {
      // localStorage unavailable (private mode etc.) — toggle still works for this page view
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Zum hellen Design wechseln" : "Zum dunklen Design wechseln"}
      title={theme === "dark" ? "Helles Design" : "Dunkles Design"}
      className={`flex h-9 w-9 items-center justify-center rounded-full text-foreground-muted hover:bg-surface-muted hover:text-foreground ${className ?? ""}`}
    >
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
