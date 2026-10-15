"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils/cn";

/**
 * Dialog — small, dependency-free accessible dialog primitive.
 *
 * Behaviors:
 *   • Renders into a portal on document.body so it lives at the top of the
 *     DOM and is not affected by ancestor overflow / stacking contexts.
 *   • role="dialog" + aria-modal="true" + aria-labelledby={titleId}.
 *   • Focus is moved into the dialog when it opens and restored to the
 *     previously focused element when it closes.
 *   • Tab / Shift+Tab are trapped inside the panel while open.
 *   • Escape closes (unless closeOnEscape is false).
 *   • Backdrop click closes (unless closeOnBackdrop is false). Clicks
 *     inside the panel do not close.
 *   • document.body scroll is locked while open and restored on close /
 *     unmount.
 *   • Animations use motion-safe: Tailwind variants so users who prefer
 *     reduced motion see no transition.
 *
 * The component does NOT own its open state. The parent passes `open`
 * and a `onClose` callback. This is the same pattern used by Radix /
 * Headless UI dialogs and makes the dialog trivially composable.
 */
export interface DialogProps {
  open: boolean;
  onClose: () => void;
  /**
   * id of the element whose text labels the dialog for assistive tech.
   * The element does not need to be inside the dialog, but it almost
   * always is (typically a visually-hidden <h2>).
   */
  titleId: string;
  describedBy?: string;
  /**
   * Children are rendered inside the dialog panel. The dialog does not
   * render its own close button — provide one in your children if you
   * want a visible dismiss control.
   *
   * Marked optional in the type so callers can use the spread pattern
   * `createElement(Dialog, props)` without TypeScript complaining that
   * `children` is missing. A dialog without children is a mis-use and
   * will simply render an empty panel.
   */
  children?: React.ReactNode;
  /** Click on the dimmed backdrop closes the dialog. Default: true. */
  closeOnBackdrop?: boolean;
  /** Pressing Escape closes the dialog. Default: true. */
  closeOnEscape?: boolean;
  className?: string;
}

const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export function Dialog({
  open,
  onClose,
  titleId,
  describedBy,
  children,
  closeOnBackdrop = true,
  closeOnEscape = true,
  className,
}: DialogProps) {
  const panelRef = React.useRef<HTMLDivElement | null>(null);
  // The element that had focus before the dialog opened. We restore
  // focus here on close.
  const previouslyFocusedRef = React.useRef<HTMLElement | null>(null);
  // Tracks the previous body overflow so we can restore it on close.
  const previousBodyOverflowRef = React.useRef<string | null>(null);
  // Avoid setting up listeners if not open.
  const openRef = React.useRef(open);
  openRef.current = open;

  // Mount the dialog only on the client. During SSR / first paint
  // before hydration we render nothing, then createPortal as soon as
  // the effect runs.
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Focus management + body scroll lock, runs whenever `open` changes.
  React.useEffect(() => {
    if (!open) return;

    // Remember focus so we can restore it on close.
    const prev = document.activeElement;
    if (prev instanceof HTMLElement) {
      previouslyFocusedRef.current = prev;
    }

    // Lock body scroll.
    const previousOverflow = document.body.style.overflow;
    previousBodyOverflowRef.current = previousOverflow;
    document.body.style.overflow = "hidden";

    // Move focus into the panel on the next frame so the portal has
    // been committed to the DOM.
    const raf = requestAnimationFrame(() => {
      const panel = panelRef.current;
      if (panel) {
        // If the panel has no focusable descendants, focus the panel
        // itself (tabIndex={-1} on the panel allows this).
        const focusables = panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
        if (focusables.length > 0) {
          (focusables[0] as HTMLElement).focus();
        } else {
          panel.focus();
        }
      }
    });

    return () => {
      cancelAnimationFrame(raf);
      // Restore body scroll.
      if (previousBodyOverflowRef.current !== null) {
        document.body.style.overflow = previousBodyOverflowRef.current;
      } else {
        document.body.style.overflow = "";
      }
      // Restore focus.
      const prevEl = previouslyFocusedRef.current;
      if (prevEl && document.body.contains(prevEl)) {
        prevEl.focus();
      }
    };
  }, [open]);

  // Document-level keydown listener: Escape closes; Tab/Shift+Tab traps
  // focus inside the panel. Only attached while the dialog is open.
  React.useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && closeOnEscape) {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusables = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      ).filter((el) => !el.hasAttribute("disabled") && el.offsetParent !== null);
      if (focusables.length === 0) {
        // Nothing focusable inside; keep focus on the panel itself.
        e.preventDefault();
        panel.focus();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (!first || !last) return;
      const active = document.activeElement;
      if (e.shiftKey) {
        if (active === first || !panel.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last || !panel.contains(active)) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, closeOnEscape, onClose]);

  // Cleanup on unmount even if `open` was never set to false. This
  // prevents body-scroll-lock leaks in tests and during fast
  // navigation.
  React.useEffect(() => {
    return () => {
      if (previousBodyOverflowRef.current !== null) {
        document.body.style.overflow = previousBodyOverflowRef.current;
      } else {
        document.body.style.overflow = "";
      }
    };
  }, []);

  if (!mounted || !open) return null;

  const dialog = (
    <div data-testid="dialog-root">
      {/* Backdrop: dimmed overlay. Click closes by default. */}
      <div
        data-testid="dialog-backdrop"
        aria-hidden="true"
        onClick={closeOnBackdrop ? onClose : undefined}
        className="fixed inset-0 z-40 bg-black/50"
      />
      {/* Panel wrapper. The wrapper itself is the role=dialog / aria-modal
          element; the inner div is the actual visual card. */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={describedBy}
        tabIndex={-1}
        data-testid="dialog-panel"
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "fixed inset-0 z-50 flex items-center justify-center p-4 outline-none",
          "pointer-events-none"
        )}
      >
        <div
          data-testid="dialog-card"
          className={cn(
            "pointer-events-auto w-full max-w-xl rounded-lg bg-white shadow-xl dark:bg-gray-900",
            "max-h-[90vh] overflow-y-auto"
          )}
        >
          <div className={cn("p-6", className)}>{children}</div>
        </div>
      </div>
    </div>
  );

  return createPortal(dialog, document.body);
}
