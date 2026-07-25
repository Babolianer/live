"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  requireSessionUser,
  findUserByEmail,
  findUserById,
  updateUserProfile,
  updateUserPassword,
  deleteUserAccount,
  verifyPassword,
  destroySession,
} from "@/lib/auth";

export type SettingsFormState = { error?: string; success?: string } | undefined;

const profileSchema = z.object({
  name: z.string().trim().min(1, "Bitte einen Namen angeben."),
  email: z.string().email("Bitte eine gültige E-Mail-Adresse angeben."),
});

export async function updateProfileAction(
  _prevState: SettingsFormState,
  formData: FormData
): Promise<SettingsFormState> {
  const user = await requireSessionUser();
  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };

  const existing = await findUserByEmail(parsed.data.email);
  if (existing && existing.id !== user.id) {
    return { error: "Diese E-Mail wird bereits von einem anderen Konto verwendet." };
  }

  await updateUserProfile(user.id, parsed.data.name, parsed.data.email);
  revalidatePath("/settings");
  return { success: "Profil aktualisiert." };
}

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Bitte aktuelles Passwort angeben."),
    newPassword: z.string().min(8, "Neues Passwort muss mindestens 8 Zeichen haben."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Die neuen Passwörter stimmen nicht überein.",
    path: ["confirmPassword"],
  });

export async function changePasswordAction(
  _prevState: SettingsFormState,
  formData: FormData
): Promise<SettingsFormState> {
  const user = await requireSessionUser();
  const parsed = passwordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };

  const fullUser = await findUserById(user.id);
  if (!fullUser) return { error: "Konto nicht gefunden." };

  const valid = await verifyPassword(parsed.data.currentPassword, fullUser.password_hash);
  if (!valid) return { error: "Aktuelles Passwort ist falsch." };

  await updateUserPassword(user.id, parsed.data.newPassword);
  return { success: "Passwort geändert." };
}

const deleteSchema = z.object({
  password: z.string().min(1, "Bitte Passwort zur Bestätigung angeben."),
});

export async function deleteAccountAction(
  _prevState: SettingsFormState,
  formData: FormData
): Promise<SettingsFormState> {
  const user = await requireSessionUser();
  const parsed = deleteSchema.safeParse({ password: formData.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };

  const fullUser = await findUserById(user.id);
  if (!fullUser) return { error: "Konto nicht gefunden." };

  const valid = await verifyPassword(parsed.data.password, fullUser.password_hash);
  if (!valid) return { error: "Passwort ist falsch." };

  await destroySession();
  await deleteUserAccount(user.id);
  redirect("/login");
}
