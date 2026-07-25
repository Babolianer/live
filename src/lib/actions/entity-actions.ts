"use server";

import { revalidatePath } from "next/cache";
import { requireSessionUser } from "@/lib/auth";
import { ENTITY_HANDLERS, ENTITY_TYPES, type EntityType } from "@/lib/entity-registry";

function isEntityType(value: string): value is EntityType {
  return (ENTITY_TYPES as string[]).includes(value);
}

export async function deleteEntityAction(entityType: string, id: string) {
  const user = await requireSessionUser();
  if (!isEntityType(entityType)) return;

  const handler = ENTITY_HANDLERS[entityType];
  const row = await handler.get(id, user.id);
  if (!row) return;

  await handler.del(id, user.id);
  for (const path of handler.revalidate) revalidatePath(path);
}
