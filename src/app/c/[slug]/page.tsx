import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSubscriptionForUser } from "@/lib/collections/queries";
import { planFor } from "@/lib/plans";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { TestimonialCard } from "@/components/public/testimonial-card";
import { SubmitModal } from "./submit-modal";
import { appConfig } from "@/lib/app-config";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = await prisma.collection.findFirst({
    where: { slug, deletedAt: null },
    select: { title: true, description: true },
  });
  if (!c) return { title: "Not found" };
  return { title: c.title, description: c.description ?? undefined, robots: { index: true, follow: true } };
}

export default async function PublicCollectionPage({ params }: { params: Promise<{ slug: string }> }) {
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

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-gray-950" style={{ ["--brand" as never]: collection.brandColor }}>
      <MarketingHeader />
      <main className="flex-1">
        <section className="border-b border-gray-200 bg-gray-50 py-12 dark:border-gray-800 dark:bg-gray-900/50">
          <div className="mx-auto max-w-3xl px-4 text-center">
            <div
              className="mx-auto mb-4 h-12 w-12 rounded-full"
              style={{ backgroundColor: collection.brandColor }}
              aria-hidden="true"
            />
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl dark:text-white">
              {collection.title}
            </h1>
            {collection.description ? (
              <p className="mt-3 text-base text-gray-600 dark:text-gray-300">{collection.description}</p>
            ) : null}
            <div className="mt-6">
              <SubmitModal slug={collection.slug} brandColor={collection.brandColor} />
            </div>
          </div>
        </section>
        <section className="mx-auto max-w-5xl px-4 py-12">
          {collection.testimonials.length === 0 ? (
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              No testimonials have been published yet. Be the first!
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {collection.testimonials.map((t) => (
                <TestimonialCard
                  key={t.id}
                  testimonial={{
                    submitterName: t.submitterName,
                    company: t.company,
                    role: t.role,
                    body: t.body,
                    rating: t.rating,
                    createdAt: t.createdAt.toISOString(),
                  }}
                  brandColor={collection.brandColor}
                />
              ))}
            </div>
          )}
        </section>
      </main>
      <footer className="border-t border-gray-200 bg-white py-6 dark:border-gray-800 dark:bg-gray-950">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 px-4 text-xs text-gray-500 sm:flex-row dark:text-gray-400">
          <p>© {new Date().getFullYear()} {collection.title}.</p>
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
