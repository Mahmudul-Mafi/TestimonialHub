"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/require-user";

const idSchema = z.object({ id: z.string().min(1) });

async function loadOwnedTestimonial(userId: string, id: string) {
  return prisma.testimonial.findFirst({
    where: { id, collection: { is: { userId, deletedAt: null } } },
  });
}

export interface ModerationState {
  ok: boolean;
  message?: string;
}

export async function approveTestimonial(
  _prev: ModerationState,
  formData: FormData
): Promise<ModerationState> {
  const user = await requireUser();
  const parsed = idSchema.safeParse({ id: String(formData.get("id") ?? "") });
  if (!parsed.success) return { ok: false, message: "Invalid id." };
  const t = await loadOwnedTestimonial(user.id, parsed.data.id);
  if (!t) return { ok: false, message: "Testimonial not found." };
  await prisma.testimonial.update({
    where: { id: t.id },
    data: { status: "approved", approvedAt: new Date(), approvedBy: user.id, rejectedAt: null, rejectedBy: null },
  });
  revalidatePath("/dashboard/testimonials");
  revalidatePath("/dashboard");
  revalidatePath(`/c/${t.collectionId}`);
  return { ok: true, message: "Approved." };
}

export async function rejectTestimonial(
  _prev: ModerationState,
  formData: FormData
): Promise<ModerationState> {
  const user = await requireUser();
  const parsed = idSchema.safeParse({ id: String(formData.get("id") ?? "") });
  if (!parsed.success) return { ok: false, message: "Invalid id." };
  const t = await loadOwnedTestimonial(user.id, parsed.data.id);
  if (!t) return { ok: false, message: "Testimonial not found." };
  await prisma.testimonial.update({
    where: { id: t.id },
    data: { status: "rejected", rejectedAt: new Date(), rejectedBy: user.id, approvedAt: null, approvedBy: null },
  });
  revalidatePath("/dashboard/testimonials");
  revalidatePath("/dashboard");
  return { ok: true, message: "Rejected." };
}

export async function deleteTestimonial(
  _prev: ModerationState,
  formData: FormData
): Promise<ModerationState> {
  const user = await requireUser();
  const parsed = idSchema.safeParse({ id: String(formData.get("id") ?? "") });
  if (!parsed.success) return { ok: false, message: "Invalid id." };
  const t = await loadOwnedTestimonial(user.id, parsed.data.id);
  if (!t) return { ok: false, message: "Testimonial not found." };
  await prisma.testimonial.delete({ where: { id: t.id } });
  revalidatePath("/dashboard/testimonials");
  revalidatePath("/dashboard");
  return { ok: true, message: "Deleted." };
}

export async function reReviewTestimonial(
  _prev: ModerationState,
  formData: FormData
): Promise<ModerationState> {
  const user = await requireUser();
  const parsed = idSchema.safeParse({ id: String(formData.get("id") ?? "") });
  if (!parsed.success) return { ok: false, message: "Invalid id." };
  const t = await loadOwnedTestimonial(user.id, parsed.data.id);
  if (!t) return { ok: false, message: "Testimonial not found." };
  await prisma.testimonial.update({
    where: { id: t.id },
    data: { status: "pending", approvedAt: null, approvedBy: null, rejectedAt: null, rejectedBy: null },
  });
  revalidatePath("/dashboard/testimonials");
  return { ok: true, message: "Moved back to Pending." };
}
