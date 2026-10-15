import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * GET /widgets/[token]/json
 *
 * Public JSON feed for an active widget. CORS is permissive because the
 * widget is meant to be embeddable cross-origin; the response contains
 * ONLY approved testimonials and strips submitter email.
 */

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const widget = await prisma.widget.findUnique({
    where: { publicToken: token },
    select: { id: true, isActive: true, sortBy: true, collectionId: true },
  });
  if (!widget || !widget.isActive) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const collection = await prisma.collection.findUnique({
    where: { id: widget.collectionId },
    select: { deletedAt: true, title: true, brandColor: true },
  });
  if (!collection || collection.deletedAt) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const testimonials = await prisma.testimonial.findMany({
    where: { collectionId: widget.collectionId, status: "approved" },
    orderBy:
      widget.sortBy === "highest_rating"
        ? [{ rating: "desc" }, { createdAt: "desc" }]
        : { createdAt: "desc" },
    select: {
      id: true,
      submitterName: true,
      company: true,
      role: true,
      body: true,
      rating: true,
      createdAt: true,
    },
  });
  return NextResponse.json(
    {
      title: collection.title,
      brandColor: collection.brandColor,
      testimonials: testimonials.map((t) => ({
        id: t.id,
        submitterName: t.submitterName,
        company: t.company,
        role: t.role,
        body: t.body,
        rating: t.rating,
        createdAt: t.createdAt.toISOString(),
      })),
    },
    {
      headers: {
        "cache-control": "public, max-age=60, s-maxage=60",
        "access-control-allow-origin": "*",
      },
    }
  );
}
