"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Field, Input, Alert } from "@/components/ui/form";

export function ForgotPasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const res = await fetch("/api/auth/request-reset", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data?.error ?? "Something went wrong.");
      return;
    }
    setDone(true);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error ? <Alert variant="error">{error}</Alert> : null}
      {done ? (
        <Alert variant="success">
          If that email belongs to an account, we just sent a password-reset link. Check your inbox and spam folder.
        </Alert>
      ) : null}
      <Field label="Email" htmlFor="email" required>
        <Input id="email" name="email" type="email" required autoComplete="email" maxLength={254} />
      </Field>
      <Button type="submit" className="w-full" size="lg">
        Send reset link
      </Button>
      <p className="text-center text-sm text-gray-600 dark:text-gray-400">
        Remembered it?{" "}
        <Link href="/login" className="font-medium text-brand-600 hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
