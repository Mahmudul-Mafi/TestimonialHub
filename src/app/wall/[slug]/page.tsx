import { notFound } from "next/navigation";
import Link from "next/link";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { appConfig } from "@/lib/app-config";
import { getSubscriptionForUser } from "@/lib/collections/queries";
import { planFor } from "@/lib/plans";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { WallOfLoveTestimonialCard } from "@/components/public/wall-testimonial-card";

export const dynamic = "force-dynamic";

/**
 * Resolve the canonical base URL for this request.
 *
 * The page renders deep links of the form
 *   <baseUrl>/wall/<slug>#review-<testimonialId>
 * which are written into each card's "Copy review link" copy target.
 *
 * We prefer the `x-forwarded-proto` + `host` headers when behind a
 * proxy so the URL matches the user's actual origin (the configured
 * `appConfig.appUrl` is used as a fallback). This is the same pattern
 * used by the widget iframe page.
 */
async function resolveBaseUrl(): Promise<string> {
  try {
    const h = await headers();
    const proto = h.get("x-forwarded-proto") ?? "https";
    const host = h.get("x-forwarded-host") ?? h.get("host");
    if (host) return `${proto}://${host}`;
  } catch {
    // headers() can throw outside a request context; fall through.
  }
  return appConfig.appUrl;
}

/**
 * Wall of Love — a public, embeddable page that lists every approved
 * testimonial for a collection with a direct review anchor.
 *
 * Privacy / data safety:
 *   • The query restricts `status: "approved"` and the collection is
 *     fetched with `deletedAt: null`. Pending and rejected testimonials
 *     are NEVER returned.
 *   • The Prisma `select` does NOT include `submitterEmail` — the
 *     submitter's email is structurally absent from this page's
 *     data flow. The serialization test (`tests/unit/wall-of-love.test.ts`)
 *     asserts this is never exposed.
 *   • Tenant isolation: the collection is queried by its unique
 *     `slug`; there is no `userId` exposure, no other tenant's
 *     collection is reachable.
 *
 * Embedding:
 *   • The page is intentionally framed as a public, embeddable wall.
 *   • No X-Frame-Options / CSP `frame-ancestors` is set on this route,
 *     so any site can iframe it.
 *
 * Routing:
 *   • /wall/[slug]            → list of approved testimonials
 *   • /wall/[slug]#review-{id} → scrolls to and highlights a specific
 *                                approved review.
 */
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = await prisma.collection.findFirst({
    where: { slug, deletedAt: null },
    select: { title: true, description: true },
  });
  if (!c) return { title: "Wall of Love — not found", robots: { index: false, follow: false } };
  return {
    title: `${c.title} — Wall of Love`,
    description: c.description ?? `Real customer testimonials for ${c.title}.`,
    openGraph: {
      title: `${c.title} — Wall of Love`,
      description: c.description ?? `Real customer testimonials for ${c.title}.`,
      type: "website",
    },
    twitter: { card: "summary_large_image", title: `${c.title} — Wall of Love` },
    robots: { index: true, follow: true },
  };
}

export default async function WallOfLovePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const collection = await prisma.collection.findFirst({
    where: { slug, deletedAt: null },
    include: {
      testimonials: {
        where: { status: "approved" },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          submitterName: true,
          company: true,
          role: true,
          body: true,
          rating: true,
          createdAt: true,
        },
      },
    },
  });
  if (!collection) notFound();

  const subscription = await getSubscriptionForUser(collection.userId);
  const plan = planFor(subscription);
  const showBranding = plan === "free";
  const baseUrl = await resolveBaseUrl();
  const wallUrl = `${baseUrl}/wall/${collection.slug}`;

  return (
    <div
      className="flex min-h-screen flex-col bg-white dark:bg-gray-950"
      style={{ ["--brand" as never]: collection.brandColor }}
    >
      <MarketingHeader />
      <main className="flex-1">
        <section
          className="border-b border-gray-200 bg-gray-50 py-10 dark:border-gray-800 dark:bg-gray-900/50"
          aria-labelledby="wall-title"
        >
          <div className="mx-auto max-w-5xl px-4 text-center">
            <div
              className="mx-auto mb-4 h-12 w-12 rounded-full"
              style={{ backgroundColor: collection.brandColor }}
              aria-hidden="true"
            />
            <h1
              id="wall-title"
              className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl dark:text-white"
            >
              {collection.title} — Wall of Love
            </h1>
            {collection.description ? (
              <p className="mt-3 text-base text-gray-600 dark:text-gray-300">
                {collection.description}
              </p>
            ) : null}
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {collection.testimonials.length} approved{" "}
              {collection.testimonials.length === 1 ? "testimonial" : "testimonials"}
            </p>
          </div>
        </section>

        <section
          className="mx-auto max-w-5xl px-4 py-10"
          aria-label="Approved testimonials"
        >
          {collection.testimonials.length === 0 ? (
            <p className="rounded-lg border border-dashed border-gray-300 bg-white px-4 py-12 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
              No testimonials have been published yet. Check back soon!
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {collection.testimonials.map((t) => (
                <WallOfLoveTestimonialCard
                  key={t.id}
                  testimonial={{
                    id: t.id,
                    submitterName: t.submitterName,
                    company: t.company,
                    role: t.role,
                    body: t.body,
                    rating: t.rating,
                    createdAt: t.createdAt.toISOString(),
                  }}
                  brandColor={collection.brandColor}
                  baseUrl={wallUrl}
                />
              ))}
            </div>
          )}
        </section>
      </main>
      <footer className="border-t border-gray-200 bg-white py-6 dark:border-gray-800 dark:bg-gray-950">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 px-4 text-xs text-gray-500 sm:flex-row dark:text-gray-400">
          <p>
            © {new Date().getFullYear()} {collection.title} · Wall of Love
          </p>
          {showBranding ? (
            <p>
              Powered by{" "}
              <Link href={appConfig.appUrl} className="text-brand-600 hover:underline">
                TestimonialHub
              </Link>
            </p>
          ) : (
            <Link href={appConfig.appUrl} className="hover:underline">
              Powered by TestimonialHub
            </Link>
          )}
        </div>
      </footer>
    </div>
  );
}