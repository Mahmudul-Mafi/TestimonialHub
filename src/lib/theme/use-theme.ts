"use client";

import { useCallback, useEffect, useState } from "react";
import { THEME_STORAGE_KEY, type ResolvedTheme, type Theme } from "./theme-script";

/**
 * `useTheme` — the single source of truth for the current theme.
 *
 * Returns:
 *   theme    — the user's choice: "light" | "dark" | "system".
 *   resolved — what is actually being rendered right now: "light" | "dark".
 *              When `theme === "system"`, this follows the OS via
 *              `prefers-color-scheme` and updates live when the user
 *              changes their OS theme.
 *   setTheme — persist a new choice. If the choice is "system", the
 *              resolved value is recomputed from `matchMedia` at call
 *              time and the page is updated accordingly.
 *
 * Hydration note: `useState` is initialized to `"system"` so the
 * server-rendered HTML matches the first client render. The real value
 * is read from `localStorage` inside `useEffect`, which runs only on
 * the client. The `mounted` flag is exposed so consumers can avoid
 * rendering theme-dependent UI before the first effect runs.
 */
export interface UseThemeResult {
  theme: Theme;
  resolved: ResolvedTheme;
  setTheme: (next: Theme) => void;
  mounted: boolean;
}

function readStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  try {
    const v = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {
    // Ignore: privacy mode or other access errors.
  }
  return "system";
}

function systemPrefersDark(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyClass(resolved: ResolvedTheme): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (resolved === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
}

export function useTheme(): UseThemeResult {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolved, setResolved] = useState<ResolvedTheme>("light");
  const [mounted, setMounted] = useState(false);

  // Initial read + subscribe to system changes when on "system".
  useEffect(() => {
    const initial = readStoredTheme();
    setThemeState(initial);
    const initialResolved: ResolvedTheme =
      initial === "dark" || (initial === "system" && systemPrefersDark())
        ? "dark"
        : "light";
    setResolved(initialResolved);
    applyClass(initialResolved);
    setMounted(true);
  }, []);

  // When the theme is "system", subscribe to matchMedia so the page
  // updates live if the user changes their OS theme.
  useEffect(() => {
    if (theme !== "system") return;
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) => {
      const next: ResolvedTheme = e.matches ? "dark" : "light";
      setResolved(next);
      applyClass(next);
    };
    // addEventListener is the modern API; addListener is the legacy fallback.
    if (mql.addEventListener) {
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    }
    mql.addListener(onChange);
    return () => mql.removeListener(onChange);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Ignore: privacy mode.
    }
    const nextResolved: ResolvedTheme =
      next === "dark" || (next === "system" && systemPrefersDark())
        ? "dark"
        : "light";
    setResolved(nextResolved);
    applyClass(nextResolved);
  }, []);

  return { theme, resolved, setTheme, mounted };
}
