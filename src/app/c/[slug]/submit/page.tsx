import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { SubmitForm } from "./submit-form";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { MarketingFooter } from "@/components/marketing/marketing-footer";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = await prisma.collection.findFirst({
    where: { slug, deletedAt: null },
    select: { title: true },
  });
  return { title: c ? `Submit a testimonial to ${c.title}` : "Submit" };
}

export default async function SubmitPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const collection = await prisma.collection.findFirst({
    where: { slug, deletedAt: null },
    select: { id: true, title: true, brandColor: true },
  });
  if (!collection) notFound();
  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-gray-950">
      <MarketingHeader />
      <main className="flex-1 py-12">
        <div className="mx-auto max-w-xl px-4">
          <Link href={`/c/${slug}`} className="text-sm text-gray-500 hover:underline dark:text-gray-400">
            ← Back to {collection.title}
          </Link>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
            Submit a testimonial
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Your submission will be reviewed by the collection owner before it appears publicly.
          </p>
          <div className="mt-6">
            <SubmitForm slug={slug} brandColor={collection.brandColor} />
          </div>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
