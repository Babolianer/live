"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireSessionUser } from "@/lib/auth";
import { insertExpense, updateExpense, deleteExpense, type ExpenseInput } from "@/lib/wealth-expenses";

export type WealthExpenseFormState = { error?: string } | undefined;

const expenseSchema = z.object({
  date: z.string().trim().min(1, "Bitte ein Datum angeben."),
  amount: z.coerce.number().positive("Betrag muss größer als 0 sein."),
  category: z.string().trim().min(1),
  type: z.enum(["INCOME", "EXPENSE"]),
  description: z.string().trim().min(1, "Bitte eine Beschreibung angeben."),
  isRecurring: z.coerce.boolean().default(false),
});

function parseForm(formData: FormData) {
  return expenseSchema.safeParse({
    date: formData.get("date"),
    amount: formData.get("amount"),
    category: formData.get("category"),
    type: formData.get("type"),
    description: formData.get("description"),
    isRecurring: formData.get("isRecurring") === "on" || formData.get("isRecurring") === "true",
  });
}

export async function createExpenseAction(_prevState: WealthExpenseFormState, formData: FormData): Promise<WealthExpenseFormState> {
  const user = await requireSessionUser();
  const parsed = parseForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };

  await insertExpense(user.id, parsed.data as ExpenseInput);
  revalidatePath("/wealth/ausgaben");
  return undefined;
}

export async function updateExpenseAction(id: string, _prevState: WealthExpenseFormState, formData: FormData): Promise<WealthExpenseFormState> {
  const user = await requireSessionUser();
  const parsed = parseForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };

  await updateExpense(id, user.id, parsed.data as ExpenseInput);
  revalidatePath("/wealth/ausgaben");
  return undefined;
}

export async function deleteExpenseAction(id: string) {
  const user = await requireSessionUser();
  await deleteExpense(id, user.id);
  revalidatePath("/wealth/ausgaben");
}
