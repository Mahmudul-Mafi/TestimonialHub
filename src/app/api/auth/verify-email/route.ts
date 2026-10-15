import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { consumeVerificationToken } from "@/lib/auth/verification-tokens";

/**
 * GET /api/auth/verify-email?token=...
 *
 * PRD §3.1: opening a link with GET MUST NOT consume the token. The
 * token is consumed only when the user explicitly clicks the "Confirm"
 * button on the landing page (which POSTs to /api/auth/verify-email).
 *
 * This GET route simply displays a confirmation page; the POST does
 * the actual write.
 */

const PAGE = (status: "ok" | "invalid" | "expired" | "used" | "missing", rawToken?: string) => {
  const messages: Record<typeof status, { title: string; body: string }> = {
    ok: { title: "Email verified", body: "Thanks! Your email is now verified." },
    invalid: {
      title: "Verification link invalid",
      body: "This link is not valid. Please request a new one.",
    },
    expired: {
      title: "Verification link expired",
      body: "This link has expired. Please request a new one.",
    },
    used: {
      title: "Verification link already used",
      body: "This link has already been used. If your account is verified, you can sign in.",
    },
    missing: {
      title: "Verification link missing",
      body: "This page expects a token in the URL.",
    },
  };
  const m = messages[status];
  const safeToken = rawToken ? encodeURIComponent(rawToken) : "";
  return new NextResponse(
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${m.title} · TestimonialHub</title>
    <style>
      body { font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
             max-width: 480px; margin: 80px auto; padding: 0 20px; text-align: center; color: #1f2937; }
      h1 { font-size: 1.5rem; margin-bottom: 1rem; }
      p  { color: #4b5563; }
      .btn { display: inline-block; margin-top: 1.5rem; padding: 0.6rem 1.2rem;
             background: #4f46e5; color: white; border-radius: 6px; text-decoration: none; }
      form { display: inline; }
      button { background: #4f46e5; color: white; border: 0; border-radius: 6px;
               padding: 0.6rem 1.2rem; font: inherit; cursor: pointer; }
    </style>
  </head>
  <body>
    <h1>${m.title}</h1>
    <p>${m.body}</p>
    ${
      status === "missing"
        ? `<p><a class="btn" href="/login">Back to sign in</a></p>`
        : ""
    }
    ${
      rawToken && status !== "ok"
        ? `<form method="POST" action="/api/auth/verify-email">
             <input type="hidden" name="token" value="${safeToken}" />
             <button type="submit">I clicked this link from my email — confirm verification</button>
           </form>
           <p style="font-size:0.8rem; margin-top:1rem; color:#6b7280;">Only click the button if you reached this page by clicking the link in your verification email.</p>`
        : ""
    }
    ${status === "ok" ? `<p><a class="btn" href="/login">Sign in</a></p>` : ""}
  </body>
</html>`,
    { status: 200, headers: { "content-type": "text/html; charset=utf-8" } }
  );
};

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return PAGE("missing");
  // GET is purely informational; do not consume.
  return PAGE("invalid", token);
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const token = String(form.get("token") ?? "");
  if (!token) return PAGE("missing");

  const result = await consumeVerificationToken(token, "email_verification");
  if (!result.ok) {
    const map: Record<typeof result.code, "invalid" | "expired" | "used"> = {
      not_found: "invalid",
      expired: "expired",
      already_used: "used",
    };
    return PAGE(map[result.code]);
  }

  // Mark the user verified and bump tokenVersion so that any pre-existing
  // session is invalidated.
  const user = await prisma.user.update({
    where: { email: result.identifier },
    data: { emailVerifiedAt: new Date() },
    select: { id: true },
  });
  await prisma.user.update({
    where: { id: user.id },
    data: { tokenVersion: { increment: 1 } },
  });

  return PAGE("ok");
}
