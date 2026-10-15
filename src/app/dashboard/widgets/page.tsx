import { requireUser } from "@/lib/auth/require-user";
import { prisma } from "@/lib/db";
import { listCollectionsForUser, getSubscriptionForUser } from "@/lib/collections/queries";
import { planFor, FREE_LIMITS } from "@/lib/plans";
import { TopBar } from "@/components/dashboard/top-bar";
import { EmptyState } from "@/components/dashboard/stat-card";
import { WidgetRow, NewWidgetForm } from "./widgets-client";
import { appConfig } from "@/lib/app-config";

export const dynamic = "force-dynamic";

export default async function WidgetsPage() {
  const user = await requireUser();
  const [collections, subscription, widgets] = await Promise.all([
    listCollectionsForUser(user.id),
    getSubscriptionForUser(user.id),
    prisma.widget.findMany({
      where: { userId: user.id, collection: { deletedAt: null } },
      include: { collection: { select: { id: true, title: true, slug: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  const plan = planFor(subscription);
  const activeCount = widgets.filter((w) => w.isActive).length;
  const atLimit = plan === "free" && activeCount >= FREE_LIMITS.maxActiveWidgets;

  return (
    <>
      <TopBar
        title="Widgets"
        description="Embeddable grid and carousel widgets for any site."
      />
      <div className="space-y-6 p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {activeCount} of {plan === "paid" ? "∞" : FREE_LIMITS.maxActiveWidgets} active widgets
          </p>
        </div>

        {collections.length === 0 ? (
          <EmptyState
            title="Create a collection first"
            body="Widgets display testimonials from a single collection."
          />
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Create widget</h2>
            <div className="mt-3">
              <NewWidgetForm collections={collections.map((c) => ({ id: c.id, title: c.title }))} atLimit={atLimit} />
            </div>
          </div>
        )}

        {widgets.length === 0 ? (
          <EmptyState title="No widgets yet" body="Create your first widget above to get an iframe embed snippet." />
        ) : (
          <ul className="space-y-3">
            {widgets.map((w) => (
              <li key={w.id}>
                <WidgetRow
                  widget={{
                    id: w.id,
                    collectionId: w.collectionId,
                    collectionTitle: w.collection.title,
                    collectionSlug: w.collection.slug,
                    layout: w.layout as "grid" | "carousel",
                    sortBy: w.sortBy as "newest" | "highest_rating",
                    isActive: w.isActive,
                    publicToken: w.publicToken,
                  }}
                  appUrl={appConfig.appUrl}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
