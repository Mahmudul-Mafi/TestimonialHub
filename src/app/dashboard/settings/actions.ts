"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/require-user";
import { hashPassword, verifyPassword, validatePassword } from "@/lib/auth/password";
import { signOut } from "@/lib/auth/auth";

const nameSchema = z.object({ name: z.string().max(80).optional() });
const passwordSchema = z.object({
  current: z.string().min(1).max(1024),
  next: z.string().min(1).max(1024),
});
const deleteSchema = z.object({ confirm: z.literal("delete my account") });

export interface SettingsState { ok: boolean; message?: string; }

export async function updateName(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  const user = await requireUser();
  const parsed = nameSchema.safeParse({ name: String(formData.get("name") ?? "").trim() || undefined });
  if (!parsed.success) return { ok: false, message: "Invalid name." };
  await prisma.user.update({
    where: { id: user.id },
    data: { name: parsed.data.name ?? null },
  });
  revalidatePath("/dashboard");
  return { ok: true, message: "Saved." };
}

export async function changePassword(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  const user = await requireUser();
  const parsed = passwordSchema.safeParse({
    current: String(formData.get("current") ?? ""),
    next: String(formData.get("next") ?? ""),
  });
  if (!parsed.success) return { ok: false, message: "Please fill in both fields." };
  if (parsed.data.current === parsed.data.next) {
    return { ok: false, message: "Your new password must be different from your current one." };
  }
  const passwordCheck = validatePassword(parsed.data.next);
  if (!passwordCheck.ok) return { ok: false, message: passwordCheck.message };
  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { passwordHash: true } });
  if (!dbUser) return { ok: false, message: "User not found." };
  const ok = await verifyPassword(parsed.data.current, dbUser.passwordHash);
  if (!ok) return { ok: false, message: "Current password is incorrect." };
  const newHash = await hashPassword(parsed.data.next);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: newHash, tokenVersion: { increment: 1 } },
  });
  return { ok: true, message: "Password updated. Other sessions have been signed out." };
}

export async function deleteAccount(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  const user = await requireUser();
  const parsed = deleteSchema.safeParse({ confirm: String(formData.get("confirm") ?? "") });
  if (!parsed.success) return { ok: false, message: "Type 'delete my account' to confirm." };
  // Soft-delete: mark deletedAt so the unique-email constraint can
  // be reused for re-registration. The webhook job will permanently
  // purge data after the retention window.
  await prisma.user.update({
    where: { id: user.id },
    data: { deletedAt: new Date(), tokenVersion: { increment: 1 } },
  });
  await signOut({ redirectTo: "/" });
  return { ok: true, message: "Account deleted." };
}
