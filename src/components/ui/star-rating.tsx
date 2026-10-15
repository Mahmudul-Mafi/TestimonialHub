"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";

/**
 * StarRating — accessible 1–5 star picker for testimonial submissions.
 *
 * Implemented as a native radio group so:
 *   • keyboard users get expected radio behavior (← / → / ↑ / ↓ to
 *     navigate, Space to select, Enter to submit the surrounding form)
 *   • screen readers announce the group label + the currently focused
 *     option's name (e.g. "4 out of 5 stars")
 *   • form autofill / form-data behavior is correct — the chosen value is
 *     serialized under the form field's `name`, exactly like a native
 *     <input type="radio"> group
 *
 * Visually each option is rendered as a star. Filled stars use the brand
 * yellow; empty stars use a muted gray. Hovering or focusing an option
 * paints its star and all stars to its left (a small visual hint, the
 * final selection still requires an explicit click / keyboard select).
 *
 * The hidden radio inputs carry the value; the visible labels are styled
 * `<label>` elements so clicking them activates the underlying input. This
 * is the canonical accessible star-rating pattern.
 */
export interface StarRatingProps {
  /** Form field name; the selected value is submitted as a number 1–5. */
  name: string;
  /** Group label for assistive tech (e.g. "Your rating"). */
  label: string;
  /** ID used by the wrapping <label htmlFor> of the form's Field. */
  id: string;
  /** Currently selected value (controlled). */
  value: number | null;
  /** Called whenever the user picks a value. */
  onChange: (next: number) => void;
  /** Optional error message; rendered in red below the group. */
  error?: string | null;
  /** When true, the control is non-interactive. */
  disabled?: boolean;
}

const STAR_VALUES = [1, 2, 3, 4, 5] as const;

export function StarRating({
  name,
  label,
  id,
  value,
  onChange,
  error,
  disabled,
}: StarRatingProps) {
  const groupId = `${id}-group`;
  const errorId = `${id}-error`;
  const describedBy = error ? errorId : undefined;

  return (
    <div className="space-y-1.5">
      <span
        id={`${id}-label`}
        className="block text-sm font-medium text-gray-700 dark:text-gray-200"
      >
        {label}
        <span className="text-red-500"> *</span>
      </span>
      <div
        role="radiogroup"
        id={groupId}
        aria-labelledby={`${id}-label`}
        aria-describedby={describedBy}
        aria-required={true}
        data-testid="star-rating"
        className="flex items-center gap-1"
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key !== "ArrowLeft" && e.key !== "ArrowRight" && e.key !== "ArrowUp" && e.key !== "ArrowDown") {
            return;
          }
          e.preventDefault();
          const current = value ?? 0;
          const direction = e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 1;
          const next = Math.min(5, Math.max(1, current + direction));
          if (next !== current) {
            onChange(next);
            const target = document.getElementById(`${id}-star-${next}`) as HTMLInputElement | null;
            target?.focus();
          }
        }}
      >
        {STAR_VALUES.map((n) => {
          const checked = value === n;
          const filled = value !== null && n <= value;
          return (
            <label
              key={n}
              htmlFor={`${id}-star-${n}`}
              className={cn(
                "group relative inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md",
                "focus-within:ring-2 focus-within:ring-brand-500 focus-within:ring-offset-2 focus-within:ring-offset-white dark:focus-within:ring-offset-gray-900",
                disabled && "cursor-not-allowed opacity-60"
              )}
            >
              <input
                type="radio"
                id={`${id}-star-${n}`}
                name={name}
                value={n}
                checked={checked}
                disabled={disabled}
                onChange={() => onChange(n)}
                required
                aria-label={`${n} out of 5 stars`}
                className="peer absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0 focus:outline-none"
              />
              <svg
                viewBox="0 0 20 20"
                width="20"
                height="20"
                aria-hidden="true"
                className={cn(
                  "h-6 w-6 transition-colors",
                  filled
                    ? "fill-yellow-400 peer-hover:fill-yellow-500"
                    : "fill-gray-300 peer-hover:fill-yellow-300 dark:fill-gray-700 dark:peer-hover:fill-yellow-300"
                )}
              >
                <path d="M10 1l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.4l-5.3 2.7 1-5.8L1.5 7.2l5.9-.9L10 1z" />
              </svg>
            </label>
          );
        })}
      </div>
      {error ? (
        <p id={errorId} className="text-xs text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}