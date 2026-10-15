"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Alert } from "@/components/ui/form";
import { updateName, changePassword, deleteAccount, type SettingsState } from "./actions";

const initial: SettingsState = { ok: false };

export function NameForm({ currentName }: { currentName: string | null }) {
  const [state, formAction, pending] = useActionState(updateName, initial);
  return (
    <form action={formAction} className="space-y-3">
      {state.message ? <Alert variant={state.ok ? "success" : "error"}>{state.message}</Alert> : null}
      <Field label="Display name" htmlFor="name" hint="Shown on your dashboard. Not public.">
        <Input id="name" name="name" type="text" maxLength={80} defaultValue={currentName ?? ""} />
      </Field>
      <div className="flex justify-end">
        <Button type="submit" size="sm" loading={pending}>Save</Button>
      </div>
    </form>
  );
}

export function PasswordForm() {
  const [state, formAction, pending] = useActionState(changePassword, initial);
  return (
    <form action={formAction} className="space-y-3">
      {state.message ? <Alert variant={state.ok ? "success" : "error"}>{state.message}</Alert> : null}
      <Field label="Current password" htmlFor="current" required>
        <Input id="current" name="current" type="password" required autoComplete="current-password" />
      </Field>
      <Field label="New password" htmlFor="next" required hint="At least 10 characters, with at least one letter and one digit.">
        <Input id="next" name="next" type="password" required minLength={10} maxLength={1024} autoComplete="new-password" />
      </Field>
      <div className="flex justify-end">
        <Button type="submit" size="sm" loading={pending}>Update password</Button>
      </div>
    </form>
  );
}

export function DeleteAccountForm() {
  const [state, formAction, pending] = useActionState(deleteAccount, initial);
  const [confirmText, setConfirmText] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  return (
    <form action={formAction} className="space-y-3">
      {state.message && !state.ok ? <Alert variant="error">{state.message}</Alert> : null}
      <label className="flex items-start gap-2 text-sm text-red-900 dark:text-red-200">
        <input type="checkbox" checked={acknowledged} onChange={(e) => setAcknowledged(e.target.checked)} className="mt-0.5" />
        <span>I understand this permanently deletes my account, all my collections, testimonials, and widgets. This action cannot be undone.</span>
      </label>
      <div>
        <label htmlFor="confirm" className="block text-sm font-medium text-red-900 dark:text-red-200">
          Type <code className="rounded bg-white px-1 dark:bg-red-950">delete my account</code> to confirm
        </label>
        <input
          id="confirm"
          name="confirm"
          type="text"
          required
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          className="mt-1 w-full rounded-md border border-red-300 bg-white px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 dark:border-red-900 dark:bg-red-950/50 dark:text-red-100"
        />
      </div>
      <Button type="submit" variant="danger" loading={pending} disabled={!acknowledged || confirmText !== "delete my account"}>
        Delete my account
      </Button>
    </form>
  );
}
