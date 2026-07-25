"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireSessionUser } from "@/lib/auth";
import { insertWealthGroup, updateWealthGroup, deleteWealthGroup, type WealthGroupInput } from "@/lib/wealth-groups";
import { GROUP_TYPES } from "@/lib/wealth-asset-constants";

export type WealthGroupFormState = { error?: string } | undefined;

const groupSchema = z.object({
  name: z.string().trim().min(1, "Bitte einen Namen angeben."),
  typ: z.enum(GROUP_TYPES),
  farbe: z.string().trim().min(1),
  icon: z.string().trim().min(1),
  staleAfterDays: z.coerce.number().int().positive(),
});

function parseForm(formData: FormData) {
  return groupSchema.safeParse({
    name: formData.get("name"),
    typ: formData.get("typ"),
    farbe: formData.get("farbe"),
    icon: formData.get("icon"),
    staleAfterDays: formData.get("staleAfterDays"),
  });
}

export async function createWealthGroupAction(_prevState: WealthGroupFormState, formData: FormData): Promise<WealthGroupFormState> {
  const user = await requireSessionUser();
  const parsed = parseForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };

  await insertWealthGroup(user.id, parsed.data as WealthGroupInput);
  revalidatePath("/wealth");
  revalidatePath("/wealth/vermoegen");
  return undefined;
}

export async function updateWealthGroupAction(id: string, _prevState: WealthGroupFormState, formData: FormData): Promise<WealthGroupFormState> {
  const user = await requireSessionUser();
  const parsed = parseForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };

  await updateWealthGroup(id, user.id, parsed.data as WealthGroupInput);
  revalidatePath("/wealth");
  revalidatePath("/wealth/vermoegen");
  return undefined;
}

export async function deleteWealthGroupAction(id: string) {
  const user = await requireSessionUser();
  await deleteWealthGroup(id, user.id);
  revalidatePath("/wealth");
  revalidatePath("/wealth/vermoegen");
}
