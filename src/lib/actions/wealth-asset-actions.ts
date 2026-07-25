"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireSessionUser } from "@/lib/auth";
import { insertWealthAsset, updateWealthAsset, deleteWealthAsset, getWealthAsset, type WealthAssetInput } from "@/lib/wealth-assets";
import { ensureDefaultWealthGroup } from "@/lib/wealth-groups";
import { createSnapshot } from "@/lib/wealth-finance";
import { ASSET_TYPES } from "@/lib/wealth-asset-constants";

export type WealthAssetFormState = { error?: string } | undefined;

const emptyToNull = (v: unknown) => (v === "" ? null : v);

const assetSchema = z.object({
  groupId: z.string().trim().min(1, "Bitte eine Gruppe wählen."),
  sectorId: z.preprocess(emptyToNull, z.string().nullable()),
  name: z.string().trim().min(1, "Bitte einen Namen angeben."),
  typ: z.enum(ASSET_TYPES),
  quantity: z.coerce.number(),
  pricePerUnit: z.coerce.number(),
  currency: z.string().trim().min(1).default("EUR"),
  isin: z.preprocess(emptyToNull, z.string().nullable()),
  symbol: z.preprocess(emptyToNull, z.string().nullable()),
  notes: z.preprocess(emptyToNull, z.string().nullable()),
});

function parseForm(formData: FormData) {
  return assetSchema.safeParse({
    groupId: formData.get("groupId"),
    sectorId: formData.get("sectorId"),
    name: formData.get("name"),
    typ: formData.get("typ"),
    quantity: formData.get("quantity"),
    pricePerUnit: formData.get("pricePerUnit"),
    currency: formData.get("currency") || "EUR",
    isin: formData.get("isin"),
    symbol: formData.get("symbol"),
    notes: formData.get("notes"),
  });
}

export async function createWealthAssetAction(_prevState: WealthAssetFormState, formData: FormData): Promise<WealthAssetFormState> {
  const user = await requireSessionUser();
  const parsed = parseForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };

  await insertWealthAsset(user.id, parsed.data as WealthAssetInput);
  await createSnapshot(user.id);
  revalidatePath("/wealth");
  revalidatePath("/wealth/vermoegen");
  revalidatePath("/home");
  return undefined;
}

export async function updateWealthAssetAction(id: string, _prevState: WealthAssetFormState, formData: FormData): Promise<WealthAssetFormState> {
  const user = await requireSessionUser();
  const parsed = parseForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };

  await updateWealthAsset(id, user.id, parsed.data as WealthAssetInput);
  await createSnapshot(user.id);
  revalidatePath("/wealth");
  revalidatePath("/wealth/vermoegen");
  revalidatePath(`/wealth/assets/${id}`);
  revalidatePath("/home");
  return undefined;
}

export async function deleteWealthAssetAction(id: string) {
  const user = await requireSessionUser();
  await deleteWealthAsset(id, user.id);
  await createSnapshot(user.id);
  revalidatePath("/wealth");
  revalidatePath("/wealth/vermoegen");
  revalidatePath("/home");
}

// ── Quick add/edit (AI-assistant proposals) ─────────────────────────────
// Simplified shape (name/typ/value/notes) for the "Ask LIFE" quick-capture
// flow — quantity is fixed at 1 and the group defaults to "Sonstiges".
// Detailed multi-transaction assets (real quantity/avg price/sector/symbol)
// are managed on the Vermögen/Asset-detail pages, not via chat.

const quickSchema = z.object({
  name: z.string().trim().min(1, "Bitte einen Namen angeben."),
  typ: z.enum(ASSET_TYPES).default("OTHER"),
  value: z.coerce.number(),
  notes: z.preprocess(emptyToNull, z.string().nullable()),
});

function parseQuickForm(formData: FormData) {
  return quickSchema.safeParse({
    name: formData.get("name"),
    typ: formData.get("typ") || "OTHER",
    value: formData.get("value"),
    notes: formData.get("notes"),
  });
}

export async function createWealthAssetQuickAction(_prevState: WealthAssetFormState, formData: FormData): Promise<WealthAssetFormState> {
  const user = await requireSessionUser();
  const parsed = parseQuickForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };

  const groupId = await ensureDefaultWealthGroup(user.id);
  await insertWealthAsset(user.id, {
    groupId,
    sectorId: null,
    name: parsed.data.name,
    typ: parsed.data.typ,
    quantity: 1,
    pricePerUnit: parsed.data.value,
    currency: "EUR",
    isin: null,
    symbol: null,
    notes: parsed.data.notes,
  });
  await createSnapshot(user.id);
  revalidatePath("/wealth");
  revalidatePath("/wealth/vermoegen");
  revalidatePath("/home");
  return undefined;
}

export async function updateWealthAssetQuickAction(id: string, _prevState: WealthAssetFormState, formData: FormData): Promise<WealthAssetFormState> {
  const user = await requireSessionUser();
  const parsed = parseQuickForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };

  const existing = await getWealthAsset(id, user.id);
  if (!existing) return { error: "Vermögenswert nicht gefunden." };

  await updateWealthAsset(id, user.id, {
    groupId: existing.group_id,
    sectorId: existing.sector_id,
    name: parsed.data.name,
    typ: parsed.data.typ,
    quantity: existing.quantity,
    pricePerUnit: parsed.data.value,
    currency: existing.currency,
    isin: existing.isin,
    symbol: existing.symbol,
    notes: parsed.data.notes,
  });
  await createSnapshot(user.id);
  revalidatePath("/wealth");
  revalidatePath("/wealth/vermoegen");
  revalidatePath("/home");
  return undefined;
}
