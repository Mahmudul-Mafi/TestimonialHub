"use client";

import { useState } from "react";
import { Field, Input, Textarea, Alert } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/ui/star-rating";

export interface SubmitFormProps {
  slug: string;
  brandColor: string;
  /**
   * Optional callback fired once a submission has succeeded (the form
   * transitions to its success alert). The standalone /c/[slug]/submit
   * page does not pass this; the modal passes it so it can dismiss.
   */
  onDone?: () => void;
}

export function SubmitForm({ slug, brandColor, onDone }: SubmitFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [ratingError, setRatingError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setRatingError(null);
    if (rating === null) {
      setRatingError("Please choose a rating from 1 to 5 stars.");
      return;
    }
    setPending(true);
    const formData = new FormData(e.currentTarget);
    const payload = {
      submitterName: String(formData.get("submitterName") ?? ""),
      submitterEmail: String(formData.get("submitterEmail") ?? ""),
      company: String(formData.get("company") ?? "") || null,
      role: String(formData.get("role") ?? "") || null,
      body: String(formData.get("body") ?? ""),
      rating,
    };
    const res = await fetch(`/api/public/${encodeURIComponent(slug)}/submit`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    setPending(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data?.error ?? "Submission failed. Please try again.");
      return;
    }
    setDone(true);
    onDone?.();
  }

  if (done) {
    return (
      <Alert variant="success">
        Thanks! Your testimonial has been submitted. The collection owner will review it before it appears publicly.
      </Alert>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
      {error ? <Alert variant="error">{error}</Alert> : null}
      <Field label="Your name" htmlFor="submitterName" required>
        <Input id="submitterName" name="submitterName" type="text" required maxLength={120} autoComplete="name" />
      </Field>
      <Field
        label="Your email"
        htmlFor="submitterEmail"
        required
        hint="Private. Never shown publicly."
      >
        <Input id="submitterEmail" name="submitterEmail" type="email" required maxLength={254} autoComplete="email" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Company" htmlFor="company">
          <Input id="company" name="company" type="text" maxLength={120} />
        </Field>
        <Field label="Role" htmlFor="role">
          <Input id="role" name="role" type="text" maxLength={120} />
        </Field>
      </div>
      <Field label="Your testimonial" htmlFor="body" required hint="1–2000 characters. Be specific.">
        <Textarea id="body" name="body" rows={5} required minLength={10} maxLength={2000} />
      </Field>
      <div>
        <StarRating
          id="rating"
          name="rating"
          label="Your rating"
          value={rating}
          onChange={(n) => {
            setRating(n);
            if (ratingError) setRatingError(null);
          }}
          error={ratingError}
        />
      </div>
      <div className="flex justify-end">
        <Button
          type="submit"
          loading={pending}
          className="text-white"
          style={{ backgroundColor: brandColor }}
        >
          Submit testimonial
        </Button>
      </div>
    </form>
  );
}
