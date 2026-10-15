import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { prisma } from "@/lib/db";
import { toCsv } from "@/lib/security/csv";

/**
 * GET /api/export/[collectionId]
 *
 * Streams a CSV of all testimonials in the collection. Authorized by
 * requireUser + ownership filter. Submitter email is never included.
 */

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ collectionId: string }> }) {
  const { collectionId } = await ctx.params;
  const user = await requireUser();
  const collection = await prisma.collection.findFirst({
    where: { id: collectionId, userId: user.id, deletedAt: null },
  });
  if (!collection) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const testimonials = await prisma.testimonial.findMany({
    where: { collectionId: collection.id },
    orderBy: { createdAt: "desc" },
  });

  const header = ["id", "submitterName", "company", "role", "rating", "status", "body", "createdAt"];
  const rows: (string | number | null)[][] = [header];
  for (const t of testimonials) {
    rows.push([
      t.id,
      t.submitterName,
      t.company ?? "",
      t.role ?? "",
      t.rating,
      t.status,
      t.body,
      t.createdAt.toISOString(),
    ]);
  }
  const csv = toCsv(rows);
  const filename = `testimonialhub-${collection.slug}-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store",
    },
  });
}
