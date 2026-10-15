"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/require-user";
import { FREE_LIMITS, planFor } from "@/lib/plans";
import { validateSlug } from "@/lib/security/slug";
import { getSubscriptionForUser } from "@/lib/collections/queries";

const createSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().max(2000).optional().or(z.literal("")),
  slug: z.string().min(1).max(40),
  brandColor: z.string().regex(/^#([0-9a-fA-F]{6})$/).default("#4f46e5"),
  theme: z.enum(["light", "dark", "auto"]).default("auto"),
});

const updateSchema = createSchema.extend({
  id: z.string().min(1),
});

const deleteSchema = z.object({ id: z.string().min(1), confirm: z.literal("delete") });

export interface ActionState {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
}

export async function createCollection(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = createSchema.safeParse({
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    brandColor: String(formData.get("brandColor") ?? "#4f46e5"),
    theme: String(formData.get("theme") ?? "auto"),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "");
      if (key) fieldErrors[key] = issue.message;
    }
    return { ok: false, message: "Please fix the highlighted fields.", fieldErrors };
  }
  const slugCheck = validateSlug(parsed.data.slug);
  if (!slugCheck.ok) {
    return { ok: false, message: slugCheck.message, fieldErrors: { slug: slugCheck.message } };
  }

  // Plan limit check
  const [existing, subscription] = await Promise.all([
    prisma.collection.count({ where: { userId: user.id, deletedAt: null } }),
    getSubscriptionForUser(user.id),
  ]);
  const plan = planFor(subscription);
  if (plan === "free" && existing >= FREE_LIMITS.maxCollections) {
    return {
      ok: false,
      message: `You've reached the Free plan limit of ${FREE_LIMITS.maxCollections} collections. Delete an existing collection or upgrade to Paid.`,
    };
  }

  // Uniqueness check
  const dup = await prisma.collection.findUnique({ where: { slug: slugCheck.slug } });
  if (dup) {
    return { ok: false, message: "This slug is already taken. Please pick a different one.", fieldErrors: { slug: "This slug is already taken." } };
  }

  await prisma.collection.create({
    data: {
      userId: user.id,
      title: parsed.data.title.trim(),
      description: parsed.data.description?.trim() || null,
      slug: slugCheck.slug,
      brandColor: parsed.data.brandColor,
      theme: parsed.data.theme,
    },
  });

  revalidatePath("/dashboard/collections");
  revalidatePath("/dashboard");
  redirect("/dashboard/collections");
}

export async function updateCollection(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = updateSchema.safeParse({
    id: String(formData.get("id") ?? ""),
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    brandColor: String(formData.get("brandColor") ?? "#4f46e5"),
    theme: String(formData.get("theme") ?? "auto"),
  });
  if (!parsed.success) {
    return { ok: false, message: "Please fix the highlighted fields." };
  }
  const slugCheck = validateSlug(parsed.data.slug);
  if (!slugCheck.ok) {
    return { ok: false, message: slugCheck.message, fieldErrors: { slug: slugCheck.message } };
  }
  const existing = await prisma.collection.findFirst({
    where: { id: parsed.data.id, userId: user.id, deletedAt: null },
  });
  if (!existing) {
    return { ok: false, message: "Collection not found." };
  }
  const dup = await prisma.collection.findFirst({
    where: { slug: slugCheck.slug, NOT: { id: parsed.data.id } },
  });
  if (dup) {
    return { ok: false, message: "This slug is already taken.", fieldErrors: { slug: "This slug is already taken." } };
  }
  await prisma.collection.update({
    where: { id: existing.id },
    data: {
      title: parsed.data.title.trim(),
      description: parsed.data.description?.trim() || null,
      slug: slugCheck.slug,
      brandColor: parsed.data.brandColor,
      theme: parsed.data.theme,
    },
  });
  revalidatePath("/dashboard/collections");
  revalidatePath(`/dashboard/collections/${existing.id}`);
  revalidatePath(`/c/${existing.slug}`);
  return { ok: true, message: "Saved." };
}

export async function deleteCollection(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = deleteSchema.safeParse({
    id: String(formData.get("id") ?? ""),
    confirm: String(formData.get("confirm") ?? ""),
  });
  if (!parsed.success) {
    return { ok: false, message: "Type 'delete' to confirm." };
  }
  const existing = await prisma.collection.findFirst({
    where: { id: parsed.data.id, userId: user.id, deletedAt: null },
  });
  if (!existing) return { ok: false, message: "Collection not found." };
  // Soft-delete + cascade testimonials and widgets via FK ON DELETE CASCADE.
  await prisma.collection.update({
    where: { id: existing.id },
    data: { deletedAt: new Date() },
  });
  revalidatePath("/dashboard/collections");
  revalidatePath("/dashboard");
  redirect("/dashboard/collections");
}
