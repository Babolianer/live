"use server";

import { revalidatePath } from "next/cache";
import { requireSessionUser } from "@/lib/auth";
import { query } from "@/lib/db";

export async function dismissOnboardingAction() {
  const user = await requireSessionUser();
  await query(`UPDATE users SET onboarding_dismissed = 1 WHERE id = ?`, [user.id]);
  revalidatePath("/home");
}
