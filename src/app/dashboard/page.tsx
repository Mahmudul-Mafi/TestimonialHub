import Link from "next/link";
import { requireUser } from "@/lib/auth/require-user";
import { prisma } from "@/lib/db";
import {
  listCollectionsForUser,
  listTestimonialsForUser,
  countTestimonialsForUser,
  listActiveWidgetsForUser,
  getSubscriptionForUser,
} from "@/lib/collections/queries";
import { TopBar } from "@/components/dashboard/top-bar";
import { StatCard, EmptyState } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function DashboardOverviewPage() {
  const user = await requireUser();
  const [collections, testimonials, totalCount, widgets, subscription] = await Promise.all([
    listCollectionsForUser(user.id),
    listTestimonialsForUser(user.id, { pageSize: 5 }),
    countTestimonialsForUser(user.id),
    listActiveWidgetsForUser(user.id),
    getSubscriptionForUser(user.id),
  ]);

  const pendingCount = await prisma.testimonial.count({
    where: { collection: { is: { userId: user.id, deletedAt: null } }, status: "pending" },
  });
  const approvedCount = await prisma.testimonial.count({
    where: { collection: { is: { userId: user.id, deletedAt: null } }, status: "approved" },
  });
  const rejectedCount = await prisma.testimonial.count({
    where: { collection: { is: { userId: user.id, deletedAt: null } }, status: "rejected" },
  });

  const hasCollection = collections.length > 0;

  return (
    <>
      <TopBar title={`Welcome back, ${user.name ?? "there"}`} description="Here's what's happening in your account." />
      <div className="space-y-6 p-4 sm:p-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Collections" value={collections.length} hint={`${2 - collections.length >= 0 ? 2 - collections.length : 0} free remaining`} />
          <StatCard label="Testimonials" value={totalCount} hint={`${50 - totalCount >= 0 ? 50 - totalCount : 0} free remaining`} />
          <StatCard label="Widgets" value={widgets.length} hint={`${2 - widgets.length >= 0 ? 2 - widgets.length : 0} free remaining`} />
          <StatCard label="Plan" value={subscription?.state === "active" ? "Paid" : "Free"} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Pending" value={pendingCount} tone={pendingCount > 0 ? "warning" : "default"} />
          <StatCard label="Approved" value={approvedCount} tone="success" />
          <StatCard label="Rejected" value={rejectedCount} tone="danger" />
        </div>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Recent testimonials</h2>
            <Link href="/dashboard/testimonials" className="text-sm text-brand-600 hover:underline">
              View all
            </Link>
          </div>
          {testimonials.rows.length === 0 ? (
            <EmptyState
              title="No testimonials yet"
              body={hasCollection ? "Share your public collection link to start collecting." : "Create your first collection to start collecting testimonials."}
              action={
                hasCollection ? (
                  collections[0] ? (
                    <Link
                      href={`/c/${collections[0].slug}/share`}
                      className="inline-flex items-center justify-center rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
                    >
                      Share your collection link
                    </Link>
                  ) : null
                ) : (
                  <Link
                    href="/dashboard/collections/new"
                    className="inline-flex items-center justify-center rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
                  >
                    Create a collection
                  </Link>
                )
              }
            />
          ) : (
            <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white dark:divide-gray-800 dark:border-gray-800 dark:bg-gray-900">
              {testimonials.rows.map((t) => (
                <li key={t.id} className="flex items-start gap-3 p-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-gray-900 dark:text-white">{t.submitterName}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">· {t.collection.title}</span>
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-sm text-gray-600 dark:text-gray-300">{t.body}</p>
                  </div>
                  <StatusBadge status={t.status} />
                </li>
              ))}
            </ul>
          )}
        </section>

        {hasCollection ? (
          <>
            <div className="rounded-lg border border-brand-200 bg-brand-50 p-4 text-sm text-brand-900 dark:border-brand-900 dark:bg-brand-950/40 dark:text-brand-100">
              <p className="font-medium">Share your collection</p>
              <p className="mt-1">
                Send submitters to{" "}
                <code className="rounded bg-white px-1.5 py-0.5 text-xs font-mono dark:bg-gray-900">
                  /c/{collections[0]?.slug}
                </code>{" "}
                or copy the embed code from a widget.
              </p>
            </div>
            {collections[0] ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-4 text-sm dark:border-gray-800 dark:bg-gray-900">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white">Wall of Love</p>
                  <p className="text-gray-600 dark:text-gray-300">
                    A public, embeddable wall of your approved testimonials. Open, share, or copy an iframe embed.
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Link
                    href={`/dashboard/collections/${collections[0].id}`}
                    className="rounded-md border border-gray-300 px-3 py-1.5 text-xs hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                  >
                    Manage
                  </Link>
                  <Link
                    href={`/wall/${collections[0].slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
                  >
                    Open Wall
                  </Link>
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <div className="flex items-center justify-between rounded-lg border border-dashed border-gray-300 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Start with your first collection</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Create one to share a public submission link.</p>
            </div>
            <Link href="/dashboard/collections/new">
              <Button>New collection</Button>
            </Link>
          </div>
        )}
      </div>
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200",
    approved: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200",
    rejected: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles[status] ?? "bg-gray-100 text-gray-800"}`}>
      {status}
    </span>
  );
}
