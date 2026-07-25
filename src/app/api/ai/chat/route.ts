import { getSessionUser } from "@/lib/auth";
import { buildSystemPrompt } from "@/lib/ai-context";
import { listMessages, insertMessage } from "@/lib/ai-messages";
import { streamChatCompletion, type ChatMessage } from "@/lib/openrouter";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return Response.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  if (!message) {
    return Response.json({ error: "Nachricht darf nicht leer sein." }, { status: 400 });
  }

  const [systemPrompt, history] = await Promise.all([
    buildSystemPrompt(user.id),
    listMessages(user.id, 20),
  ]);

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...history.map((m) => ({ role: m.role, content: m.content }) as ChatMessage),
    { role: "user", content: message },
  ];

  await insertMessage(user.id, "user", message);

  const encoder = new TextEncoder();
  let full = "";

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of streamChatCompletion(messages)) {
          full += chunk;
          controller.enqueue(encoder.encode(chunk));
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unbekannter Fehler bei der KI-Anfrage.";
        full = full || `⚠️ ${errorMessage}`;
        controller.enqueue(encoder.encode(full));
      } finally {
        if (full.trim()) {
          await insertMessage(user.id, "assistant", full);
        }
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
