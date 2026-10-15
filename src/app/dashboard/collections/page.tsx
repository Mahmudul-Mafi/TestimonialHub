import Link from "next/link";
import { requireUser } from "@/lib/auth/require-user";
import { listCollectionsForUser, getSubscriptionForUser } from "@/lib/collections/queries";
import { planFor, FREE_LIMITS } from "@/lib/plans";
import { TopBar } from "@/components/dashboard/top-bar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/dashboard/stat-card";
import { appConfig } from "@/lib/app-config";

export const dynamic = "force-dynamic";

export default async function CollectionsPage() {
  const user = await requireUser();
  const [collections, subscription] = await Promise.all([
    listCollectionsForUser(user.id),
    getSubscriptionForUser(user.id),
  ]);
  const plan = planFor(subscription);
  const atLimit = plan === "free" && collections.length >= FREE_LIMITS.maxCollections;

  return (
    <>
      <TopBar
        title="Collections"
        description="Group testimonials by project, customer segment, or audience."
      />
      <div className="space-y-6 p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {collections.length} of {plan === "paid" ? "∞" : FREE_LIMITS.maxCollections} collections
          </p>
          <Link href={atLimit ? "/dashboard/billing" : "/dashboard/collections/new"}>
            <Button disabled={atLimit}>{atLimit ? "Limit reached" : "New collection"}</Button>
          </Link>
        </div>
        {collections.length === 0 ? (
          <EmptyState
            title="No collections yet"
            body="Create your first collection to start collecting testimonials. Each collection has its own public URL and moderation queue."
            action={
              <Link href="/dashboard/collections/new">
                <Button>Create your first collection</Button>
              </Link>
            }
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((c) => (
              <Link
                key={c.id}
                href={`/dashboard/collections/${c.id}`}
                className="group block rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:border-brand-400 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-brand-700"
              >
                <div className="flex items-center gap-2">
                  <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: c.brandColor }} />
                  <h3 className="font-medium text-gray-900 dark:text-white">{c.title}</h3>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
                  {c.description || "No description."}
                </p>
                <div className="mt-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono dark:bg-gray-800">
                    /c/{c.slug}
                  </code>
                  <span>
                    {c._count.testimonials} testimonials · {c._count.widgets} widgets
                  </span>
                </div>
                <div className="mt-3 hidden text-xs text-brand-600 group-hover:block dark:text-brand-400">
                  Public URL: {appConfig.appUrl}/c/{c.slug}
                </div>
                <div className="mt-2 flex items-center gap-3 text-xs">
                  <Link
                    href={`/wall/${c.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-600 hover:underline"
                  >
                    Wall of Love →
                  </Link>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
