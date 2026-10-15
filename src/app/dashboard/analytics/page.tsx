import { requireUser } from "@/lib/auth/require-user";
import { prisma } from "@/lib/db";
import { TopBar } from "@/components/dashboard/top-bar";
import { StatCard, EmptyState } from "@/components/dashboard/stat-card";
import Link from "next/link";
import { subDays, format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const user = await requireUser();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const since = subDays(today, 29);

  // Status / rating aggregates need every testimonial for the user. The
  // 30-day trend only needs the last 30 days of submissions. Splitting
  // the queries keeps the 30-day bucket work bounded by 30 days of data
  // rather than the lifetime of the account (matters for Paid users
  // with unlimited testimonials).
  const [all, last30] = await Promise.all([
    prisma.testimonial.findMany({
      where: { collection: { is: { userId: user.id, deletedAt: null } } },
      select: { status: true, rating: true },
    }),
    prisma.testimonial.findMany({
      where: {
        collection: { is: { userId: user.id, deletedAt: null } },
        createdAt: { gte: since },
      },
      select: { createdAt: true },
    }),
  ]);
  const total = all.length;
  const pending = all.filter((t) => t.status === "pending").length;
  const approved = all.filter((t) => t.status === "approved").length;
  const rejected = all.filter((t) => t.status === "rejected").length;
  const averageRating = approved > 0
    ? all.filter((t) => t.status === "approved").reduce((a, t) => a + t.rating, 0) / approved
    : 0;

  // 30-day rolling trend
  const days: { date: string; count: number }[] = [];
  for (let i = 29; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dayStart = d.getTime();
    const dayEnd = dayStart + 24 * 60 * 60 * 1000;
    const count = last30.filter(
      (t) => t.createdAt.getTime() >= dayStart && t.createdAt.getTime() < dayEnd
    ).length;
    days.push({ date: format(d, "MMM d"), count });
  }
  const peak = days.reduce((m, d) => Math.max(m, d.count), 0);

  return (
    <>
      <TopBar
        title="Analytics"
        description="Testimonial counts, statuses, and submission trends."
      />
      <div className="space-y-6 p-4 sm:p-6">
        {total === 0 ? (
          <EmptyState
            title="No data yet"
            body="Once testimonials start coming in, you'll see counts, status breakdowns, and a 30-day trend here."
            action={
              <Link href="/dashboard/collections" className="inline-flex items-center justify-center rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
                Go to collections
              </Link>
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard label="Total" value={total} />
              <StatCard label="Approved" value={approved} tone="success" />
              <StatCard label="Pending" value={pending} tone={pending > 0 ? "warning" : "default"} />
              <StatCard label="Rejected" value={rejected} tone="danger" />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <StatCard
                label="Average rating (approved)"
                value={averageRating ? averageRating.toFixed(2) : "—"}
                hint="Across all approved testimonials."
              />
              <StatCard label="Peak day (30d)" value={peak} hint="Most submissions on a single day in the last 30 days." />
            </div>
            <section className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Submissions — last 30 days</h2>
              <div className="mt-4 flex h-40 items-end gap-1">
                {days.map((d) => {
                  const height = peak === 0 ? 0 : Math.max(2, (d.count / peak) * 100);
                  return (
                    <div key={d.date} className="group flex flex-1 flex-col items-center" title={`${d.date}: ${d.count} submission${d.count === 1 ? "" : "s"}`}>
                      <div className="w-full rounded-t bg-brand-500" style={{ height: `${height}%` }} />
                      <div className="mt-1 hidden text-[10px] text-gray-400 sm:block">{d.date}</div>
                    </div>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Hover a bar for the date and count.</p>
            </section>
          </>
        )}
      </div>
    </>
  );
}
