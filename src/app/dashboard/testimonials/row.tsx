"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import {
  approveTestimonial,
  rejectTestimonial,
  deleteTestimonial,
  reReviewTestimonial,
  type ModerationState,
} from "./actions";

interface TestimonialView {
  id: string;
  submitterName: string;
  submitterEmail: string;
  company: string | null;
  role: string | null;
  body: string;
  rating: number;
  status: string;
  createdAt: string;
  collection: { id: string; title: string; slug: string };
}

const initial: ModerationState = { ok: false };

export function TestimonialRow({ testimonial }: { testimonial: TestimonialView }) {
  const [showEmail, setShowEmail] = useState(false);
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-medium text-gray-900 dark:text-white">{testimonial.submitterName}</span>
            {testimonial.role || testimonial.company ? (
              <span className="text-gray-500 dark:text-gray-400">
                · {[testimonial.role, testimonial.company].filter(Boolean).join(", ")}
              </span>
            ) : null}
            <span className="text-xs text-gray-500 dark:text-gray-400">· {testimonial.collection.title}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">· {formatDistanceToNow(new Date(testimonial.createdAt), { addSuffix: true })}</span>
            <span
              className={
                testimonial.status === "pending"
                  ? "ml-2 inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200"
                  : testimonial.status === "approved"
                  ? "ml-2 inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/40 dark:text-green-200"
                  : "ml-2 inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/40 dark:text-red-200"
              }
            >
              {testimonial.status}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-1 text-yellow-500" aria-label={`${testimonial.rating} out of 5 stars`}>
            {Array.from({ length: 5 }).map((_, i) => (
              <svg key={i} viewBox="0 0 20 20" className={`h-4 w-4 ${i < testimonial.rating ? "fill-current" : "fill-gray-300 dark:fill-gray-700"}`} aria-hidden="true">
                <path d="M10 1l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.4l-5.3 2.7 1-5.8L1.5 7.2l5.9-.9L10 1z" />
              </svg>
            ))}
          </div>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-200">{testimonial.body}</p>
          <div className="mt-2">
            <button
              type="button"
              onClick={() => setShowEmail((s) => !s)}
              className="text-xs text-gray-500 hover:underline dark:text-gray-400"
            >
              {showEmail ? "Hide submitter email" : "Show submitter email (private)"}
            </button>
            {showEmail ? (
              <div className="mt-1 font-mono text-xs text-gray-700 dark:text-gray-300">{testimonial.submitterEmail}</div>
            ) : null}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <ActionButton id={testimonial.id} action={approveTestimonial} variant="primary" disabled={testimonial.status === "approved"}>
            Approve
          </ActionButton>
          <ActionButton id={testimonial.id} action={rejectTestimonial} variant="secondary" disabled={testimonial.status === "rejected"}>
            Reject
          </ActionButton>
          {testimonial.status === "rejected" ? (
            <ActionButton id={testimonial.id} action={reReviewTestimonial} variant="ghost">
              Move to Pending
            </ActionButton>
          ) : null}
          <ActionButton id={testimonial.id} action={deleteTestimonial} variant="danger" requireConfirm>
            Delete
          </ActionButton>
        </div>
      </div>
    </div>
  );
}

function ActionButton({
  id,
  action,
  variant,
  children,
  disabled,
  requireConfirm,
}: {
  id: string;
  action: (prev: ModerationState, fd: FormData) => Promise<ModerationState>;
  variant: "primary" | "secondary" | "danger" | "ghost";
  children: React.ReactNode;
  disabled?: boolean;
  requireConfirm?: boolean;
}) {
  const [_state, formAction, pending] = useActionState(action, initial);
  return (
    <form
      action={(fd) => {
        if (requireConfirm && !confirm("This will permanently delete the testimonial.")) return;
        return formAction(fd);
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button type="submit" size="sm" variant={variant === "primary" ? "primary" : variant === "secondary" ? "secondary" : variant === "danger" ? "danger" : "ghost"} loading={pending} disabled={disabled}>
        {children}
      </Button>
    </form>
  );
}
