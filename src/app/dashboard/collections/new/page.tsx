"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea, Alert } from "@/components/ui/form";
import { createCollection, type ActionState } from "../actions";

const initial: ActionState = { ok: false };

export default function NewCollectionPage() {
  const [state, formAction, pending] = useActionState(createCollection, initial);
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">New collection</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Create a public page where people can submit testimonials.</p>
      </div>
      <form action={formAction} className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        {state.message && !state.ok ? <Alert variant="error">{state.message}</Alert> : null}
        <Field label="Title" htmlFor="title" required hint="Shown on the public page header.">
          <Input id="title" name="title" type="text" required maxLength={120} aria-invalid={Boolean(state.fieldErrors?.title)} />
        </Field>
        <Field label="Description" htmlFor="description" hint="Optional. 1–2 sentences about who the testimonials are for.">
          <Textarea id="description" name="description" rows={3} maxLength={2000} />
        </Field>
        <Field
          label="Slug"
          htmlFor="slug"
          required
          hint="Lowercase letters, digits, dashes. 2–40 characters. The public URL will be /c/{slug}."
        >
          <Input id="slug" name="slug" type="text" required maxLength={40} pattern="[a-z0-9](?:[a-z0-9\-]{1,38}[a-z0-9])?" aria-invalid={Boolean(state.fieldErrors?.slug)} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Brand color" htmlFor="brandColor" hint="Used on the public page and widgets.">
            <div className="flex items-center gap-2">
              <input id="brandColor" name="brandColor" type="color" defaultValue="#4f46e5" className="h-10 w-14 cursor-pointer rounded border border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-900" />
              <Input name="brandColorText" type="text" defaultValue="#4f46e5" maxLength={7} className="font-mono" readOnly />
            </div>
          </Field>
          <Field label="Theme" htmlFor="theme">
            <select
              id="theme"
              name="theme"
              defaultValue="auto"
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            >
              <option value="auto">Auto (match system)</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </Field>
        </div>
        <div className="flex items-center justify-end gap-2">
          <Link href="/dashboard/collections" className="rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">
            Cancel
          </Link>
          <Button type="submit" loading={pending}>
            Create collection
          </Button>
        </div>
      </form>
    </div>
  );
}
