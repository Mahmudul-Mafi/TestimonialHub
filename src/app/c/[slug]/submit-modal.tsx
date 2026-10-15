"use client";

import { useEffect, useRef, useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { SubmitForm } from "./submit/submit-form";

/**
 * SubmitModal — opens the existing <SubmitForm> in an accessible modal
 * on the public collection page.
 *
 * The trigger button is a real <button type="button"> so it never
 * submits anything. When clicked, the dialog opens. The form POSTs to
 * the same /api/public/[slug]/submit endpoint as the standalone page.
 * On success the form fires `onDone`; the modal auto-closes after a
 * short delay so the visitor sees the success alert briefly.
 *
 * The standalone /c/[slug]/submit page is preserved as a fallback.
 */
export interface SubmitModalProps {
  slug: string;
  brandColor: string;
  /** Visible label for the trigger button. */
  triggerLabel?: string;
}

const AUTO_CLOSE_DELAY_MS = 600;

export function SubmitModal({
  slug,
  brandColor,
  triggerLabel = "Leave a testimonial",
}: SubmitModalProps) {
  const [open, setOpen] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cancel any pending close timer on unmount.
  useEffect(() => {
    return () => {
      if (closeTimerRef.current !== null) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  function scheduleClose() {
    if (closeTimerRef.current !== null) {
      clearTimeout(closeTimerRef.current);
    }
    closeTimerRef.current = setTimeout(() => {
      setOpen(false);
      closeTimerRef.current = null;
    }, AUTO_CLOSE_DELAY_MS);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        data-testid="submit-modal-trigger"
        className="inline-flex h-11 items-center justify-center rounded-md px-5 text-sm font-medium text-white shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ backgroundColor: brandColor }}
      >
        {triggerLabel}
      </button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        titleId="submit-modal-title"
        closeOnBackdrop
        closeOnEscape
      >
        <div className="relative">
          <h2 id="submit-modal-title" className="sr-only">
            Submit a testimonial
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={() => setOpen(false)}
            data-testid="submit-modal-close"
            className="absolute right-0 top-0 inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          >
            <svg
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path d="M5 5l10 10M15 5L5 15" />
            </svg>
          </button>
          <SubmitForm
            slug={slug}
            brandColor={brandColor}
            onDone={scheduleClose}
          />
        </div>
      </Dialog>
    </>
  );
}
