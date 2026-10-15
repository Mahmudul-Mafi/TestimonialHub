"use client";

import * as React from "react";

/**
 * CopyReviewLink — small client component that copies a URL to the
 * clipboard and briefly shows "Copied!" feedback.
 *
 * Uses the modern Clipboard API (`navigator.clipboard.writeText`) which
 * requires a secure context (https or localhost). For non-secure
 * contexts we silently fall back to a `document.execCommand("copy")` of
 * a hidden textarea so the feature still works during local dev over
 * HTTP. The button is rendered with `type="button"` and includes an
 * `aria-live` region for assistive tech.
 *
 * No external dependencies — this is intentionally tiny and inline so it
 * can be reused anywhere a copy-link affordance is needed.
 */
export interface CopyReviewLinkProps {
  /** The fully-qualified URL to copy (e.g. https://example.com/wall/slug#review-abc). */
  url: string;
  /** Optional label override for the button. */
  label?: string;
}

export function CopyReviewLink({ url, label = "Copy review link" }: CopyReviewLinkProps) {
  const [copied, setCopied] = React.useState(false);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  async function handleCopy() {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else if (typeof document !== "undefined") {
        // Fallback for non-secure contexts.
        const ta = document.createElement("textarea");
        ta.value = url;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      } else {
        return;
      }
      setCopied(true);
      if (timerRef.current !== null) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard write can fail (permission, blocked). We surface that
      // with a brief error state rather than throwing.
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      data-testid="copy-review-link"
      aria-label={`${label} (${url})`}
      className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
    >
      <svg
        viewBox="0 0 20 20"
        width="12"
        height="12"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="h-3 w-3"
        aria-hidden="true"
      >
        <rect x="6" y="6" width="10" height="10" rx="1.5" />
        <path d="M4 12V5a1.5 1.5 0 011.5-1.5H12" strokeLinecap="round" />
      </svg>
      <span aria-live="polite">{copied ? "Copied!" : label}</span>
    </button>
  );
}