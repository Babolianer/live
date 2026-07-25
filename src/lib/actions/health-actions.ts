"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireSessionUser } from "@/lib/auth";
import { upsertHealthLog, deleteHealthLog, type HealthLogInput } from "@/lib/health";

export type HealthFormState = { error?: string } | undefined;

const emptyToNull = (v: unknown) => (v === "" ? null : v);

const healthSchema = z.object({
  logDate: z.string().trim().min(1, "Bitte ein Datum angeben."),
  steps: z.preprocess(emptyToNull, z.coerce.number().int().nonnegative().nullable()),
  waterLiters: z.preprocess(emptyToNull, z.coerce.number().nonnegative().nullable()),
  sleepHours: z.preprocess(emptyToNull, z.coerce.number().nonnegative().nullable()),
  workout: z.preprocess(emptyToNull, z.string().nullable()),
  notes: z.preprocess(emptyToNull, z.string().nullable()),
});

export async function saveHealthLogAction(
  _prevState: HealthFormState,
  formData: FormData
): Promise<HealthFormState> {
  const user = await requireSessionUser();
  const parsed = healthSchema.safeParse({
    logDate: formData.get("logDate"),
    steps: formData.get("steps"),
    waterLiters: formData.get("waterLiters"),
    sleepHours: formData.get("sleepHours"),
    workout: formData.get("workout"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };

  await upsertHealthLog(user.id, parsed.data as HealthLogInput);
  revalidatePath("/health");
  revalidatePath("/home");
  return undefined;
}

export async function deleteHealthLogAction(id: string) {
  const user = await requireSessionUser();
  await deleteHealthLog(id, user.id);
  revalidatePath("/health");
  revalidatePath("/home");
}
