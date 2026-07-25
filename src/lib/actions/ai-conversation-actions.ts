"use server";

import { revalidatePath } from "next/cache";
import { requireSessionUser } from "@/lib/auth";
import {
  createConversation,
  deleteConversation,
  renameConversation,
} from "@/lib/ai-conversations";

export async function createConversationAction(): Promise<string> {
  const user = await requireSessionUser();
  const id = await createConversation(user.id);
  revalidatePath("/ai");
  return id;
}

export async function deleteConversationAction(id: string) {
  const user = await requireSessionUser();
  await deleteConversation(id, user.id);
  revalidatePath("/ai");
}

export async function renameConversationAction(id: string, title: string) {
  const user = await requireSessionUser();
  if (!title.trim()) return;
  await renameConversation(id, user.id, title.trim());
  revalidatePath("/ai");
}
