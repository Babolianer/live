const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

export type ContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string | ContentPart[];
};

export type ToolDefinition = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
};

export type ToolCall = {
  id: string;
  function: { name: string; arguments: string };
};

export type ChatResult =
  | { kind: "text"; text: string }
  | { kind: "tool_call"; toolCall: ToolCall; text: string | null };

// Groq's free tier has generous per-model rate limits (no OpenRouter-style
// shared daily cap across all free models), so these fallbacks only cover
// genuine outages/overload, not routine throttling.
const FALLBACK_FREE_MODELS = ["llama-3.3-70b-versatile", "openai/gpt-oss-120b", "moonshotai/kimi-k2-instruct"];

const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504]);

function requireApiKey(): string {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY ist nicht gesetzt. Kostenlosen Key unter https://console.groq.com/keys anlegen.");
  }
  return apiKey;
}

function headers(apiKey: string) {
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
}

class RetryableError extends Error {}

async function attemptChat(
  model: string,
  messages: ChatMessage[],
  tools: ToolDefinition[] | undefined,
  apiKey: string
): Promise<ChatResult> {
  const response = await fetch(GROQ_URL, {
    method: "POST",
    headers: headers(apiKey),
    body: JSON.stringify({
      model,
      messages,
      ...(tools ? { tools, tool_choice: "auto" } : {}),
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    const msg = `Groq-Anfrage fehlgeschlagen (${response.status}) für Modell ${model}: ${text.slice(0, 300)}`;
    if (RETRYABLE_STATUS.has(response.status)) throw new RetryableError(msg);
    throw new Error(msg);
  }

  const data = await response.json();

  if (data.error) {
    const msg = `Groq meldet einen Fehler für Modell ${model}: ${data.error.message ?? JSON.stringify(data.error)}`;
    throw new RetryableError(msg);
  }

  const message = data.choices?.[0]?.message;
  if (!message) {
    throw new RetryableError(`Groq hat für Modell ${model} keine verwertbare Antwort geliefert (leere choices).`);
  }

  const toolCalls = message.tool_calls as Array<{ id: string; function: { name: string; arguments: string } }> | undefined;

  if (toolCalls && toolCalls.length > 0) {
    const call = toolCalls[0];
    return {
      kind: "tool_call",
      toolCall: { id: call.id, function: call.function },
      text: typeof message.content === "string" ? message.content : null,
    };
  }

  return { kind: "text", text: typeof message.content === "string" ? message.content : "" };
}

/**
 * Single non-streaming completion, optionally with tool definitions. Used for
 * the main chat turn so we can reliably detect and act on a tool call before
 * deciding how to render the response (plain text vs. a proposal card).
 *
 * Retries with fallback free models on transient failures (rate limits,
 * upstream errors, empty responses) so a single overloaded model doesn't
 * take down the whole chat.
 */
export async function runChat(
  messages: ChatMessage[],
  options?: { tools?: ToolDefinition[]; model?: string }
): Promise<ChatResult> {
  const apiKey = requireApiKey();
  const primaryModel = options?.model || process.env.GROQ_MODEL || FALLBACK_FREE_MODELS[0];
  const modelsToTry = [primaryModel, ...FALLBACK_FREE_MODELS.filter((m) => m !== primaryModel)];

  const errors: string[] = [];
  for (const model of modelsToTry) {
    try {
      return await attemptChat(model, messages, options?.tools, apiKey);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(msg);
      if (!(err instanceof RetryableError)) throw err;
      // otherwise fall through and try the next model
    }
  }

  throw new Error(`Alle KI-Modelle waren nicht erreichbar. Letzte Fehler:\n${errors.join("\n")}`);
}
