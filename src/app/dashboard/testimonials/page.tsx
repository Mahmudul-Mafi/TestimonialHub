import Link from "next/link";
import { requireUser } from "@/lib/auth/require-user";
import { listTestimonialsForUser, listCollectionsForUser } from "@/lib/collections/queries";
import { TopBar } from "@/components/dashboard/top-bar";
import { EmptyState } from "@/components/dashboard/stat-card";
import { TestimonialRow } from "./row";

export const dynamic = "force-dynamic";

const STATUS_TABS: { key: string; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

export default async function TestimonialsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; collection?: string; page?: string }>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  const status = sp.status && ["pending", "approved", "rejected"].includes(sp.status) ? (sp.status as "pending" | "approved" | "rejected") : undefined;
  const collectionId = sp.collection;
  const page = Number(sp.page ?? "1") || 1;

  const [collections, data] = await Promise.all([
    listCollectionsForUser(user.id),
    listTestimonialsForUser(user.id, { status, collectionId, page, pageSize: 20 }),
  ]);
  const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize));

  return (
    <>
      <TopBar
        title="Testimonials"
        description="Review submissions and decide which to publish."
      />
      <div className="space-y-4 p-4 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          {STATUS_TABS.map((t) => {
            const isActive = (t.key === "all" && !status) || t.key === status;
            const href = t.key === "all"
              ? `/dashboard/testimonials${collectionId ? `?collection=${collectionId}` : ""}`
              : `/dashboard/testimonials?status=${t.key}${collectionId ? `&collection=${collectionId}` : ""}`;
            return (
              <Link
                key={t.key}
                href={href}
                className={
                  isActive
                    ? "rounded-full bg-brand-600 px-3 py-1 text-xs font-medium text-white"
                    : "rounded-full border border-gray-300 bg-white px-3 py-1 text-xs text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
                }
              >
                {t.label}
              </Link>
            );
          })}
          {collections.length > 0 ? (
            <form className="ml-auto flex items-center gap-2 text-sm">
              <label htmlFor="collection-filter" className="text-gray-600 dark:text-gray-400">Collection:</label>
              <select
                id="collection-filter"
                name="collection"
                defaultValue={collectionId ?? ""}
                className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              >
                <option value="">All</option>
                {collections.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
              {status ? <input type="hidden" name="status" value={status} /> : null}
              <button type="submit" className="rounded-md border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">
                Apply
              </button>
            </form>
          ) : null}
        </div>

        {data.rows.length === 0 ? (
          <EmptyState
            title={collections.length === 0 ? "No collections yet" : "No testimonials in this view"}
            body={collections.length === 0 ? "Create a collection first." : "Try a different filter, or wait for new submissions."}
            action={
              collections.length === 0 ? (
                <Link href="/dashboard/collections/new" className="inline-flex items-center justify-center rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
                  Create a collection
                </Link>
              ) : null
            }
          />
        ) : (
          <ul className="space-y-3">
            {data.rows.map((t) => (
              <li key={t.id}>
                <TestimonialRow testimonial={{
                  id: t.id,
                  submitterName: t.submitterName,
                  submitterEmail: t.submitterEmail,
                  company: t.company,
                  role: t.role,
                  body: t.body,
                  rating: t.rating,
                  status: t.status,
                  createdAt: t.createdAt.toISOString(),
                  collection: t.collection,
                }} />
              </li>
            ))}
          </ul>
        )}

        {totalPages > 1 ? (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">
              Page {page} of {totalPages} ({data.total} total)
            </span>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 7).map((p) => (
                <Link
                  key={p}
                  href={`/dashboard/testimonials?page=${p}${status ? `&status=${status}` : ""}${collectionId ? `&collection=${collectionId}` : ""}`}
                  className={
                    p === page
                      ? "rounded-md bg-brand-600 px-3 py-1 text-white"
                      : "rounded-md border border-gray-300 px-3 py-1 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                  }
                >
                  {p}
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
