"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Field, Input, Alert } from "@/components/ui/form";

export function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <Alert variant="error">
        This page expects a reset link. If you arrived here directly, please use the “Forgot your password?” link on the sign-in page.
      </Alert>
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirm = String(formData.get("confirm") ?? "");
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data?.error ?? "Something went wrong.");
      return;
    }
    setDone(true);
    startTransition(() => {
      setTimeout(() => router.push("/login"), 1500);
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error ? <Alert variant="error">{error}</Alert> : null}
      {done ? (
        <Alert variant="success">
          Your password has been reset. You can now sign in.
        </Alert>
      ) : null}
      <Field
        label="New password"
        htmlFor="password"
        required
        hint="At least 10 characters, with at least one letter and one digit."
      >
        <Input id="password" name="password" type="password" required minLength={10} maxLength={1024} />
      </Field>
      <Field label="Confirm new password" htmlFor="confirm" required>
        <Input id="confirm" name="confirm" type="password" required minLength={10} maxLength={1024} />
      </Field>
      <Button type="submit" className="w-full" size="lg" loading={pending} disabled={done}>
        Update password
      </Button>
      <p className="text-center text-sm text-gray-600 dark:text-gray-400">
        <Link href="/login" className="font-medium text-brand-600 hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
