const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

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

// If the configured model is temporarily unavailable/rate-limited (common for
// free-tier OpenRouter models under shared load), we retry with these before
// giving up. Order matters: biggest/most capable first.
const FALLBACK_FREE_MODELS = [
  "nvidia/nemotron-3-ultra-550b-a55b:free",
  "openai/gpt-oss-20b:free",
  "google/gemma-4-31b-it:free",
];

const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504]);

function requireApiKey(): string {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY ist nicht gesetzt. Bitte in .env.local eintragen.");
  }
  return apiKey;
}

function headers(apiKey: string) {
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
    "X-Title": "LIFE",
  };
}

class RetryableError extends Error {}

async function attemptChat(
  model: string,
  messages: ChatMessage[],
  tools: ToolDefinition[] | undefined,
  apiKey: string
): Promise<ChatResult> {
  const response = await fetch(OPENROUTER_URL, {
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
    const msg = `OpenRouter-Anfrage fehlgeschlagen (${response.status}) für Modell ${model}: ${text.slice(0, 300)}`;
    if (RETRYABLE_STATUS.has(response.status)) throw new RetryableError(msg);
    throw new Error(msg);
  }

  const data = await response.json();

  if (data.error) {
    const msg = `OpenRouter meldet einen Fehler für Modell ${model}: ${data.error.message ?? JSON.stringify(data.error)}`;
    throw new RetryableError(msg);
  }

  const message = data.choices?.[0]?.message;
  if (!message) {
    throw new RetryableError(
      `OpenRouter hat für Modell ${model} keine verwertbare Antwort geliefert (leere choices).`
    );
  }

  const toolCalls = message.tool_calls as
    | Array<{ id: string; function: { name: string; arguments: string } }>
    | undefined;

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
  const primaryModel =
    options?.model || process.env.OPENROUTER_MODEL || FALLBACK_FREE_MODELS[0];
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

  throw new Error(
    `Alle KI-Modelle waren nicht erreichbar. Letzte Fehler:\n${errors.join("\n")}`
  );
}

/**
 * Streams a chat completion from OpenRouter and yields text deltas as they arrive.
 * Kept for plain text-only turns without tool definitions.
 */
export async function* streamChatCompletion(messages: ChatMessage[]): AsyncGenerator<string> {
  const apiKey = requireApiKey();
  const model = process.env.OPENROUTER_MODEL || FALLBACK_FREE_MODELS[0];

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: headers(apiKey),
    body: JSON.stringify({ model, messages, stream: true }),
  });

  if (!response.ok || !response.body) {
    const text = await response.text().catch(() => "");
    throw new Error(`OpenRouter-Anfrage fehlgeschlagen (${response.status}): ${text.slice(0, 300)}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (payload === "[DONE]") return;

      try {
        const parsed = JSON.parse(payload);
        const delta = parsed.choices?.[0]?.delta?.content;
        if (typeof delta === "string" && delta.length > 0) {
          yield delta;
        }
      } catch {
        // Ignore malformed/partial SSE chunks (e.g. OpenRouter keep-alive comments).
      }
    }
  }
}
