"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireSessionUser } from "@/lib/auth";
import { insertSavingsPlan, updateSavingsPlan, deleteSavingsPlan, type SavingsPlanInput } from "@/lib/wealth-savings-plans";
import { SAVINGS_PLAN_INTERVALS } from "@/lib/wealth-asset-constants";

export type WealthSavingsPlanFormState = { error?: string } | undefined;

const emptyToNull = (v: unknown) => (v === "" ? null : v);
const emptyToNullNumber = (v: unknown) => (v === "" || v === null || v === undefined ? null : v);

const planSchema = z.object({
  name: z.string().trim().min(1, "Bitte einen Namen angeben."),
  amount: z.coerce.number().positive("Betrag muss größer als 0 sein."),
  interval: z.enum(SAVINGS_PLAN_INTERVALS),
  startDate: z.string().trim().min(1, "Bitte ein Startdatum angeben."),
  endDate: z.preprocess(emptyToNull, z.string().nullable()),
  targetAssetId: z.string().trim().min(1, "Bitte ein Ziel-Asset wählen."),
  notes: z.preprocess(emptyToNull, z.string().nullable()),
  anchorDate: z.preprocess(emptyToNull, z.string().nullable()),
  anchorQuantity: z.preprocess(emptyToNullNumber, z.coerce.number().positive().nullable()),
});

function parseForm(formData: FormData) {
  return planSchema.safeParse({
    name: formData.get("name"),
    amount: formData.get("amount"),
    interval: formData.get("interval"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    targetAssetId: formData.get("targetAssetId"),
    notes: formData.get("notes"),
    anchorDate: formData.get("anchorDate"),
    anchorQuantity: formData.get("anchorQuantity"),
  });
}

export async function createSavingsPlanAction(_prevState: WealthSavingsPlanFormState, formData: FormData): Promise<WealthSavingsPlanFormState> {
  const user = await requireSessionUser();
  const parsed = parseForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };

  await insertSavingsPlan(user.id, parsed.data as SavingsPlanInput);
  revalidatePath("/wealth/sparplaene");
  revalidatePath("/wealth");
  return undefined;
}

export async function updateSavingsPlanAction(id: string, _prevState: WealthSavingsPlanFormState, formData: FormData): Promise<WealthSavingsPlanFormState> {
  const user = await requireSessionUser();
  const parsed = parseForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };

  await updateSavingsPlan(id, user.id, parsed.data as SavingsPlanInput);
  revalidatePath("/wealth/sparplaene");
  revalidatePath("/wealth");
  return undefined;
}

export async function deleteSavingsPlanAction(id: string) {
  const user = await requireSessionUser();
  await deleteSavingsPlan(id, user.id);
  revalidatePath("/wealth/sparplaene");
  revalidatePath("/wealth");
}
