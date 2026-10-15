import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/security/rate-limit";
import { FREE_LIMITS, planFor } from "@/lib/plans";
import { sendEmail, escapeHtml } from "@/lib/notifications/email";
import { appConfig } from "@/lib/app-config";
import { submissionSchema } from "@/lib/public/submission-schema";

/**
 * POST /api/public/[slug]/submit
 *
 * Public submission endpoint. Rate-limited per IP. The submitter email
 * is private; the testimonial is saved as "pending" and the owner is
 * notified by email. Email failure is logged but does NOT roll back the
 * submission.
 */

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ slug: string }> }
) {
  const { slug } = await ctx.params;
  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limit = rateLimit(`submit:${ip}:${slug}`, 5, 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many submissions. Please wait a minute and try again." },
      { status: 429 }
    );
  }

  const collection = await prisma.collection.findFirst({
    where: { slug, deletedAt: null },
    include: { user: { select: { id: true, email: true } } },
  });
  if (!collection) {
    // Don't reveal whether the slug exists; respond with 404 after a
    // comparable delay would be ideal, but for the MVP we accept the
    // enumeration risk on slug discovery (slugs are public anyway).
    return NextResponse.json({ error: "Collection not found." }, { status: 404 });
  }

  let payload: z.infer<typeof submissionSchema>;
  try {
    payload = submissionSchema.parse(await req.json());
  } catch (err) {
    const message = err instanceof z.ZodError ? err.issues[0]?.message : "Invalid input.";
    return NextResponse.json({ error: message ?? "Invalid input." }, { status: 400 });
  }

  // Plan limit check (PRD FR-PLAN-003 + grill Q2: hard-reject beyond 50).
  const [total, subscription] = await Promise.all([
    prisma.testimonial.count({
      where: { collection: { is: { userId: collection.userId, deletedAt: null } } },
    }),
    prisma.subscription.findFirst({ where: { userId: collection.userId } }),
  ]);
  const plan = planFor(subscription);
  if (plan === "free" && total >= FREE_LIMITS.maxTestimonials) {
    return NextResponse.json(
      {
        error:
          "This account has reached its Free-plan testimonial limit. Please contact the owner.",
      },
      { status: 403 }
    );
  }

  // Save the testimonial (transactional). The owner email is sent
  // AFTER the transaction commits; failure is logged but does not roll
  // back the saved row.
  const saved = await prisma.testimonial.create({
    data: {
      collectionId: collection.id,
      submitterName: payload.submitterName,
      submitterEmail: payload.submitterEmail.toLowerCase(),
      company: payload.company ?? null,
      role: payload.role ?? null,
      body: payload.body,
      rating: payload.rating,
      status: "pending",
    },
  });

  // Notify the owner (fire-and-forget).
  const reviewUrl = `${appConfig.appUrl}/dashboard/testimonials?collection=${collection.id}`;
  void sendEmail({
    to: collection.user.email,
    subject: `New testimonial pending review — ${collection.title}`,
    text:
      `${payload.submitterName} just submitted a testimonial to "${collection.title}".\n\n` +
      `Rating: ${payload.rating}/5\n` +
      `${payload.body}\n\n` +
      `Review: ${reviewUrl}`,
    html:
      `<p>${escapeHtml(payload.submitterName)} just submitted a testimonial to <strong>${escapeHtml(collection.title)}</strong>.</p>` +
      `<p>Rating: ${payload.rating}/5</p>` +
      `<blockquote style="border-left:3px solid #e5e7eb;padding-left:12px;color:#4b5563">${escapeHtml(payload.body)}</blockquote>` +
      `<p><a href="${escapeHtml(reviewUrl)}">Review now</a></p>`,
  });

  // Send submitter receipt.
  void sendEmail({
    to: saved.submitterEmail,
    subject: `Thanks for your testimonial to ${collection.title}`,
    text:
      `Thanks for submitting a testimonial to ${collection.title}!\n\n` +
      `The collection owner will review it before it appears publicly. We appreciate your time.`,
    html:
      `<p>Thanks for submitting a testimonial to <strong>${escapeHtml(collection.title)}</strong>!</p>` +
      `<p>The collection owner will review it before it appears publicly.</p>`,
  });

  return NextResponse.json({ ok: true, id: saved.id });
}
