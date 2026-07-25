"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import {
  insertPartnerTool,
  updatePartnerTool,
  deletePartnerToolRow,
  type PartnerToolInput,
} from "@/lib/partner-tools";

export type PartnerToolFormState = { error?: string } | undefined;

const emptyToNull = (v: unknown) => (v === "" ? null : v);

const toolSchema = z.object({
  category: z.string().trim().min(1),
  providerName: z.string().trim().min(1, "Bitte einen Anbieternamen angeben."),
  affiliateId: z.preprocess(emptyToNull, z.string().nullable()),
  deepLinkTemplate: z
    .string()
    .trim()
    .url("Bitte eine gültige URL angeben (z. B. https://www.check24.de/...).")
    .refine((v) => v.startsWith("https://"), "Der Link muss mit https:// beginnen."),
  enabled: z.coerce.boolean(),
});

function parseForm(formData: FormData) {
  return toolSchema.safeParse({
    category: formData.get("category"),
    providerName: formData.get("providerName"),
    affiliateId: formData.get("affiliateId"),
    deepLinkTemplate: formData.get("deepLinkTemplate"),
    enabled: formData.get("enabled") === "on",
  });
}

export async function createPartnerToolAction(
  _prevState: PartnerToolFormState,
  formData: FormData
): Promise<PartnerToolFormState> {
  await requireAdmin();
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  }

  await insertPartnerTool(parsed.data as PartnerToolInput);
  revalidatePath("/admin");
  revalidatePath("/contracts");
  return undefined;
}

export async function updatePartnerToolAction(
  id: string,
  _prevState: PartnerToolFormState,
  formData: FormData
): Promise<PartnerToolFormState> {
  await requireAdmin();
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  }

  await updatePartnerTool(id, parsed.data as PartnerToolInput);
  revalidatePath("/admin");
  revalidatePath("/contracts");
  return undefined;
}

export async function deletePartnerToolAction(id: string) {
  await requireAdmin();
  await deletePartnerToolRow(id);
  revalidatePath("/admin");
  revalidatePath("/contracts");
}
