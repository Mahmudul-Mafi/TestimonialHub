import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword, validatePassword } from "@/lib/auth/password";
import { safeNext } from "@/lib/auth/safe-redirect";
import { readSetCookies, pickSetCookie } from "@/lib/auth/read-set-cookies";
import { rateLimit } from "@/lib/security/rate-limit";
import { jitter } from "@/lib/security/constant-time";

/**
 * POST /api/auth/register
 *
 * MVP policy: email verification is intentionally disabled.
 *
 * New users are created with `emailVerifiedAt = now()` and auto-logged-in
 * via the same credentials sign-in flow the user would otherwise
 * complete manually — see "Auto-login" below. They are then redirected to
 * `next` (default `/dashboard`) on the next navigation.
 *
 * Because we do not actually verify that the registrant owns the email
 * address, `emailVerifiedAt` in this build is a bookkeeping field, NOT a
 * proof of email ownership. The verification-token infrastructure
 * (`src/lib/auth/verification-tokens.ts`, `/api/auth/verify-email`,
 * `/verify-email` page, `User.emailVerifiedAt` column) is preserved so
 * that a future release can re-enable verification without schema
 * changes.
 *
 * Security trade-offs accepted for this MVP:
 *
 *   • Impersonation. Anyone who knows an email address can create an
 *     account in that address and obtain an authenticated session.
 *     Mitigations: 5/hr/IP rate limit; bcrypt-hashed passwords; same-
 *     origin `safeNext` redirect with no open-redirect surface; existing
 *     dashboard chokepoint (`requireUser`) is the only place
 *     `emailVerifiedAt` is checked, and is now uniformly "true" for
 *     fresh users.
 *
 *   • Account recovery. The only identity check for password reset is
 *     "knows the email address." Combined with the impersonation
 *     surface above, an attacker who registers a victim's address can
 *     later request a password-reset link that goes to the actual
 *     victim's inbox. The victim can still recover via the same
 *     mechanism (reset password by email).
 *
 * For the "email already exists" path we do NOT auto-login (we don't
 * know the user's password). We return a generic success message and
 * point the client at the login page so the UX is consistent.
 *
 * Auto-login implementation:
 *   We follow next-auth's own sign-in flow — GET /api/auth/csrf to
 *   obtain a CSRF token + cookie, then POST to
 *   /api/auth/callback/credentials with that token in the form body,
 *   and forward the resulting session cookie to the client in a JSON
 *   body that points the form at `next`. v5 cookie names are
 *   `authjs.csrf-token` and `authjs.session-token` (and the
 *   `__Secure-`-prefixed variants on HTTPS).
 */

const registerSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(1024),
  name: z.string().min(1).max(80).optional(),
  next: z.string().min(1).max(2048).optional(),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limit = rateLimit(`register:${ip}`, 5, 60 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many registration attempts. Please try again later." },
      { status: 429 }
    );
  }

  let body: z.infer<typeof registerSchema>;
  try {
    body = registerSchema.parse(await req.json());
  } catch {
    return NextResponse.json(
      { error: "Please provide a valid email and password." },
      { status: 400 }
    );
  }

  const email = body.email.toLowerCase();
  const passwordCheck = validatePassword(body.password);
  if (!passwordCheck.ok) {
    return NextResponse.json({ error: passwordCheck.message }, { status: 400 });
  }

  const next = safeNext(body.next);
  const origin = new URL(req.url).origin;
  const callbackUrl = new URL(next, origin).toString();

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    // Email enumeration guard: equalize response time and return a
    // non-revealing message that points the user at the sign-in page.
    await jitter(150, 350);
    return NextResponse.json({
      ok: true,
      redirectTo: `/login?next=${encodeURIComponent(next)}`,
    });
  }

  const passwordHash = await hashPassword(body.password);
  await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: body.name?.trim() || null,
      // MVP: email verification is disabled. We mark the account
      // "verified" at creation so `requireUser()` (the dashboard
      // chokepoint) admits the new user. This is a deliberate MVP
      // decision documented in the file header — it does NOT mean
      // email ownership has been verified.
      emailVerifiedAt: new Date(),
    },
  });

  // Step 1: fetch a CSRF token + cookie from next-auth.
  const csrfRes = await fetch(`${origin}/api/auth/csrf`, { cache: "no-store" });
  const csrfJson = (await csrfRes.json().catch(() => ({}))) as { csrfToken?: string };
  const csrfCookieRaw = pickSetCookie(readSetCookies(csrfRes.headers), "authjs.csrf-token");
  const csrfToken = csrfJson.csrfToken;
  if (!csrfToken || !csrfCookieRaw) {
    return NextResponse.json(
      { error: "Registration succeeded but auto-login failed. Please sign in." },
      { status: 500 }
    );
  }
  // We only need the `name=value` pair (no attributes) to replay the
  // cookie in the callback request. The `!` above guarantees a value.
  const csrfCookie: string = csrfCookieRaw.split(";")[0]!;

  // Step 2: POST to the credentials callback with the CSRF token in
  // both the cookie and the body (double-submit) so next-auth accepts
  // the request without an external browser roundtrip.
  const callbackRes = await fetch(
    `${origin}/api/auth/callback/credentials`,
    {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        cookie: csrfCookie,
      },
      body: new URLSearchParams({
        email,
        password: body.password,
        redirect: "false",
        callbackUrl,
        csrfToken,
      }).toString(),
      redirect: "manual",
      cache: "no-store",
    }
  );

  // next-auth sets the session cookie on the callback response. Forward
  // it (with all attributes intact) to the client alongside a JSON
  // success body that tells the register form where to navigate.
  const sessionSetCookie =
    pickSetCookie(readSetCookies(callbackRes.headers), "authjs.session-token") ??
    pickSetCookie(readSetCookies(callbackRes.headers), "__Secure-authjs.session-token");

  if (callbackRes.status >= 400 || !sessionSetCookie) {
    return NextResponse.json(
      { ok: true, redirectTo: `/login?next=${encodeURIComponent(next)}` },
      { status: 200 }
    );
  }

  const successRes = NextResponse.json({ ok: true, redirectTo: next });
  successRes.headers.append("set-cookie", sessionSetCookie);
  return successRes;
}
