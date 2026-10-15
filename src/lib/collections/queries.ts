import { prisma } from "@/lib/db";

/**
 * Centralized read helpers that ALWAYS filter by `userId`.
 *
 * Every protected route that touches tenant-owned data MUST go through
 * one of these helpers or include a `userId` filter of its own. This
 * module is the canonical location for the read pattern; controllers
 * MUST NOT construct raw Prisma queries that could accidentally widen
 * the filter.
 */

export async function listCollectionsForUser(userId: string) {
  return prisma.collection.findMany({
    where: { userId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { testimonials: true, widgets: true } },
    },
  });
}

export async function getCollectionForUser(userId: string, collectionId: string) {
  return prisma.collection.findFirst({
    where: { id: collectionId, userId, deletedAt: null },
  });
}

export async function getCollectionBySlug(slug: string) {
  return prisma.collection.findFirst({
    where: { slug, deletedAt: null },
    include: {
      user: { select: { id: true, name: true } },
    },
  });
}

export async function listTestimonialsForUser(
  userId: string,
  opts: { collectionId?: string; status?: string; page?: number; pageSize?: number } = {}
) {
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, opts.pageSize ?? 20));

  // Resolve the set of collection IDs owned by this user, optionally
  // restricted to a single collection.
  const collectionWhere: { userId: string; id?: string; deletedAt: null } = {
    userId,
    deletedAt: null,
  };
  if (opts.collectionId) collectionWhere.id = opts.collectionId;

  const where: {
    collection: { is: { userId: string; deletedAt: null } };
    collectionId?: string;
    status?: string;
  } = {
    collection: { is: { userId, deletedAt: null } },
  };
  if (opts.collectionId) where.collectionId = opts.collectionId;
  if (opts.status) where.status = opts.status;

  const [rows, total] = await Promise.all([
    prisma.testimonial.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        collection: { select: { id: true, title: true, slug: true } },
      },
    }),
    prisma.testimonial.count({ where }),
  ]);
  return { rows, total, page, pageSize };
}

export async function countTestimonialsForUser(userId: string): Promise<number> {
  return prisma.testimonial.count({
    where: { collection: { is: { userId, deletedAt: null } } },
  });
}

export async function listActiveWidgetsForUser(userId: string) {
  return prisma.widget.findMany({
    where: { userId, isActive: true, collection: { deletedAt: null } },
    include: { collection: { select: { id: true, title: true, slug: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getSubscriptionForUser(userId: string) {
  return prisma.subscription.findFirst({ where: { userId } });
}
