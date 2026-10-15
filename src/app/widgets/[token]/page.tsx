import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { TestimonialCard } from "@/components/public/testimonial-card";
import { appConfig } from "@/lib/app-config";
import { getSubscriptionForUser } from "@/lib/collections/queries";
import { planFor } from "@/lib/plans";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const w = await prisma.widget.findUnique({
    where: { publicToken: token },
    select: { collection: { select: { title: true } } },
  });
  return { title: w ? `Testimonials — ${w.collection.title}` : "Testimonials" };
}

export default async function WidgetIframePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const widget = await prisma.widget.findUnique({
    where: { publicToken: token },
    include: { collection: true },
  });
  if (!widget || !widget.isActive || widget.collection.deletedAt) notFound();

  const testimonials = await prisma.testimonial.findMany({
    where: { collectionId: widget.collectionId, status: "approved" },
    orderBy:
      widget.sortBy === "highest_rating"
        ? [{ rating: "desc" }, { createdAt: "desc" }]
        : { createdAt: "desc" },
    select: {
      id: true,
      submitterName: true,
      company: true,
      role: true,
      body: true,
      rating: true,
      createdAt: true,
    },
  });

  const subscription = await getSubscriptionForUser(widget.collection.userId);
  const plan = planFor(subscription);

  return (
    <div className="min-h-screen bg-white p-4 dark:bg-gray-950" style={{ ["--brand" as never]: widget.collection.brandColor }}>
      <div className="mx-auto max-w-5xl">
        {testimonials.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
            No testimonials to display yet.
          </p>
        ) : widget.layout === "carousel" ? (
          <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
            {testimonials.map((t) => (
              <div key={t.id} className="w-80 flex-none snap-start">
                <TestimonialCard
                  testimonial={{
                    submitterName: t.submitterName,
                    company: t.company,
                    role: t.role,
                    body: t.body,
                    rating: t.rating,
                    createdAt: t.createdAt.toISOString(),
                  }}
                  brandColor={widget.collection.brandColor}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((t) => (
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
                brandColor={widget.collection.brandColor}
              />
            ))}
          </div>
        )}
        {plan === "free" ? (
          <p className="mt-6 text-center text-[10px] text-gray-400 dark:text-gray-500">
            Powered by{" "}
            <a href={appConfig.appUrl} className="hover:underline" target="_blank" rel="noopener noreferrer">
              TestimonialHub
            </a>
          </p>
        ) : null}
      </div>
    </div>
  );
}
