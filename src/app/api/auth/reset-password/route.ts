import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword, validatePassword } from "@/lib/auth/password";
import { consumeVerificationToken } from "@/lib/auth/verification-tokens";
import { rateLimit } from "@/lib/security/rate-limit";

/**
 * POST /api/auth/reset-password
 *
 * Body: { token, password }
 * Consumes the reset token, then sets the new password and bumps
 * tokenVersion (invalidates all existing sessions).
 */

const schema = z.object({
  token: z.string().min(16).max(256),
  password: z.string().min(1).max(1024),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limit = rateLimit(`reset-confirm:${ip}`, 10, 60 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429 }
    );
  }

  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const passwordCheck = validatePassword(body.password);
  if (!passwordCheck.ok) {
    return NextResponse.json({ error: passwordCheck.message }, { status: 400 });
  }

  const result = await consumeVerificationToken(body.token, "password_reset");
  if (!result.ok) {
    return NextResponse.json(
      { error: "This reset link is invalid or has expired." },
      { status: 400 }
    );
  }

  const passwordHash = await hashPassword(body.password);
  await prisma.user.update({
    where: { email: result.identifier },
    data: { passwordHash, tokenVersion: { increment: 1 } },
    select: { id: true },
  });

  return NextResponse.json({ ok: true });
}
