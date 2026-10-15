import { requireUser } from "@/lib/auth/require-user";
import { listCollectionsForUser } from "@/lib/collections/queries";
import { TopBar } from "@/components/dashboard/top-bar";

export const dynamic = "force-dynamic";

export default async function ExportPage() {
  const user = await requireUser();
  const collections = await listCollectionsForUser(user.id);
  return (
    <>
      <TopBar
        title="Export"
        description="Download your testimonials as CSV. Formulas in submitted text are neutralized."
      />
      <div className="space-y-4 p-4 sm:p-6">
        <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Choose a collection</h2>
          {collections.length === 0 ? (
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">You don&apos;t have any collections yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-gray-200 dark:divide-gray-800">
              {collections.map((c) => (
                <li key={c.id} className="flex items-center justify-between py-3">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{c.title}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{c._count.testimonials} testimonials</div>
                  </div>
                  <a
                    href={`/api/export/${c.id}`}
                    className="inline-flex items-center justify-center rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                  >
                    Download CSV
                  </a>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            CSV exports include testimonial content, submitter name, company, role, rating, status, and submission date. Submitter email is intentionally excluded (FR-EXP-005). Cells starting with `=`, `+`, `-`, `@`, tab, or carriage return are prefixed with a single quote to prevent formula injection in spreadsheet apps.
          </p>
        </div>
      </div>
    </>
  );
}
