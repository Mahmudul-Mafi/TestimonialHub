import { describe, it, expect, beforeEach, vi } from "vitest";

/**
 * Tests for the demo-subscription server helpers. The Prisma client is
 * mocked with an in-memory store so the helpers can be exercised
 * end-to-end without a real database.
 */

// ----- In-memory Prisma mock -----

interface MockSubscription {
  id: string;
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string | null;
  state: string;
  graceStartedAt: Date | null;
  graceEndsAt: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  priceId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionStore = new Map<string, MockSubscription>();
let nextIdCounter = 1;

function resetStore() {
  subscriptionStore.clear();
  nextIdCounter = 1;
}

function findByUserId(userId: string): MockSubscription | null {
  for (const sub of subscriptionStore.values()) {
    if (sub.userId === userId) return sub;
  }
  return null;
}

const prismaMock = {
  subscription: {
    findFirst: vi.fn(async ({ where }: { where: { userId: string } }) => {
      return findByUserId(where.userId);
    }),
    findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
      return subscriptionStore.get(where.id) ?? null;
    }),
    create: vi.fn(async ({ data }: { data: Omit<MockSubscription, "id" | "createdAt" | "updatedAt"> }) => {
      const id = `sub_${nextIdCounter++}`;
      const now = new Date();
      const created: MockSubscription = {
        ...data,
        id,
        createdAt: now,
        updatedAt: now,
      };
      subscriptionStore.set(id, created);
      return created;
    }),
    update: vi.fn(async ({ where, data }: { where: { id: string }; data: Partial<MockSubscription> }) => {
      const existing = subscriptionStore.get(where.id);
      if (!existing) throw new Error("not found");
      const updated: MockSubscription = {
        ...existing,
        ...data,
        updatedAt: new Date(),
      };
      subscriptionStore.set(where.id, updated);
      return updated;
    }),
  },
};

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));

// Import after the mock is registered.
const { upsertDemoSubscription, cancelDemoSubscription, getDemoSubscriptionView } =
  await import("@/lib/billing/demo-subscription");

// ----- Tests -----

describe("upsertDemoSubscription", () => {
  beforeEach(() => {
    resetStore();
    prismaMock.subscription.create.mockClear();
    prismaMock.subscription.update.mockClear();
    prismaMock.subscription.findFirst.mockClear();
  });

  it("returns ok=false and does not touch the DB on decline", async () => {
    const result = await upsertDemoSubscription({
      userId: "user_1",
      outcome: "decline",
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.message).toMatch(/declined/i);
    expect(subscriptionStore.size).toBe(0);
    expect(prismaMock.subscription.create).not.toHaveBeenCalled();
    expect(prismaMock.subscription.update).not.toHaveBeenCalled();
  });

  it("creates a new active subscription with synthesized demo IDs on success", async () => {
    const result = await upsertDemoSubscription({
      userId: "user_1",
      outcome: "success",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(subscriptionStore.size).toBe(1);
    const sub = [...subscriptionStore.values()][0]!;
    expect(sub.userId).toBe("user_1");
    expect(sub.stripeCustomerId).toMatch(/^demo_cus_[a-z0-9]+$/);
    expect(sub.stripeSubscriptionId).toMatch(/^demo_sub_[a-z0-9]+$/);
    expect(sub.state).toBe("active");
    expect(sub.priceId).toBe("price_demo_paid");
    expect(sub.currentPeriodEnd).toBeInstanceOf(Date);
    expect(sub.cancelAtPeriodEnd).toBe(false);
    expect(sub.graceStartedAt).toBeNull();
    expect(sub.graceEndsAt).toBeNull();
    // The synthesized IDs match the subscriptionId we returned.
    expect(sub.id).toBe(result.subscriptionId);
  });

  it("reuses the existing demo IDs when the user already has a demo row", async () => {
    await upsertDemoSubscription({ userId: "user_1", outcome: "success" });
    const firstSub = [...subscriptionStore.values()][0]!;
    const firstCustomerId = firstSub.stripeCustomerId;
    const firstSubscriptionId = firstSub.stripeSubscriptionId;
    expect(firstSub.id).toBeDefined();

    // Run again on the same user.
    const result = await upsertDemoSubscription({
      userId: "user_1",
      outcome: "success",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // No second row was created.
    expect(subscriptionStore.size).toBe(1);
    const sub = [...subscriptionStore.values()][0]!;
    expect(sub.id).toBe(firstSub.id);
    expect(sub.stripeCustomerId).toBe(firstCustomerId);
    expect(sub.stripeSubscriptionId).toBe(firstSubscriptionId);
  });
});

describe("cancelDemoSubscription", () => {
  beforeEach(() => {
    resetStore();
    prismaMock.subscription.create.mockClear();
    prismaMock.subscription.update.mockClear();
    prismaMock.subscription.findFirst.mockClear();
  });

  it("is idempotent when no subscription exists", async () => {
    const result = await cancelDemoSubscription({ userId: "user_1" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.alreadyAbsent).toBe(true);
    expect(result.message).toMatch(/no subscription/i);
    expect(prismaMock.subscription.update).not.toHaveBeenCalled();
  });

  it("sets state to cancelled on an active demo row", async () => {
    await upsertDemoSubscription({ userId: "user_1", outcome: "success" });
    const sub = [...subscriptionStore.values()][0]!;
    expect(sub.state).toBe("active");

    const result = await cancelDemoSubscription({ userId: "user_1" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.alreadyAbsent).toBe(false);
    const updated = subscriptionStore.get(sub.id)!;
    expect(updated.state).toBe("cancelled");
    expect(updated.currentPeriodEnd).toBeNull();
    expect(updated.cancelAtPeriodEnd).toBe(false);
  });

  it("refuses to cancel a non-demo subscription", async () => {
    // Insert a hand-crafted non-demo row.
    subscriptionStore.set("sub_real", {
      id: "sub_real",
      userId: "user_1",
      stripeCustomerId: "cus_real_abc",
      stripeSubscriptionId: "sub_real_abc",
      state: "active",
      graceStartedAt: null,
      graceEndsAt: null,
      currentPeriodEnd: new Date(),
      cancelAtPeriodEnd: false,
      priceId: "price_real_paid",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await cancelDemoSubscription({ userId: "user_1" });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.message).toMatch(/not a demo/i);
    const sub = subscriptionStore.get("sub_real")!;
    expect(sub.state).toBe("active");
  });
});

describe("getDemoSubscriptionView", () => {
  beforeEach(() => {
    resetStore();
  });

  it("returns null when the user has no subscription", async () => {
    const view = await getDemoSubscriptionView({ userId: "user_1" });
    expect(view).toBeNull();
  });

  it("marks a demo subscription as demo", async () => {
    await upsertDemoSubscription({ userId: "user_1", outcome: "success" });
    const view = await getDemoSubscriptionView({ userId: "user_1" });
    expect(view).not.toBeNull();
    expect(view?.isDemo).toBe(true);
    expect(view?.state).toBe("active");
    expect(view?.currentPeriodEnd).toBeInstanceOf(Date);
  });

  it("marks a non-demo subscription as not demo", async () => {
    subscriptionStore.set("sub_real", {
      id: "sub_real",
      userId: "user_1",
      stripeCustomerId: "cus_real_abc",
      stripeSubscriptionId: "sub_real_abc",
      state: "active",
      graceStartedAt: null,
      graceEndsAt: null,
      currentPeriodEnd: new Date(),
      cancelAtPeriodEnd: false,
      priceId: "price_real_paid",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const view = await getDemoSubscriptionView({ userId: "user_1" });
    expect(view?.isDemo).toBe(false);
  });
});