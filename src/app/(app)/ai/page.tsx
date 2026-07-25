import { redirect } from "next/navigation";
import { requireSessionUser } from "@/lib/auth";
import { listConversations, createConversation } from "@/lib/ai-conversations";

export default async function AiIndexPage() {
  const user = await requireSessionUser();
  const conversations = await listConversations(user.id);

  const targetId = conversations[0]?.id ?? (await createConversation(user.id));
  redirect(`/ai/${targetId}`);
}
