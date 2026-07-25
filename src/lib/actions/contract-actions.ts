"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireSessionUser } from "@/lib/auth";
import {
  insertContract,
  updateContract,
  deleteContractRow,
  getContract,
  type ContractInput,
} from "@/lib/contracts";

export type ContractFormState = { error?: string } | undefined;

const emptyToNull = (v: unknown) => (v === "" ? null : v);

const contractSchema = z.object({
  name: z.string().trim().min(1, "Bitte einen Namen angeben."),
  category: z.string().trim().min(1),
  amount: z.preprocess(
    emptyToNull,
    z.coerce.number().nonnegative().nullable()
  ),
  billingCycle: z.enum(["monthly", "yearly", "one_time"]),
  contractEnd: z.preprocess(emptyToNull, z.string().nullable()),
  cancellationDeadline: z.preprocess(emptyToNull, z.string().nullable()),
  documentId: z.preprocess(emptyToNull, z.string().nullable()),
  notes: z.preprocess(emptyToNull, z.string().nullable()),
});

function parseForm(formData: FormData) {
  return contractSchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category"),
    amount: formData.get("amount"),
    billingCycle: formData.get("billingCycle"),
    contractEnd: formData.get("contractEnd"),
    cancellationDeadline: formData.get("cancellationDeadline"),
    documentId: formData.get("documentId"),
    notes: formData.get("notes"),
  });
}

export async function createContractAction(
  _prevState: ContractFormState,
  formData: FormData
): Promise<ContractFormState> {
  const user = await requireSessionUser();
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  }

  await insertContract(user.id, parsed.data as ContractInput);
  revalidatePath("/contracts");
  revalidatePath("/home");
  return undefined;
}

export async function updateContractAction(
  id: string,
  _prevState: ContractFormState,
  formData: FormData
): Promise<ContractFormState> {
  const user = await requireSessionUser();
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  }

  const existing = await getContract(id, user.id);
  if (!existing) {
    return { error: "Vertrag nicht gefunden." };
  }

  await updateContract(id, user.id, parsed.data as ContractInput);
  revalidatePath("/contracts");
  revalidatePath("/home");
  return undefined;
}

export async function deleteContractAction(id: string) {
  const user = await requireSessionUser();
  await deleteContractRow(id, user.id);
  revalidatePath("/contracts");
  revalidatePath("/home");
}
