"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireSessionUser } from "@/lib/auth";
import {
  insertWealthEntry,
  updateWealthEntry,
  deleteWealthEntry,
  getWealthEntry,
  type WealthEntryInput,
} from "@/lib/wealth";

export type WealthFormState = { error?: string } | undefined;

const emptyToNull = (v: unknown) => (v === "" ? null : v);

const wealthSchema = z.object({
  name: z.string().trim().min(1, "Bitte einen Namen angeben."),
  category: z.string().trim().min(1),
  value: z.coerce.number(),
  notes: z.preprocess(emptyToNull, z.string().nullable()),
});

function parseForm(formData: FormData) {
  return wealthSchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category"),
    value: formData.get("value"),
    notes: formData.get("notes"),
  });
}

export async function createWealthEntryAction(
  _prevState: WealthFormState,
  formData: FormData
): Promise<WealthFormState> {
  const user = await requireSessionUser();
  const parsed = parseForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };

  await insertWealthEntry(user.id, parsed.data as WealthEntryInput);
  revalidatePath("/wealth");
  revalidatePath("/home");
  return undefined;
}

export async function updateWealthEntryAction(
  id: string,
  _prevState: WealthFormState,
  formData: FormData
): Promise<WealthFormState> {
  const user = await requireSessionUser();
  const parsed = parseForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };

  const existing = await getWealthEntry(id, user.id);
  if (!existing) return { error: "Eintrag nicht gefunden." };

  await updateWealthEntry(id, user.id, parsed.data as WealthEntryInput);
  revalidatePath("/wealth");
  revalidatePath("/home");
  return undefined;
}

export async function deleteWealthEntryAction(id: string) {
  const user = await requireSessionUser();
  await deleteWealthEntry(id, user.id);
  revalidatePath("/wealth");
  revalidatePath("/home");
}
