"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireSessionUser } from "@/lib/auth";
import {
  insertProperty,
  updateProperty,
  deleteProperty,
  getProperty,
  type PropertyInput,
} from "@/lib/properties";

export type PropertyFormState = { error?: string } | undefined;

const emptyToNull = (v: unknown) => (v === "" ? null : v);

const propertySchema = z.object({
  name: z.string().trim().min(1, "Bitte einen Namen angeben."),
  address: z.preprocess(emptyToNull, z.string().nullable()),
  purchaseDate: z.preprocess(emptyToNull, z.string().nullable()),
  value: z.preprocess(emptyToNull, z.coerce.number().nonnegative().nullable()),
  documentId: z.preprocess(emptyToNull, z.string().nullable()),
  notes: z.preprocess(emptyToNull, z.string().nullable()),
});

function parseForm(formData: FormData) {
  return propertySchema.safeParse({
    name: formData.get("name"),
    address: formData.get("address"),
    purchaseDate: formData.get("purchaseDate"),
    value: formData.get("value"),
    documentId: formData.get("documentId"),
    notes: formData.get("notes"),
  });
}

export async function createPropertyAction(
  _prevState: PropertyFormState,
  formData: FormData
): Promise<PropertyFormState> {
  const user = await requireSessionUser();
  const parsed = parseForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };

  await insertProperty(user.id, parsed.data as PropertyInput);
  revalidatePath("/properties");
  revalidatePath("/home");
  return undefined;
}

export async function updatePropertyAction(
  id: string,
  _prevState: PropertyFormState,
  formData: FormData
): Promise<PropertyFormState> {
  const user = await requireSessionUser();
  const parsed = parseForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };

  const existing = await getProperty(id, user.id);
  if (!existing) return { error: "Immobilie nicht gefunden." };

  await updateProperty(id, user.id, parsed.data as PropertyInput);
  revalidatePath("/properties");
  revalidatePath("/home");
  return undefined;
}

export async function deletePropertyAction(id: string) {
  const user = await requireSessionUser();
  await deleteProperty(id, user.id);
  revalidatePath("/properties");
  revalidatePath("/home");
}
