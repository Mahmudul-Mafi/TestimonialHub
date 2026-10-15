import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth/require-user";
import { prisma } from "@/lib/db";
import { TopBar } from "@/components/dashboard/top-bar";
import { EditCollectionForm } from "./edit-form";
import { DeleteCollectionForm } from "./delete-form";
import { WallEmbedCode } from "./wall-embed";
import { appConfig } from "@/lib/app-config";

export const dynamic = "force-dynamic";

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const collection = await prisma.collection.findFirst({
    where: { id, userId: user.id, deletedAt: null },
    include: { _count: { select: { testimonials: true, widgets: true } } },
  });
  if (!collection) notFound();

  const publicUrl = `${appConfig.appUrl}/c/${collection.slug}`;
  const wallUrl = `${appConfig.appUrl}/wall/${collection.slug}`;

  return (
    <>
      <TopBar
        title={collection.title}
        description={collection.description ?? "Manage this collection."}
      />
      <div className="space-y-6 p-4 sm:p-6">
        <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Public page</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Share this link so people can submit testimonials.</p>
          <div className="mt-3 flex items-center gap-2">
            <code className="flex-1 truncate rounded bg-gray-100 px-2 py-1.5 font-mono text-xs dark:bg-gray-800">{publicUrl}</code>
            <Link
              href={`/c/${collection.slug}`}
              target="_blank"
              className="rounded-md border border-gray-300 px-3 py-1.5 text-xs hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
            >
              Open
            </Link>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Wall of Love</h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                A public, embeddable wall of your approved testimonials. Every review has a stable direct link.
              </p>
            </div>
            <Link
              href={`/wall/${collection.slug}`}
              target="_blank"
              data-testid="wall-open-link"
              className="shrink-0 rounded-md border border-gray-300 px-3 py-1.5 text-xs hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
            >
              Open
            </Link>
          </div>
          <div className="mt-4">
            <WallEmbedCode wallUrl={wallUrl} />
          </div>
        </div>

        <EditCollectionForm
          collection={{
            id: collection.id,
            title: collection.title,
            description: collection.description ?? "",
            slug: collection.slug,
            brandColor: collection.brandColor,
            theme: collection.theme as "light" | "dark" | "auto",
          }}
        />

        <div className="rounded-lg border border-red-200 bg-red-50 p-5 dark:border-red-900 dark:bg-red-950/30">
          <h2 className="text-sm font-semibold text-red-900 dark:text-red-100">Danger zone</h2>
          <p className="mt-1 text-sm text-red-800 dark:text-red-200">
            Deleting this collection permanently removes its {collection._count.testimonials} testimonials and {collection._count.widgets} widgets. The public page will stop working immediately.
          </p>
          <div className="mt-4">
            <DeleteCollectionForm id={collection.id} />
          </div>
        </div>
      </div>
    </>
  );
}
