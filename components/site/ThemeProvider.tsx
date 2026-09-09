"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

type Theme = "light" | "dark";

const STORAGE_KEY = "vaaram-theme";

const ThemeContext = createContext<{
  theme: Theme;
  toggleTheme: () => void;
  mounted: boolean;
}>({ theme: "light", toggleTheme: () => {}, mounted: false });

/**
 * Reads whatever the inline script in app/layout.tsx already applied, so the
 * provider and the pre-paint script can never disagree. Until a visitor picks
 * a side explicitly, the operating system preference wins.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
  }, []);

  // Follow the system while the visitor has not made an explicit choice.
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) => {
      if (localStorage.getItem(STORAGE_KEY)) return;
      document.documentElement.classList.toggle("dark", e.matches);
      setTheme(e.matches ? "dark" : "light");
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next: Theme = current === "dark" ? "light" : "dark";
      document.documentElement.classList.toggle("dark", next === "dark");
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* Private browsing — the choice simply does not persist. */
      }
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, mounted }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme, mounted } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={
        mounted ? `Switch to ${theme === "dark" ? "light" : "dark"} theme` : "Switch theme"
      }
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-full border border-[rgb(var(--hairline))]",
        "text-[rgb(var(--text-muted))] transition-colors",
        "hover:border-[rgb(var(--accent))] hover:text-[rgb(var(--accent-text))]",
        className
      )}
    >
      {/* Both icons are rendered and cross-faded, so the button never shifts
          or flickers between the server render and hydration. */}
      <Sun
        className={cn(
          "size-[17px] transition-opacity duration-200",
          mounted && theme === "dark" ? "opacity-100" : "absolute opacity-0"
        )}
        aria-hidden
      />
      <Moon
        className={cn(
          "size-[17px] transition-opacity duration-200",
          !mounted || theme === "light" ? "opacity-100" : "absolute opacity-0"
        )}
        aria-hidden
      />
    </button>
  );
}
