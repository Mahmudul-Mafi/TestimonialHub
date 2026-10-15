"use client";

import * as React from "react";

/**
 * WallEmbedCode — copyable iframe snippet for the public Wall of Love.
 *
 * The snippet is the standard drop-in iframe that any site can use to
 * embed the owner's wall:
 *
 *   <iframe src="https://app.example.com/wall/your-slug" ...></iframe>
 *
 * We render the snippet in a read-only code block with a "Copy" button
 * that uses the same Clipboard API + execCommand fallback as the per-
 * review copy button. A second line shows the public link so the
 * owner can also share a non-iframe URL.
 *
 * The component is intentionally small and self-contained so it can be
 * dropped into any dashboard surface.
 */
export interface WallEmbedCodeProps {
  /** Absolute URL to the wall, e.g. https://app.example.com/wall/your-slug. */
  wallUrl: string;
  /** Iframe height. Default 700 — fits a 3-card grid. */
  height?: number;
}

export function WallEmbedCode({ wallUrl, height = 700 }: WallEmbedCodeProps) {
  const [copied, setCopied] = React.useState(false);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const embed = `<iframe src="${wallUrl}" width="100%" height="${height}" style="border:0" loading="lazy" title="Customer testimonials"></iframe>`;

  React.useEffect(() => {
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, []);

  async function handleCopy() {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(embed);
      } else if (typeof document !== "undefined") {
        const ta = document.createElement("textarea");
        ta.value = embed;
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
      setCopied(false);
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <label
          htmlFor="wall-embed-input"
          className="block text-xs font-medium text-gray-700 dark:text-gray-300"
        >
          Wall of Love embed code
        </label>
        <div className="mt-1 flex items-start gap-2">
          <code
            id="wall-embed-input"
            data-testid="wall-embed-code"
            className="flex-1 overflow-x-auto whitespace-pre rounded bg-gray-100 p-2 font-mono text-xs text-gray-900 dark:bg-gray-800 dark:text-gray-100"
          >
            {embed}
          </code>
          <button
            type="button"
            onClick={handleCopy}
            data-testid="wall-embed-copy"
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-900 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800"
          >
            <span aria-live="polite">{copied ? "Copied!" : "Copy"}</span>
          </button>
        </div>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Or share the link directly:{" "}
        <a
          href={wallUrl}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="wall-public-link"
          className="break-all text-brand-600 underline"
        >
          {wallUrl}
        </a>
      </p>
    </div>
  );
}