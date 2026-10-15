"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

/**
 * DemoCancelForm — small client component that posts to
 * /api/billing/demo-cancel and then navigates to the redirect target.
 *
 * Asks the user to confirm via window.confirm() before submitting. Disables
 * itself while the request is in flight to prevent duplicate submits.
 */
export function DemoCancelForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    if (typeof window !== "undefined") {
      const ok = window.confirm(
        "Cancel your demo subscription and return to the Free plan?"
      );
      if (!ok) return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/demo-cancel", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        message?: string;
        redirectTo?: string;
      };
      if (res.ok && data.ok && data.redirectTo) {
        router.push(data.redirectTo);
        router.refresh();
        return;
      }
      setError(data.message ?? "Unable to cancel demo subscription. Please try again.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <Button type="submit" variant="outline" loading={submitting} disabled={submitting}>
        Cancel demo subscription
      </Button>
      {error ? (
        <p className="text-xs text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}