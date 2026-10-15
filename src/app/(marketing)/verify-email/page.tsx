import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { Alert } from "@/components/ui/form";

export const metadata: Metadata = { title: "Email verification" };

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; next?: string }>;
}) {
  const { email } = await searchParams;
  return (
    <AuthShell
      title="Email verification"
      subtitle="This page is a no-op for the current MVP."
    >
      <Alert variant="info">
        <p>
          Email verification is not required in the current TestimonialHub
          MVP. New accounts are created and signed in immediately after
          registration; the system does not send a verification email.
        </p>
        <p className="mt-3">
          This page and the underlying
          {" "}<code>/api/auth/verify-email</code> endpoint are kept
          available so that any pre-existing verification link (from a
          build that did require verification) still resolves, and so
          that email verification can be re-enabled in a future release
          without code changes outside the registration flow.
        </p>
        {email ? (
          <p className="mt-3">
            The address associated with this link was <strong>{email}</strong>.
            No action is required.
          </p>
        ) : null}
      </Alert>
    </AuthShell>
  );
}
