import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { buildSystemPrompt } from "@/lib/ai-context";
import { listMessages, insertMessage, type MessageAttachment } from "@/lib/ai-messages";
import {
  getConversation,
  touchConversation,
  renameConversationIfDefault,
} from "@/lib/ai-conversations";
import { getDocument } from "@/lib/documents";
import { readImageAsDataUrl } from "@/lib/storage";
import { runChat, type ChatMessage, type ContentPart, type ToolDefinition } from "@/lib/openrouter";
import { CATEGORIES } from "@/lib/contract-constants";

const VISION_MODEL = process.env.OPENROUTER_VISION_MODEL || "google/gemma-4-31b-it:free";

const PROPOSE_CONTRACT_TOOL: ToolDefinition = {
  type: "function",
  function: {
    name: "propose_contract",
    description:
      "Schlägt dem Nutzer vor, einen neuen Vertrag mit den erkannten Daten anzulegen. Der Nutzer sieht die Angaben in einem Formular, kann sie vor dem Speichern noch anpassen und muss aktiv bestätigen — es wird nichts automatisch gespeichert.",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Name/Bezeichnung des Vertrags" },
        category: { type: "string", enum: [...CATEGORIES] },
        amount: { type: "number", description: "Betrag in Euro, falls bekannt" },
        billingCycle: { type: "string", enum: ["monthly", "yearly", "one_time"] },
        contractEnd: { type: "string", description: "Vertragsende als YYYY-MM-DD, falls bekannt" },
        cancellationDeadline: {
          type: "string",
          description: "Kündigungsfrist als YYYY-MM-DD, falls bekannt",
        },
        notes: { type: "string", description: "Sonstige relevante Details" },
      },
      required: ["name", "category", "billingCycle"],
    },
  },
};

const proposalSchema = z.object({
  name: z.string().trim().min(1),
  category: z.string().trim().min(1),
  amount: z.coerce.number().nonnegative().nullable().optional(),
  billingCycle: z.enum(["monthly", "yearly", "one_time"]).default("monthly"),
  contractEnd: z.string().trim().nullable().optional(),
  cancellationDeadline: z.string().trim().nullable().optional(),
  notes: z.string().trim().nullable().optional(),
});

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return Response.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const conversationId = typeof body?.conversationId === "string" ? body.conversationId : "";
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  const attachmentIds: string[] = Array.isArray(body?.attachmentDocumentIds)
    ? body.attachmentDocumentIds.filter((id: unknown) => typeof id === "string")
    : [];

  if (!conversationId) {
    return Response.json({ error: "Keine Unterhaltung angegeben." }, { status: 400 });
  }
  const conversation = await getConversation(conversationId, user.id);
  if (!conversation) {
    return Response.json({ error: "Unterhaltung nicht gefunden." }, { status: 404 });
  }
  if (!message && attachmentIds.length === 0) {
    return Response.json({ error: "Nachricht darf nicht leer sein." }, { status: 400 });
  }

  const attachmentDocs = (
    await Promise.all(attachmentIds.map((id) => getDocument(id, user.id)))
  ).filter((d): d is NonNullable<typeof d> => d !== null);

  const attachmentsForStorage: MessageAttachment[] = attachmentDocs.map((d) => ({
    documentId: d.id,
    name: d.original_name,
    mimeType: d.mime_type,
  }));

  const hasImage = attachmentDocs.some((d) => d.mime_type.startsWith("image/"));

  const [systemPrompt, historyRows] = await Promise.all([
    buildSystemPrompt(user.id),
    listMessages(conversationId, 30),
  ]);

  const history: ChatMessage[] = historyRows.map((m) => {
    if (m.role === "assistant") {
      try {
        const parsed = JSON.parse(m.content);
        return { role: "assistant", content: typeof parsed.text === "string" ? parsed.text : m.content };
      } catch {
        return { role: "assistant", content: m.content };
      }
    }
    return { role: "user", content: m.content };
  });

  const userText =
    message ||
    (attachmentDocs.length
      ? `Analysiere dieses Dokument: ${attachmentDocs.map((d) => d.original_name).join(", ")}`
      : "");

  let userContent: ChatMessage["content"] = userText;
  if (attachmentDocs.length > 0) {
    const parts: ContentPart[] = [{ type: "text", text: userText }];
    for (const doc of attachmentDocs) {
      if (doc.mime_type.startsWith("image/")) {
        const dataUrl = await readImageAsDataUrl(doc.stored_path, doc.mime_type).catch(() => null);
        if (dataUrl) parts.push({ type: "image_url", image_url: { url: dataUrl } });
      } else if (doc.extracted_text) {
        parts.push({
          type: "text",
          text: `Inhalt von "${doc.original_name}":\n${doc.extracted_text.slice(0, 6000)}`,
        });
      }
    }
    userContent = parts;
  }

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...history,
    { role: "user", content: userContent },
  ];

  await insertMessage(conversationId, user.id, "user", userText, attachmentsForStorage);

  let responsePayload: Record<string, unknown>;
  let assistantStorageContent: string;

  try {
    const result = await runChat(messages, {
      tools: [PROPOSE_CONTRACT_TOOL],
      model: hasImage ? VISION_MODEL : undefined,
    });

    if (result.kind === "tool_call" && result.toolCall.function.name === "propose_contract") {
      const args = JSON.parse(result.toolCall.function.arguments);
      const parsed = proposalSchema.safeParse(args);

      if (parsed.success) {
        const text =
          result.text?.trim() ||
          "Ich habe folgende Vertragsdetails erkannt — prüf sie kurz und passe sie bei Bedarf an:";
        responsePayload = { type: "contract_proposal", text, proposal: parsed.data };
        assistantStorageContent = JSON.stringify({
          type: "contract_proposal",
          text,
          proposal: parsed.data,
        });
      } else {
        const text =
          "Ich konnte die Vertragsdaten nicht sauber erkennen. Kannst du sie nochmal in eigenen Worten beschreiben?";
        responsePayload = { type: "text", text };
        assistantStorageContent = JSON.stringify({ type: "text", text });
      }
    } else {
      const text = result.kind === "text" ? result.text : result.text || "";
      responsePayload = { type: "text", text };
      assistantStorageContent = JSON.stringify({ type: "text", text });
    }
  } catch (err) {
    const text = err instanceof Error ? err.message : "Unbekannter Fehler bei der KI-Anfrage.";
    responsePayload = { type: "text", text: `⚠️ ${text}` };
    assistantStorageContent = JSON.stringify({ type: "text", text: `⚠️ ${text}` });
  }

  await insertMessage(conversationId, user.id, "assistant", assistantStorageContent);
  await touchConversation(conversationId);
  if (userText) await renameConversationIfDefault(conversationId, userText);

  return Response.json(responsePayload);
}
