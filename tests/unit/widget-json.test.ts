import { describe, it, expect, beforeEach, vi } from "vitest";

/**
 * Tests for the public widget JSON feed. The Prisma client is mocked so
 * the route handler can be exercised end-to-end without a real database.
 *
 * The privacy properties tested here are the contract: the feed MUST NOT
 * leak submitter email, internal status, or non-approved testimonials.
 */

interface MockWidget {
  id: string;
  isActive: boolean;
  sortBy: string;
  collectionId: string;
}

interface MockCollection {
  id: string;
  deletedAt: Date | null;
  title: string;
  brandColor: string;
}

interface MockTestimonial {
  id: string;
  collectionId: string;
  status: string;
  submitterName: string;
  submitterEmail: string;
  company: string | null;
  role: string | null;
  body: string;
  rating: number;
  createdAt: Date;
}

const widgets = new Map<string, MockWidget>();
const collections = new Map<string, MockCollection>();
const testimonials = new Map<string, MockTestimonial>();

function seedWidgetWithTestimonials(opts?: {
  widgetActive?: boolean;
  includePending?: boolean;
  includeRejected?: boolean;
  ratings?: number[];
  collectionDeleted?: boolean;
}) {
  const collectionId = "col_1";
  collections.set(collectionId, {
    id: collectionId,
    deletedAt: opts?.collectionDeleted ? new Date() : null,
    title: "Sample",
    brandColor: "#4f46e5",
  });
  widgets.set("tok_1", {
    id: "w_1",
    isActive: opts?.widgetActive ?? true,
    sortBy: "newest",
    collectionId,
  });
  const ratings = opts?.ratings ?? [5, 4, 3, 2, 1];
  ratings.forEach((r, i) => {
    const id = `t_${i + 1}`;
    testimonials.set(id, {
      id,
      collectionId,
      status: "approved",
      submitterName: `User ${i + 1}`,
      submitterEmail: `private${i + 1}@example.com`,
      company: `Co ${i + 1}`,
      role: `Role ${i + 1}`,
      body: `Body ${i + 1}`,
      rating: r,
      createdAt: new Date(2024, 0, i + 1),
    });
  });
  if (opts?.includePending) {
    const id = `t_pending`;
    testimonials.set(id, {
      id,
      collectionId,
      status: "pending",
      submitterName: "Pending User",
      submitterEmail: "pending@example.com",
      company: null,
      role: null,
      body: "Pending body",
      rating: 1,
      createdAt: new Date(2024, 0, 99),
    });
  }
  if (opts?.includeRejected) {
    const id = `t_rejected`;
    testimonials.set(id, {
      id,
      collectionId,
      status: "rejected",
      submitterName: "Rejected User",
      submitterEmail: "rejected@example.com",
      company: null,
      role: null,
      body: "Rejected body",
      rating: 1,
      createdAt: new Date(2024, 0, 100),
    });
  }
}

const prismaMock = {
  widget: {
    findUnique: vi.fn(async ({ where }: { where: { publicToken: string } }) => {
      return widgets.get(where.publicToken) ?? null;
    }),
  },
  collection: {
    findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
      return collections.get(where.id) ?? null;
    }),
  },
  testimonial: {
    findMany: vi.fn(
      async ({
        where,
        orderBy,
        select,
      }: {
        where: { collectionId: string; status: string };
        orderBy?: unknown;
        select?: Record<string, boolean>;
      }) => {
        void select;
        void orderBy;
        const all = Array.from(testimonials.values()).filter(
          (t) => t.collectionId === where.collectionId && t.status === where.status
        );
        return all;
      }
    ),
  },
};

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));

// Import after the mock is registered.
const { GET } = await import("@/app/widgets/[token]/json/route");

beforeEach(() => {
  widgets.clear();
  collections.clear();
  testimonials.clear();
  prismaMock.widget.findUnique.mockClear();
  prismaMock.collection.findUnique.mockClear();
  prismaMock.testimonial.findMany.mockClear();
});

async function callJson(token: string) {
  const res = await GET(new Request("http://localhost/"), {
    params: Promise.resolve({ token }),
  });
  return res;
}

describe("widgets/[token]/json", () => {
  it("returns only approved testimonials", async () => {
    seedWidgetWithTestimonials({ includePending: true, includeRejected: true });
    const res = await callJson("tok_1");
    const body = await res.json();
    expect(body.testimonials).toHaveLength(5);
    for (const t of body.testimonials) {
      expect(t).not.toHaveProperty("submitterEmail");
      expect(t).not.toHaveProperty("status");
    }
  });

  it("never exposes submitter email addresses", async () => {
    seedWidgetWithTestimonials({ ratings: [5, 4, 3, 2, 1] });
    const res = await callJson("tok_1");
    const body = await res.json();
    const serialized = JSON.stringify(body);
    expect(serialized).not.toContain("private");
    expect(serialized).not.toContain("@example.com");
  });

  it("includes the rating on every testimonial", async () => {
    seedWidgetWithTestimonials({ ratings: [5, 4, 3, 2, 1] });
    const res = await callJson("tok_1");
    const body = await res.json();
    expect(body.testimonials.map((t: { rating: number }) => t.rating)).toEqual([5, 4, 3, 2, 1]);
  });

  it("preserves CORS permissive header for cross-origin embedding", async () => {
    seedWidgetWithTestimonials();
    const res = await callJson("tok_1");
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
  });

  it("returns 404 for an unknown token", async () => {
    const res = await callJson("tok_does_not_exist");
    expect(res.status).toBe(404);
  });

  it("returns 404 for an inactive widget", async () => {
    seedWidgetWithTestimonials({ widgetActive: false });
    const res = await callJson("tok_1");
    expect(res.status).toBe(404);
  });

  it("returns 404 when the underlying collection is soft-deleted", async () => {
    seedWidgetWithTestimonials({ collectionDeleted: true });
    const res = await callJson("tok_1");
    expect(res.status).toBe(404);
  });
});
