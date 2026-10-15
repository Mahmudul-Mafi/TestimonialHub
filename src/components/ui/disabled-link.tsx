"use client";

import * as React from "react";
import Link from "next/link";

/**
 * Renders a `next/link` that is non-interactive (clicks are blocked) and
 * exposes `aria-disabled` to assistive tech.
 *
 * This exists so that Server Components can render a "coming soon" CTA
 * without passing an `onClick` handler directly to a Client Component
 * (next/link). Keeping the handler inside a Client Component preserves
 * the original product behavior while restoring RSC compliance.
 *
 * When `disabled` is true, the component renders a real `<button disabled>`
 * instead of a click-blocked anchor. This is the preferred form for
 * fully unavailable actions (e.g. "Coming soon") because:
 *   - it is not in the tab order as a link,
 *   - assistive tech reports it as "dimmed" / "unavailable" rather than
 *     as a working link that does nothing,
 *   - the browser handles the visual disabled state natively.
 *
 * The legacy `<Link aria-disabled>` form is preserved for callers that
 * intentionally want the element to remain focusable as a link (e.g. to
 * be announced as a link with a state). New code should pass
 * `disabled` explicitly.
 */
export interface DisabledLinkProps {
  href: string;
  className?: string;
  children: React.ReactNode;
  /** When true, render a real `<button disabled>` instead of a click-blocked link. */
  disabled?: boolean;
}

export function DisabledLink({
  href,
  className,
  children,
  disabled = false,
}: DisabledLinkProps) {
  const handleClick = React.useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
  }, []);

  if (disabled) {
    return (
      <button
        type="button"
        disabled
        aria-disabled="true"
        className={className}
      >
        {children}
      </button>
    );
  }

  return (
    <Link
      href={href}
      aria-disabled="true"
      onClick={handleClick}
      className={className}
    >
      {children}
    </Link>
  );
}
