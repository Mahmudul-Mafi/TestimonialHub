"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/require-user";
import { FREE_LIMITS, planFor } from "@/lib/plans";
import { generatePublicToken } from "@/lib/collections/slug";
import { getSubscriptionForUser } from "@/lib/collections/queries";

const createSchema = z.object({
  collectionId: z.string().min(1),
  layout: z.enum(["grid", "carousel"]).default("grid"),
  sortBy: z.enum(["newest", "highest_rating"]).default("newest"),
});

const updateSchema = createSchema.extend({
  id: z.string().min(1),
  isActive: z.enum(["true", "false"]).optional(),
});

const idSchema = z.object({ id: z.string().min(1) });

export interface WidgetState { ok: boolean; message?: string; }

export async function createWidget(_prev: WidgetState, formData: FormData): Promise<WidgetState> {
  const user = await requireUser();
  const parsed = createSchema.safeParse({
    collectionId: String(formData.get("collectionId") ?? ""),
    layout: String(formData.get("layout") ?? "grid"),
    sortBy: String(formData.get("sortBy") ?? "newest"),
  });
  if (!parsed.success) return { ok: false, message: "Invalid input." };
  const collection = await prisma.collection.findFirst({
    where: { id: parsed.data.collectionId, userId: user.id, deletedAt: null },
  });
  if (!collection) return { ok: false, message: "Collection not found." };

  const [active, subscription] = await Promise.all([
    prisma.widget.count({ where: { userId: user.id, isActive: true, collection: { deletedAt: null } } }),
    getSubscriptionForUser(user.id),
  ]);
  const plan = planFor(subscription);
  if (plan === "free" && active >= FREE_LIMITS.maxActiveWidgets) {
    return { ok: false, message: `You've reached the Free plan limit of ${FREE_LIMITS.maxActiveWidgets} active widgets. Deactivate an existing one or upgrade to Paid.` };
  }

  await prisma.widget.create({
    data: {
      userId: user.id,
      collectionId: collection.id,
      layout: parsed.data.layout,
      sortBy: parsed.data.sortBy,
      publicToken: generatePublicToken(),
      isActive: true,
    },
  });
  revalidatePath("/dashboard/widgets");
  return { ok: true, message: "Widget created." };
}

export async function updateWidget(_prev: WidgetState, formData: FormData): Promise<WidgetState> {
  const user = await requireUser();
  const parsed = updateSchema.safeParse({
    id: String(formData.get("id") ?? ""),
    collectionId: String(formData.get("collectionId") ?? ""),
    layout: String(formData.get("layout") ?? "grid"),
    sortBy: String(formData.get("sortBy") ?? "newest"),
    isActive: formData.has("isActive") ? String(formData.get("isActive")) : undefined,
  });
  if (!parsed.success) return { ok: false, message: "Invalid input." };
  const widget = await prisma.widget.findFirst({
    where: { id: parsed.data.id, userId: user.id },
  });
  if (!widget) return { ok: false, message: "Widget not found." };
  await prisma.widget.update({
    where: { id: widget.id },
    data: {
      layout: parsed.data.layout,
      sortBy: parsed.data.sortBy,
      isActive: parsed.data.isActive === "true",
    },
  });
  revalidatePath("/dashboard/widgets");
  return { ok: true, message: "Saved." };
}

export async function rotateWidgetToken(_prev: WidgetState, formData: FormData): Promise<WidgetState> {
  const user = await requireUser();
  const parsed = idSchema.safeParse({ id: String(formData.get("id") ?? "") });
  if (!parsed.success) return { ok: false, message: "Invalid id." };
  const widget = await prisma.widget.findFirst({ where: { id: parsed.data.id, userId: user.id } });
  if (!widget) return { ok: false, message: "Widget not found." };
  await prisma.widget.update({
    where: { id: widget.id },
    data: { publicToken: generatePublicToken() },
  });
  revalidatePath("/dashboard/widgets");
  return { ok: true, message: "Embed token rotated. Old iframes will stop loading." };
}

export async function deleteWidget(_prev: WidgetState, formData: FormData): Promise<WidgetState> {
  const user = await requireUser();
  const parsed = idSchema.safeParse({ id: String(formData.get("id") ?? "") });
  if (!parsed.success) return { ok: false, message: "Invalid id." };
  const widget = await prisma.widget.findFirst({ where: { id: parsed.data.id, userId: user.id } });
  if (!widget) return { ok: false, message: "Widget not found." };
  await prisma.widget.delete({ where: { id: widget.id } });
  revalidatePath("/dashboard/widgets");
  return { ok: true, message: "Widget deleted." };
}
