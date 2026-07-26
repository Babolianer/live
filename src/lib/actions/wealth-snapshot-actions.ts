"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireSessionUser } from "@/lib/auth";
import { insertManualSnapshot, updateManualSnapshot, deleteSnapshot } from "@/lib/wealth-finance";

export type SnapshotFormState = { error?: string } | undefined;

const snapshotSchema = z.object({
  date: z.string().trim().min(1, "Bitte ein Datum angeben."),
  netWorth: z.coerce.number(),
  totalDebts: z.coerce.number().nonnegative(),
});

function parseForm(formData: FormData) {
  return snapshotSchema.safeParse({
    date: formData.get("date"),
    netWorth: formData.get("netWorth"),
    totalDebts: formData.get("totalDebts") || 0,
  });
}

export async function createManualSnapshotAction(_prevState: SnapshotFormState, formData: FormData): Promise<SnapshotFormState> {
  const user = await requireSessionUser();
  const parsed = parseForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };

  await insertManualSnapshot(user.id, parsed.data.date, parsed.data.netWorth, parsed.data.totalDebts);
  revalidatePath("/wealth");
  return undefined;
}

export async function updateManualSnapshotAction(
  id: string,
  _prevState: SnapshotFormState,
  formData: FormData
): Promise<SnapshotFormState> {
  const user = await requireSessionUser();
  const parsed = parseForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };

  await updateManualSnapshot(id, user.id, parsed.data.netWorth, parsed.data.totalDebts);
  revalidatePath("/wealth");
  return undefined;
}

export async function deleteSnapshotAction(id: string) {
  const user = await requireSessionUser();
  await deleteSnapshot(id, user.id);
  revalidatePath("/wealth");
}
