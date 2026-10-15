"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/form";
import { deleteCollection, type ActionState } from "../actions";

const initial: ActionState = { ok: false };

export function DeleteCollectionForm({ id }: { id: string }) {
  const [state, formAction, pending] = useActionState(deleteCollection, initial);
  const [confirmText, setConfirmText] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);

  return (
    <form action={formAction} className="space-y-3">
      {state.message && !state.ok ? <Alert variant="error">{state.message}</Alert> : null}
      <input type="hidden" name="id" value={id} />
      <label className="flex items-start gap-2 text-sm text-red-900 dark:text-red-200">
        <input
          type="checkbox"
          checked={acknowledged}
          onChange={(e) => setAcknowledged(e.target.checked)}
          className="mt-0.5"
        />
        <span>I understand this will permanently delete the collection, all its testimonials, and all its widgets.</span>
      </label>
      <div>
        <label htmlFor="confirm" className="block text-sm font-medium text-red-900 dark:text-red-200">
          Type <code className="rounded bg-white px-1 dark:bg-red-950">delete</code> to confirm
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
      <Button
        type="submit"
        variant="danger"
        loading={pending}
        disabled={!acknowledged || confirmText !== "delete"}
      >
        Delete collection
      </Button>
    </form>
  );
}
