"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireSessionUser } from "@/lib/auth";
import { insertGoal, updateGoal, deleteGoalRow, getGoal, type GoalInput } from "@/lib/goals";

export type GoalFormState = { error?: string } | undefined;

const emptyToNull = (v: unknown) => (v === "" ? null : v);

const goalSchema = z.object({
  name: z.string().trim().min(1, "Bitte einen Namen angeben."),
  category: z.string().trim().min(1),
  targetAmount: z.coerce.number().positive("Zielbetrag muss größer als 0 sein."),
  currentAmount: z.coerce.number().min(0, "Aktueller Betrag darf nicht negativ sein.").default(0),
  targetDate: z.preprocess(emptyToNull, z.string().nullable()),
  notes: z.preprocess(emptyToNull, z.string().nullable()),
});

function parseForm(formData: FormData) {
  return goalSchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category"),
    targetAmount: formData.get("targetAmount"),
    currentAmount: formData.get("currentAmount") || "0",
    targetDate: formData.get("targetDate"),
    notes: formData.get("notes"),
  });
}

export async function createGoalAction(
  _prevState: GoalFormState,
  formData: FormData
): Promise<GoalFormState> {
  const user = await requireSessionUser();
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  }

  await insertGoal(user.id, parsed.data as GoalInput);
  revalidatePath("/goals");
  revalidatePath("/home");
  return undefined;
}

export async function updateGoalAction(
  id: string,
  _prevState: GoalFormState,
  formData: FormData
): Promise<GoalFormState> {
  const user = await requireSessionUser();
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  }

  const existing = await getGoal(id, user.id);
  if (!existing) {
    return { error: "Ziel nicht gefunden." };
  }

  await updateGoal(id, user.id, parsed.data as GoalInput);
  revalidatePath("/goals");
  revalidatePath("/home");
  return undefined;
}

export async function deleteGoalAction(id: string) {
  const user = await requireSessionUser();
  await deleteGoalRow(id, user.id);
  revalidatePath("/goals");
  revalidatePath("/home");
}

export async function updateGoalProgressAction(id: string, currentAmount: number) {
  const user = await requireSessionUser();
  const existing = await getGoal(id, user.id);
  if (!existing) return;

  await updateGoal(id, user.id, {
    name: existing.name,
    category: existing.category,
    targetAmount: existing.target_amount,
    currentAmount: Math.max(0, currentAmount),
    targetDate: existing.target_date,
    notes: existing.notes,
  });
  revalidatePath("/goals");
  revalidatePath("/home");
}
