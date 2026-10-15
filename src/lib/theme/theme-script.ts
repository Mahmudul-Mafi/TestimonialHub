/**
 * Pre-hydration theme script.
 *
 * Returns a small JavaScript string that is injected into the document
 * before React hydrates, so the `<html>` element already has the
 * correct `.dark` class on first paint. This prevents the dark/light
 * flash on reload.
 *
 * Behavior:
 *   1. Read the persisted choice from `localStorage.getItem("theme")`,
 *      which is one of: "light" | "dark" | "system" | null.
 *   2. If "light" or "dark", apply that to `<html class="dark">`.
 *   3. Otherwise (including "system" and first visit), follow the OS
 *      via `prefers-color-scheme: dark`.
 *   4. The whole body is wrapped in a try/catch so a missing
 *      `localStorage` (privacy mode, locked-down browser) is a no-op.
 *
 * The script is intentionally exported as a plain string so it is
 * unit-testable without a DOM. The layout renders it via
 * `<Script strategy="beforeInteractive">` from `next/script`.
 */
export const THEME_STORAGE_KEY = "theme";

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export function getThemeScript(): string {
  // A single IIFE wrapped in try/catch. Kept under 1 KB.
  return `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var t=localStorage.getItem(k);var d=t==="dark"||(t!=="light"&&window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches);var c=document.documentElement.classList;if(d){c.add("dark");}else{c.remove("dark");}}catch(e){}})();`;
}
