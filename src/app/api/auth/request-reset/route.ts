import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createVerificationToken } from "@/lib/auth/verification-tokens";
import { sendEmail, escapeHtml } from "@/lib/notifications/email";
import { rateLimit } from "@/lib/security/rate-limit";
import { jitter } from "@/lib/security/constant-time";
import { appConfig } from "@/lib/app-config";

/**
 * POST /api/auth/request-reset
 *
 * Body: { email }
 * Always returns the same generic message; sleep on the unknown-email
 * path to equalize timing.
 */

const schema = z.object({ email: z.string().email().max(254) });

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limit = rateLimit(`reset:${ip}`, 10, 60 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Please provide a valid email." }, { status: 400 });
  }
  const email = body.email.toLowerCase();

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.deletedAt) {
    await jitter(150, 350);
    return NextResponse.json({
      ok: true,
      message:
        "If that email belongs to an account, we just sent a password-reset link.",
    });
  }

  const { raw } = await createVerificationToken({
    identifier: user.email,
    purpose: "password_reset",
  });
  const resetUrl = `${appConfig.appUrl}/reset-password?token=${encodeURIComponent(raw)}`;

  void sendEmail({
    to: user.email,
    subject: "Reset your TestimonialHub password",
    text:
      `Someone (hopefully you) requested a password reset for your TestimonialHub account.\n\n` +
      `Open this link to choose a new password:\n${resetUrl}\n\n` +
      `This link expires in 1 hour. If you didn't request this, you can ignore this email.`,
    html:
      `<p>Someone (hopefully you) requested a password reset for your TestimonialHub account.</p>` +
      `<p><a href="${escapeHtml(resetUrl)}">${escapeHtml(resetUrl)}</a></p>` +
      `<p>This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>`,
  });

  return NextResponse.json({
    ok: true,
    message:
      "If that email belongs to an account, we just sent a password-reset link.",
  });
}
