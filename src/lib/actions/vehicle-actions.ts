"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireSessionUser } from "@/lib/auth";
import {
  insertVehicle,
  updateVehicle,
  deleteVehicle,
  getVehicle,
  type VehicleInput,
} from "@/lib/vehicles";

export type VehicleFormState = { error?: string } | undefined;

const emptyToNull = (v: unknown) => (v === "" ? null : v);

const vehicleSchema = z.object({
  name: z.string().trim().min(1, "Bitte einen Namen angeben."),
  licensePlate: z.preprocess(emptyToNull, z.string().nullable()),
  purchaseDate: z.preprocess(emptyToNull, z.string().nullable()),
  value: z.preprocess(emptyToNull, z.coerce.number().nonnegative().nullable()),
  inspectionDue: z.preprocess(emptyToNull, z.string().nullable()),
  documentId: z.preprocess(emptyToNull, z.string().nullable()),
  notes: z.preprocess(emptyToNull, z.string().nullable()),
});

function parseForm(formData: FormData) {
  return vehicleSchema.safeParse({
    name: formData.get("name"),
    licensePlate: formData.get("licensePlate"),
    purchaseDate: formData.get("purchaseDate"),
    value: formData.get("value"),
    inspectionDue: formData.get("inspectionDue"),
    documentId: formData.get("documentId"),
    notes: formData.get("notes"),
  });
}

export async function createVehicleAction(
  _prevState: VehicleFormState,
  formData: FormData
): Promise<VehicleFormState> {
  const user = await requireSessionUser();
  const parsed = parseForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };

  await insertVehicle(user.id, parsed.data as VehicleInput);
  revalidatePath("/garage");
  revalidatePath("/home");
  return undefined;
}

export async function updateVehicleAction(
  id: string,
  _prevState: VehicleFormState,
  formData: FormData
): Promise<VehicleFormState> {
  const user = await requireSessionUser();
  const parsed = parseForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };

  const existing = await getVehicle(id, user.id);
  if (!existing) return { error: "Fahrzeug nicht gefunden." };

  await updateVehicle(id, user.id, parsed.data as VehicleInput);
  revalidatePath("/garage");
  revalidatePath("/home");
  return undefined;
}

export async function deleteVehicleAction(id: string) {
  const user = await requireSessionUser();
  await deleteVehicle(id, user.id);
  revalidatePath("/garage");
  revalidatePath("/home");
}
