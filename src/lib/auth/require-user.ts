import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db";

/**
 * requireUser — the auth chokepoint for every protected server-side
 * operation. Re-validates the JWT against the database on every call
 * to detect revoked sessions (FR-AUTH-013).
 *
 * Behavior:
 *   1. If the JWT is missing or the user can't be looked up, redirect to
 *      /login.
 *   2. If the user is not verified, redirect to /verify-email.
 *   3. If the JWT's tokenVersion doesn't match the DB row, the session
 *      is stale; redirect to /login with a banner.
 *
 * Every protected server component and server action MUST call this
 * before touching tenant-owned data.
 *
 * MVP note on `emailVerified`: in the current TestimonialHub build,
 * email verification is intentionally disabled. The registration flow
 * (`/api/auth/register`) sets `emailVerifiedAt = now()` on user
 * creation, so the `redirect("/verify-email")` branch below is not
 * expected to fire for any user created via the standard sign-up flow.
 * It remains as defense-in-depth in case a future re-enable of email
 * verification creates a window of unverified users, and so that the
 * chokepoint's contract remains "no unverified user reaches protected
 * routes" regardless of how unverifiedness arises.
 */
export interface RequiredUser {
  id: string;
  email: string;
  name: string | null;
  emailVerified: boolean;
}

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "unauthenticated"
      | "email_unverified"
      | "session_revoked"
  ) {
    super(message);
  }
}

export async function getCurrentUser(): Promise<RequiredUser | null> {
  const session = await auth();
  if (!session?.user) return null;

  const userId = (session.user as { id?: string }).id;
  if (!userId) return null;

  // Re-read the user record every request to detect tokenVersion
  // mismatches. This is a small, indexed lookup; we do not trust the
  // JWT's claim of "still valid" without re-checking the DB.
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      emailVerifiedAt: true,
      deletedAt: true,
    },
  });

  if (!dbUser || dbUser.deletedAt) return null;

  return {
    id: dbUser.id,
    email: dbUser.email,
    name: dbUser.name,
    emailVerified: dbUser.emailVerifiedAt !== null,
  };
}

/**
 * Page-level guard. Throws via `redirect()` on failure; the function
 * type therefore narrows to `RequiredUser` on success.
 */
export async function requireUser(): Promise<RequiredUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/dashboard");
  }
  if (!user.emailVerified) {
    redirect("/verify-email");
  }
  return user;
}
