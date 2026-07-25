"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireSessionUser } from "@/lib/auth";
import { insertSavingsGoal, updateSavingsGoal, deleteSavingsGoal, type SavingsGoalInput } from "@/lib/wealth-savings-goals";
import { ASSET_TYPES } from "@/lib/wealth-asset-constants";

export type WealthSavingsGoalFormState = { error?: string } | undefined;

const goalSchema = z.object({
  name: z.string().trim().min(1, "Bitte einen Namen angeben."),
  targetType: z.enum(ASSET_TYPES),
  targetAmount: z.coerce.number().positive("Zielbetrag muss größer als 0 sein."),
  monthlyContribution: z.coerce.number().nonnegative(),
  unitLabel: z.string().trim().min(1).default("EUR"),
});

function parseForm(formData: FormData) {
  return goalSchema.safeParse({
    name: formData.get("name"),
    targetType: formData.get("targetType"),
    targetAmount: formData.get("targetAmount"),
    monthlyContribution: formData.get("monthlyContribution"),
    unitLabel: formData.get("unitLabel") || "EUR",
  });
}

export async function createSavingsGoalAction(_prevState: WealthSavingsGoalFormState, formData: FormData): Promise<WealthSavingsGoalFormState> {
  const user = await requireSessionUser();
  const parsed = parseForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };

  await insertSavingsGoal(user.id, parsed.data as SavingsGoalInput);
  revalidatePath("/wealth/ziele");
  revalidatePath("/wealth");
  return undefined;
}

export async function updateSavingsGoalAction(id: string, _prevState: WealthSavingsGoalFormState, formData: FormData): Promise<WealthSavingsGoalFormState> {
  const user = await requireSessionUser();
  const parsed = parseForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };

  await updateSavingsGoal(id, user.id, parsed.data as SavingsGoalInput);
  revalidatePath("/wealth/ziele");
  revalidatePath("/wealth");
  return undefined;
}

export async function deleteSavingsGoalAction(id: string) {
  const user = await requireSessionUser();
  await deleteSavingsGoal(id, user.id);
  revalidatePath("/wealth/ziele");
  revalidatePath("/wealth");
}
