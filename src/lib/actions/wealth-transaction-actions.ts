"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireSessionUser } from "@/lib/auth";
import { addTransaction, updateTransaction, deleteTransaction } from "@/lib/wealth-finance";

export type WealthTransactionFormState = { error?: string } | undefined;

const emptyToNull = (v: unknown) => (v === "" ? null : v);

const transactionSchema = z.object({
  type: z.enum(["BUY", "SELL"]),
  quantity: z.coerce.number().positive("Menge muss größer als 0 sein."),
  pricePerUnit: z.coerce.number().nonnegative(),
  date: z.string().trim().min(1, "Bitte ein Datum angeben."),
  notes: z.preprocess(emptyToNull, z.string().nullable()),
});

function parseForm(formData: FormData) {
  return transactionSchema.safeParse({
    type: formData.get("type"),
    quantity: formData.get("quantity"),
    pricePerUnit: formData.get("pricePerUnit"),
    date: formData.get("date"),
    notes: formData.get("notes"),
  });
}

export async function createTransactionAction(
  assetId: string,
  _prevState: WealthTransactionFormState,
  formData: FormData
): Promise<WealthTransactionFormState> {
  const user = await requireSessionUser();
  const parsed = parseForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };

  try {
    await addTransaction(user.id, assetId, {
      type: parsed.data.type,
      quantity: parsed.data.quantity,
      pricePerUnit: parsed.data.pricePerUnit,
      date: new Date(parsed.data.date).toISOString(),
      notes: parsed.data.notes,
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Transaktion fehlgeschlagen." };
  }

  revalidatePath(`/wealth/assets/${assetId}`);
  revalidatePath("/wealth");
  revalidatePath("/wealth/vermoegen");
  return undefined;
}

export async function updateTransactionAction(
  id: string,
  assetId: string,
  _prevState: WealthTransactionFormState,
  formData: FormData
): Promise<WealthTransactionFormState> {
  const user = await requireSessionUser();
  const parsed = parseForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };

  try {
    await updateTransaction(id, user.id, {
      type: parsed.data.type,
      quantity: parsed.data.quantity,
      pricePerUnit: parsed.data.pricePerUnit,
      date: new Date(parsed.data.date).toISOString(),
      notes: parsed.data.notes,
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Transaktion fehlgeschlagen." };
  }

  revalidatePath(`/wealth/assets/${assetId}`);
  revalidatePath("/wealth");
  revalidatePath("/wealth/vermoegen");
  return undefined;
}

export async function deleteTransactionAction(id: string, assetId: string) {
  const user = await requireSessionUser();
  await deleteTransaction(id, user.id);
  revalidatePath(`/wealth/assets/${assetId}`);
  revalidatePath("/wealth");
  revalidatePath("/wealth/vermoegen");
}
