"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireSessionUser } from "@/lib/auth";
import { insertDebt, updateDebt, deleteDebt, type WealthDebtInput } from "@/lib/wealth-finance";

export type WealthDebtFormState = { error?: string } | undefined;

const debtSchema = z.object({
  assetId: z.string().trim().min(1),
  name: z.string().trim().min(1, "Bitte einen Namen angeben."),
  originalAmount: z.coerce.number().nonnegative(),
  remainingAmount: z.coerce.number().nonnegative(),
  interestRate: z.coerce.number().nonnegative(),
  monthlyPayment: z.coerce.number().nonnegative(),
  startDate: z.string().trim().min(1, "Bitte ein Startdatum angeben."),
});

function parseForm(formData: FormData) {
  return debtSchema.safeParse({
    assetId: formData.get("assetId"),
    name: formData.get("name"),
    originalAmount: formData.get("originalAmount"),
    remainingAmount: formData.get("remainingAmount"),
    interestRate: formData.get("interestRate"),
    monthlyPayment: formData.get("monthlyPayment"),
    startDate: formData.get("startDate"),
  });
}

export async function createDebtAction(_prevState: WealthDebtFormState, formData: FormData): Promise<WealthDebtFormState> {
  const user = await requireSessionUser();
  const parsed = parseForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };

  const input = parsed.data as WealthDebtInput;
  await insertDebt(user.id, input);
  revalidatePath(`/wealth/assets/${input.assetId}`);
  revalidatePath("/wealth");
  return undefined;
}

export async function updateDebtAction(id: string, _prevState: WealthDebtFormState, formData: FormData): Promise<WealthDebtFormState> {
  const user = await requireSessionUser();
  const parsed = parseForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };

  const input = parsed.data as WealthDebtInput;
  await updateDebt(id, user.id, input);
  revalidatePath(`/wealth/assets/${input.assetId}`);
  revalidatePath("/wealth");
  return undefined;
}

export async function deleteDebtAction(id: string, assetId: string) {
  const user = await requireSessionUser();
  await deleteDebt(id, user.id);
  revalidatePath(`/wealth/assets/${assetId}`);
  revalidatePath("/wealth");
}
