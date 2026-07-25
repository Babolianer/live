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
import { GOAL_CATEGORIES } from "@/lib/goal-constants";
import { WEALTH_CATEGORIES } from "@/lib/wealth-constants";

const VISION_MODEL = process.env.OPENROUTER_VISION_MODEL || "google/gemma-4-31b-it:free";

const emptyToNull = (v: unknown) => (v === "" || v === undefined ? null : v);

// Every "propose_*" tool follows the same contract: the model calls it with
// structured data, we validate, and the client renders an editable
// confirmation card (never auto-saved). Adding a new proposable entity is
// just one more entry here — the request handling below is generic.
const PROPOSAL_TOOLS: Record<
  string,
  { definition: ToolDefinition; schema: z.ZodType<unknown>; proposalType: string }
> = {
  propose_contract: {
    proposalType: "contract_proposal",
    definition: {
      type: "function",
      function: {
        name: "propose_contract",
        description:
          "Schlägt vor, einen neuen Vertrag anzulegen. Der Nutzer sieht die Angaben in einem Formular und muss aktiv bestätigen.",
        parameters: {
          type: "object",
          properties: {
            name: { type: "string", description: "Name/Bezeichnung des Vertrags" },
            category: { type: "string", enum: [...CATEGORIES] },
            amount: { type: "number", description: "Betrag in Euro, falls bekannt" },
            billingCycle: { type: "string", enum: ["monthly", "yearly", "one_time"] },
            contractEnd: { type: "string", description: "Vertragsende YYYY-MM-DD, falls bekannt" },
            cancellationDeadline: { type: "string", description: "Kündigungsfrist YYYY-MM-DD, falls bekannt" },
            notes: { type: "string" },
          },
          required: ["name", "category", "billingCycle"],
        },
      },
    },
    schema: z.object({
      name: z.string().trim().min(1),
      category: z.string().trim().min(1),
      amount: z.coerce.number().nonnegative().nullable().optional(),
      billingCycle: z.enum(["monthly", "yearly", "one_time"]).default("monthly"),
      contractEnd: z.preprocess(emptyToNull, z.string().nullable().optional()),
      cancellationDeadline: z.preprocess(emptyToNull, z.string().nullable().optional()),
      notes: z.preprocess(emptyToNull, z.string().nullable().optional()),
    }),
  },
  propose_goal: {
    proposalType: "goal_proposal",
    definition: {
      type: "function",
      function: {
        name: "propose_goal",
        description:
          "Schlägt vor, ein neues Sparziel anzulegen. Der Nutzer sieht die Angaben in einem Formular und muss aktiv bestätigen.",
        parameters: {
          type: "object",
          properties: {
            name: { type: "string", description: "Name des Ziels, z. B. 'Thailand Reise 2026'" },
            category: { type: "string", enum: [...GOAL_CATEGORIES] },
            targetAmount: { type: "number", description: "Zielbetrag in Euro" },
            currentAmount: { type: "number", description: "Aktueller Stand in Euro, falls bekannt" },
            targetDate: { type: "string", description: "Zieldatum YYYY-MM-DD, falls bekannt" },
            notes: { type: "string" },
          },
          required: ["name", "category", "targetAmount"],
        },
      },
    },
    schema: z.object({
      name: z.string().trim().min(1),
      category: z.string().trim().min(1),
      targetAmount: z.coerce.number().positive(),
      currentAmount: z.coerce.number().nonnegative().default(0),
      targetDate: z.preprocess(emptyToNull, z.string().nullable().optional()),
      notes: z.preprocess(emptyToNull, z.string().nullable().optional()),
    }),
  },
  propose_wealth_entry: {
    proposalType: "wealth_proposal",
    definition: {
      type: "function",
      function: {
        name: "propose_wealth_entry",
        description:
          "Schlägt vor, einen Vermögenswert (Konto, Depot, Krypto, Sachwert) mit aktuellem Wert anzulegen. Der Nutzer muss aktiv bestätigen.",
        parameters: {
          type: "object",
          properties: {
            name: { type: "string", description: "z. B. 'Girokonto', 'Depot ING', 'Bitcoin Wallet'" },
            category: { type: "string", enum: [...WEALTH_CATEGORIES] },
            value: { type: "number", description: "Aktueller Wert in Euro" },
            notes: { type: "string" },
          },
          required: ["name", "category", "value"],
        },
      },
    },
    schema: z.object({
      name: z.string().trim().min(1),
      category: z.string().trim().min(1),
      value: z.coerce.number(),
      notes: z.preprocess(emptyToNull, z.string().nullable().optional()),
    }),
  },
  propose_vehicle: {
    proposalType: "vehicle_proposal",
    definition: {
      type: "function",
      function: {
        name: "propose_vehicle",
        description:
          "Schlägt vor, ein Fahrzeug in der Garage anzulegen. Der Nutzer muss aktiv bestätigen.",
        parameters: {
          type: "object",
          properties: {
            name: { type: "string", description: "z. B. 'BMW M140i'" },
            licensePlate: { type: "string" },
            purchaseDate: { type: "string", description: "YYYY-MM-DD, falls bekannt" },
            value: { type: "number", description: "Wert in Euro, falls bekannt" },
            inspectionDue: { type: "string", description: "Nächster TÜV YYYY-MM-DD, falls bekannt" },
            notes: { type: "string" },
          },
          required: ["name"],
        },
      },
    },
    schema: z.object({
      name: z.string().trim().min(1),
      licensePlate: z.preprocess(emptyToNull, z.string().nullable().optional()),
      purchaseDate: z.preprocess(emptyToNull, z.string().nullable().optional()),
      value: z.preprocess(emptyToNull, z.coerce.number().nonnegative().nullable().optional()),
      inspectionDue: z.preprocess(emptyToNull, z.string().nullable().optional()),
      notes: z.preprocess(emptyToNull, z.string().nullable().optional()),
    }),
  },
  propose_property: {
    proposalType: "property_proposal",
    definition: {
      type: "function",
      function: {
        name: "propose_property",
        description:
          "Schlägt vor, eine Immobilie anzulegen. Der Nutzer muss aktiv bestätigen.",
        parameters: {
          type: "object",
          properties: {
            name: { type: "string", description: "z. B. 'Eigentumswohnung Musterstraße 1'" },
            address: { type: "string" },
            purchaseDate: { type: "string", description: "YYYY-MM-DD, falls bekannt" },
            value: { type: "number", description: "Wert in Euro, falls bekannt" },
            notes: { type: "string" },
          },
          required: ["name"],
        },
      },
    },
    schema: z.object({
      name: z.string().trim().min(1),
      address: z.preprocess(emptyToNull, z.string().nullable().optional()),
      purchaseDate: z.preprocess(emptyToNull, z.string().nullable().optional()),
      value: z.preprocess(emptyToNull, z.coerce.number().nonnegative().nullable().optional()),
      notes: z.preprocess(emptyToNull, z.string().nullable().optional()),
    }),
  },
  propose_health_log: {
    proposalType: "health_proposal",
    definition: {
      type: "function",
      function: {
        name: "propose_health_log",
        description:
          "Schlägt vor, einen Tages-Gesundheitseintrag (Schritte/Wasser/Schlaf/Workout) zu speichern. Der Nutzer muss aktiv bestätigen.",
        parameters: {
          type: "object",
          properties: {
            logDate: { type: "string", description: "Datum YYYY-MM-DD, Standard: heute" },
            steps: { type: "number" },
            waterLiters: { type: "number" },
            sleepHours: { type: "number" },
            workout: { type: "string" },
            notes: { type: "string" },
          },
          required: ["logDate"],
        },
      },
    },
    schema: z.object({
      logDate: z.string().trim().min(1),
      steps: z.preprocess(emptyToNull, z.coerce.number().int().nonnegative().nullable().optional()),
      waterLiters: z.preprocess(emptyToNull, z.coerce.number().nonnegative().nullable().optional()),
      sleepHours: z.preprocess(emptyToNull, z.coerce.number().nonnegative().nullable().optional()),
      workout: z.preprocess(emptyToNull, z.string().nullable().optional()),
      notes: z.preprocess(emptyToNull, z.string().nullable().optional()),
    }),
  },
};

const ALL_TOOL_DEFINITIONS = Object.values(PROPOSAL_TOOLS).map((t) => t.definition);

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
      tools: ALL_TOOL_DEFINITIONS,
      model: hasImage ? VISION_MODEL : undefined,
    });

    const toolConfig =
      result.kind === "tool_call" ? PROPOSAL_TOOLS[result.toolCall.function.name] : undefined;

    if (result.kind === "tool_call" && toolConfig) {
      const args = JSON.parse(result.toolCall.function.arguments);
      const parsed = toolConfig.schema.safeParse(args);

      if (parsed.success) {
        const text =
          result.text?.trim() ||
          "Ich habe folgende Angaben erkannt — prüf sie kurz und passe sie bei Bedarf an:";
        responsePayload = { type: toolConfig.proposalType, text, proposal: parsed.data };
        assistantStorageContent = JSON.stringify({
          type: toolConfig.proposalType,
          text,
          proposal: parsed.data,
        });
      } else {
        const text =
          "Ich konnte die Angaben nicht sauber erkennen. Kannst du sie nochmal in eigenen Worten beschreiben?";
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
