"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

/**
 * DemoCheckoutForm — the only place that handles raw card input. The
 * full card number and CVC are React state, never leave the component
 * except as a single fetch to /api/billing/demo-checkout, and are not
 * written to localStorage, the URL, or any log.
 */
export function DemoCheckoutForm() {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [number, setNumber] = React.useState("");
  const [expiry, setExpiry] = React.useState("");
  const [cvc, setCvc] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [field, setField] = React.useState<"name" | "number" | "expiry" | "cvc" | null>(null);

  const disabled = submitting;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    setField(null);
    try {
      const res = await fetch("/api/billing/demo-checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, number, expiry, cvc }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        message?: string;
        redirectTo?: string;
        field?: "name" | "number" | "expiry" | "cvc";
      };
      if (res.ok && data.ok && data.redirectTo) {
        // Clear sensitive state before navigating. The form will be
        // unmounted on the next page anyway, but this is defense in depth.
        setName("");
        setNumber("");
        setExpiry("");
        setCvc("");
        router.push(data.redirectTo);
        router.refresh();
        return;
      }
      setError(data.message ?? "Unable to process demo checkout.");
      if (data.field) setField(data.field);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function fieldClass(name: "name" | "number" | "expiry" | "cvc") {
    return cn(
      "mt-1 block w-full rounded-md border bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:bg-gray-900 dark:text-gray-100",
      field === name
        ? "border-red-400 dark:border-red-500"
        : "border-gray-300 dark:border-gray-700"
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" aria-busy={submitting}>
      {error ? (
        <div
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      <div>
        <label
          htmlFor="demo-card-name"
          className="block text-sm font-medium text-gray-700 dark:text-gray-200"
        >
          Cardholder name
        </label>
        <input
          id="demo-card-name"
          name="name"
          type="text"
          autoComplete="cc-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={disabled}
          maxLength={80}
          required
          className={fieldClass("name")}
        />
      </div>

      <div>
        <label
          htmlFor="demo-card-number"
          className="block text-sm font-medium text-gray-700 dark:text-gray-200"
        >
          Card number
        </label>
        <input
          id="demo-card-number"
          name="number"
          type="text"
          inputMode="numeric"
          autoComplete="cc-number"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          disabled={disabled}
          maxLength={32}
          placeholder="4242 4242 4242 4242"
          required
          className={fieldClass("number")}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="demo-card-expiry"
            className="block text-sm font-medium text-gray-700 dark:text-gray-200"
          >
            Expiry (MM/YY)
          </label>
          <input
            id="demo-card-expiry"
            name="expiry"
            type="text"
            inputMode="numeric"
            autoComplete="cc-exp"
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
            disabled={disabled}
            maxLength={7}
            placeholder="12/30"
            required
            className={fieldClass("expiry")}
          />
        </div>
        <div>
          <label
            htmlFor="demo-card-cvc"
            className="block text-sm font-medium text-gray-700 dark:text-gray-200"
          >
            CVC
          </label>
          <input
            id="demo-card-cvc"
            name="cvc"
            type="text"
            inputMode="numeric"
            autoComplete="cc-3-digit"
            value={cvc}
            onChange={(e) => setCvc(e.target.value)}
            disabled={disabled}
            maxLength={4}
            placeholder="123"
            required
            className={fieldClass("cvc")}
          />
        </div>
      </div>

      <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Button type="submit" loading={submitting} disabled={disabled}>
          Try demo checkout — $12/month
        </Button>
        <Link
          href="/dashboard/billing"
          className="focus-ring rounded text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
        >
          Cancel and go back
        </Link>
      </div>
    </form>
  );
}