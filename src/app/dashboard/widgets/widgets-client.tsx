"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/form";
import { createWidget, updateWidget, rotateWidgetToken, deleteWidget, type WidgetState } from "./actions";

const initial: WidgetState = { ok: false };

interface CollectionChoice { id: string; title: string; }

export function NewWidgetForm({
  collections,
  atLimit,
}: {
  collections: CollectionChoice[];
  atLimit: boolean;
}) {
  const [state, formAction, pending] = useActionState(createWidget, initial);
  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-4">
      {state.message && !state.ok ? <div className="sm:col-span-4"><Alert variant="error">{state.message}</Alert></div> : null}
      <div className="sm:col-span-2">
        <label htmlFor="collectionId" className="block text-xs font-medium text-gray-700 dark:text-gray-300">
          Collection
        </label>
        <select
          id="collectionId"
          name="collectionId"
          required
          className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        >
          {collections.map((c) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="layout" className="block text-xs font-medium text-gray-700 dark:text-gray-300">Layout</label>
        <select id="layout" name="layout" defaultValue="grid" className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100">
          <option value="grid">Grid</option>
          <option value="carousel">Carousel</option>
        </select>
      </div>
      <div>
        <label htmlFor="sortBy" className="block text-xs font-medium text-gray-700 dark:text-gray-300">Sort by</label>
        <select id="sortBy" name="sortBy" defaultValue="newest" className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100">
          <option value="newest">Newest</option>
          <option value="highest_rating">Highest rating</option>
        </select>
      </div>
      <div className="sm:col-span-4 flex justify-end">
        <Button type="submit" loading={pending} disabled={atLimit}>
          {atLimit ? "Free limit reached" : "Create widget"}
        </Button>
      </div>
    </form>
  );
}

export function WidgetRow({
  widget,
  appUrl,
}: {
  widget: {
    id: string;
    collectionId: string;
    collectionTitle: string;
    collectionSlug: string;
    layout: "grid" | "carousel";
    sortBy: "newest" | "highest_rating";
    isActive: boolean;
    publicToken: string;
  };
  appUrl: string;
}) {
  const [updateState, updateAction, updatePending] = useActionState(updateWidget, initial);
  const [rotateState, rotateAction, rotatePending] = useActionState(rotateWidgetToken, initial);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteWidget, initial);
  const [copied, setCopied] = useState(false);
  const src = `${appUrl}/widgets/${widget.publicToken}`;
  const embed = `<iframe src="${src}" width="100%" height="600" style="border:0" loading="lazy" title="Testimonials"></iframe>`;
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-medium text-gray-900 dark:text-white">{widget.collectionTitle}</span>
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${widget.isActive ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200" : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"}`}>
          {widget.isActive ? "Active" : "Inactive"}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">· {widget.layout} · {widget.sortBy.replace("_", " ")}</span>
      </div>
      <div className="mt-3">
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Embed code</label>
        <div className="mt-1 flex items-start gap-2">
          <code className="flex-1 overflow-x-auto rounded bg-gray-100 p-2 font-mono text-xs dark:bg-gray-800">{embed}</code>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={async () => {
              await navigator.clipboard.writeText(embed);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
          >
            {copied ? "Copied!" : "Copy"}
          </Button>
        </div>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Or link directly: <a href={src} className="text-brand-600 underline" target="_blank" rel="noopener noreferrer">{src}</a></p>
      </div>
      <form action={updateAction} className="mt-3 flex flex-wrap items-end gap-2 text-sm">
        <input type="hidden" name="id" value={widget.id} />
        <input type="hidden" name="collectionId" value={widget.collectionId} />
        <select name="layout" defaultValue={widget.layout} className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100">
          <option value="grid">Grid</option>
          <option value="carousel">Carousel</option>
        </select>
        <select name="sortBy" defaultValue={widget.sortBy} className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100">
          <option value="newest">Newest</option>
          <option value="highest_rating">Highest rating</option>
        </select>
        <label className="inline-flex items-center gap-1 text-xs">
          <input type="checkbox" name="isActive" value="true" defaultChecked={widget.isActive} />
          Active
        </label>
        <Button type="submit" size="sm" variant="secondary" loading={updatePending}>
          Save
        </Button>
        {updateState.message ? <span className="text-xs text-gray-500">{updateState.message}</span> : null}
      </form>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <form action={rotateAction}>
          <input type="hidden" name="id" value={widget.id} />
          <Button type="submit" size="sm" variant="ghost" loading={rotatePending}>
            Rotate embed token
          </Button>
        </form>
        <form action={deleteAction} onSubmit={(e) => { if (!confirm("Delete this widget? The embed will stop working immediately.")) e.preventDefault(); }}>
          <input type="hidden" name="id" value={widget.id} />
          <Button type="submit" size="sm" variant="danger" loading={deletePending}>
            Delete
          </Button>
        </form>
        {rotateState.message ? <span className="text-xs text-gray-500">{rotateState.message}</span> : null}
        {deleteState.message ? <span className="text-xs text-gray-500">{deleteState.message}</span> : null}
      </div>
    </div>
  );
}
