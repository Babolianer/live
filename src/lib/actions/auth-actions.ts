"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import {
  clearLoginAttempts,
  createSession,
  createUser,
  destroySession,
  DUMMY_PASSWORD_HASH,
  findUserByEmail,
  isLoginLocked,
  recordFailedLogin,
  verifyPassword,
} from "@/lib/auth";

export type AuthFormState = { error?: string } | undefined;

const signInSchema = z.object({
  email: z.string().email("Bitte eine gültige E-Mail-Adresse angeben."),
  password: z.string().min(1, "Bitte Passwort eingeben."),
});

const signUpSchema = z.object({
  name: z.string().trim().min(1, "Bitte Namen angeben."),
  email: z.string().email("Bitte eine gültige E-Mail-Adresse angeben."),
  password: z.string().min(8, "Passwort muss mindestens 8 Zeichen haben."),
});

export async function signInAction(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  }

  if (await isLoginLocked(parsed.data.email)) {
    return {
      error: "Zu viele fehlgeschlagene Versuche. Bitte warte 15 Minuten und versuche es erneut.",
    };
  }

  const user = await findUserByEmail(parsed.data.email);
  // Always run bcrypt, even for an unknown email, so response time doesn't
  // leak whether an account exists (dummy hash costs the same to compare).
  const valid = await verifyPassword(
    parsed.data.password,
    user?.password_hash ?? DUMMY_PASSWORD_HASH
  );

  if (!user || !valid) {
    await recordFailedLogin(parsed.data.email);
    return { error: "E-Mail oder Passwort ist falsch." };
  }

  await clearLoginAttempts(parsed.data.email);
  await createSession(user.id);
  redirect("/home");
}

export async function signUpAction(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = signUpSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  }

  const existing = await findUserByEmail(parsed.data.email);
  if (existing) {
    return { error: "Für diese E-Mail existiert bereits ein Konto." };
  }

  const userId = await createUser(
    parsed.data.email,
    parsed.data.password,
    parsed.data.name
  );
  await createSession(userId);
  redirect("/home");
}

export async function signOutAction() {
  await destroySession();
  redirect("/login");
}
