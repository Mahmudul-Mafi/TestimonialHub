"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea, Alert } from "@/components/ui/form";
import { updateCollection, type ActionState } from "../actions";

const initial: ActionState = { ok: false };

export function EditCollectionForm({
  collection,
}: {
  collection: {
    id: string;
    title: string;
    description: string;
    slug: string;
    brandColor: string;
    theme: "light" | "dark" | "auto";
  };
}) {
  const [state, formAction, pending] = useActionState(updateCollection, initial);
  return (
    <form action={formAction} className="space-y-4 rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      {state.message ? (
        <Alert variant={state.ok ? "success" : "error"}>{state.message}</Alert>
      ) : null}
      <input type="hidden" name="id" value={collection.id} />
      <Field label="Title" htmlFor="title" required>
        <Input id="title" name="title" type="text" required maxLength={120} defaultValue={collection.title} />
      </Field>
      <Field label="Description" htmlFor="description">
        <Textarea id="description" name="description" rows={3} maxLength={2000} defaultValue={collection.description} />
      </Field>
      <Field label="Slug" htmlFor="slug" required>
        <Input id="slug" name="slug" type="text" required maxLength={40} defaultValue={collection.slug} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Brand color" htmlFor="brandColor">
          <div className="flex items-center gap-2">
            <input id="brandColor" name="brandColor" type="color" defaultValue={collection.brandColor} className="h-10 w-14 cursor-pointer rounded border border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-900" />
          </div>
        </Field>
        <Field label="Theme" htmlFor="theme">
          <select
            id="theme"
            name="theme"
            defaultValue={collection.theme}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          >
            <option value="auto">Auto</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </Field>
      </div>
      <div className="flex items-center justify-end">
        <Button type="submit" loading={pending}>
          Save changes
        </Button>
      </div>
    </form>
  );
}
