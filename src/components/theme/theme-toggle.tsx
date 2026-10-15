"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { useTheme } from "@/lib/theme/use-theme";
import type { Theme } from "@/lib/theme/theme-script";

/**
 * ThemeToggle — three-state (light / dark / system) toggle rendered in
 * the marketing header. The trigger icon reflects the *resolved* theme
 * (so a system-mode user on a dark OS sees a moon), and the menu lists
 * the three options with the active one marked.
 *
 * Accessibility:
 *   - Trigger: `aria-haspopup="menu"`, `aria-expanded`, `aria-label`.
 *   - Menu: `role="menu"`, each item `role="menuitemradio"` with
 *     `aria-checked`.
 *   - Escape closes the menu; outside-click closes the menu.
 *
 * The component renders a stable "system" placeholder on the first
 * paint (before the `useTheme` effect runs) to avoid a hydration
 * mismatch. The real icon swaps in immediately after mount.
 */

function SunIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MonitorIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <rect
        x="3"
        y="4"
        width="18"
        height="12"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M8 21h8M12 17v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function TriggerIcon({ resolved, mounted }: { resolved: "light" | "dark"; mounted: boolean }) {
  // Stable placeholder before mount to avoid hydration mismatch.
  if (!mounted) return <MonitorIcon className="h-4 w-4" />;
  return resolved === "dark" ? (
    <MoonIcon className="h-4 w-4" />
  ) : (
    <SunIcon className="h-4 w-4" />
  );
}

const OPTIONS: Array<{ value: Theme; label: string; Icon: React.FC<React.SVGProps<SVGSVGElement>> }> = [
  { value: "light", label: "Light", Icon: SunIcon },
  { value: "dark", label: "Dark", Icon: MoonIcon },
  { value: "system", label: "System", Icon: MonitorIcon },
];

export function ThemeToggle() {
  const { theme, resolved, setTheme, mounted } = useTheme();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Close on outside click and on Escape.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-9 w-9 p-0"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={
          mounted
            ? `Theme: ${theme === "system" ? `system (${resolved})` : theme}. Change theme.`
            : "Change theme"
        }
        onClick={() => setOpen((v) => !v)}
      >
        <TriggerIcon resolved={resolved} mounted={mounted} />
      </Button>
      {open ? (
        <div
          role="menu"
          aria-label="Theme"
          className={cn(
            "absolute right-0 z-50 mt-2 w-40 origin-top-right rounded-md border border-gray-200 bg-white p-1 shadow-lg",
            "dark:border-gray-700 dark:bg-gray-900"
          )}
        >
          {OPTIONS.map(({ value, label, Icon }) => {
            const checked = mounted && theme === value;
            return (
              <button
                key={value}
                type="button"
                role="menuitemradio"
                aria-checked={checked}
                onClick={() => {
                  setTheme(value);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm",
                  "text-gray-700 hover:bg-gray-100",
                  "dark:text-gray-200 dark:hover:bg-gray-800",
                  checked && "bg-gray-100 dark:bg-gray-800"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="flex-1">{label}</span>
                {checked ? (
                  <span aria-hidden="true" className="text-brand-600 dark:text-brand-400">
                    ✓
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
