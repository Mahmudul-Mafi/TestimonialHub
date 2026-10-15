"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Field, Input, Alert } from "@/components/ui/form";

export function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const name = String(formData.get("name") ?? "").trim();
    const next = String(formData.get("next") ?? "/dashboard");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password, name: name || undefined, next }),
    });

    let data: { ok?: boolean; redirectTo?: string; error?: string } = {};
    try {
      data = await res.json();
    } catch {
      // Non-JSON body (shouldn't happen, but be defensive).
    }

    if (!res.ok) {
      setError(data.error ?? "Registration failed. Please try again.");
      return;
    }

    if (data.redirectTo) {
      // Server-side auto-login (new user) hands us the session cookie on
      // this response. A full navigation applies the cookie and loads
      // the dashboard. For the "email already exists" path this also
      // sends the user to the login page.
      window.location.href = data.redirectTo;
      return;
    }

    // Fallback: if the server didn't tell us where to go, push locally.
    startTransition(() => {
      router.push(next);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error ? <Alert variant="error">{error}</Alert> : null}
      <Field label="Name" htmlFor="name" hint="Optional. Displayed on your dashboard only.">
        <Input id="name" name="name" type="text" autoComplete="name" maxLength={80} />
      </Field>
      <Field label="Email" htmlFor="email" required>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          aria-invalid={Boolean(fieldErrors.email)}
          maxLength={254}
        />
      </Field>
      <Field
        label="Password"
        htmlFor="password"
        required
        hint="At least 10 characters, with at least one letter and one digit."
      >
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          minLength={10}
          maxLength={1024}
          aria-invalid={Boolean(fieldErrors.password)}
        />
      </Field>
      <input type="hidden" name="next" value={params.get("next") ?? "/dashboard"} />
      <Button type="submit" className="w-full" size="lg" loading={pending}>
        Create account
      </Button>
      <p className="text-center text-sm text-gray-600 dark:text-gray-400">
        Already have an account?{" "}
        <Link href={`/login?next=${encodeURIComponent(params.get("next") ?? "/dashboard")}`} className="font-medium text-brand-600 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
