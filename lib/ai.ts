// Talks to any OpenAI-compatible chat completions API:
//   - Production: Groq (free tier) — set AI_BASE_URL, AI_API_KEY, AI_MODEL.
//   - Local dev:  Ollama, which serves the same API under /v1 — nothing to set
//                 beyond the existing OLLAMA_URL / OLLAMA_MODEL.

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface CompletionOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  /** Overrides the default model, e.g. a faster one for inline completions. */
  model?: string;
}

const OLLAMA_URL = (process.env.OLLAMA_URL || "http://localhost:11434").replace(/\/+$/, "");

const BASE_URL = (process.env.AI_BASE_URL || `${OLLAMA_URL}/v1`).replace(/\/+$/, "");
const API_KEY = process.env.AI_API_KEY;

export const AI_MODEL = process.env.AI_MODEL || process.env.OLLAMA_MODEL || "codellama:latest";
export const AI_COMPLETION_MODEL = process.env.AI_COMPLETION_MODEL || AI_MODEL;

// Reasoning models (e.g. gpt-oss) spend output tokens "thinking" first; "low"
// keeps responses fast and leaves room in the token budget for the answer.
const REASONING_EFFORT = process.env.AI_REASONING_EFFORT;

const REQUEST_TIMEOUT_MS = 55_000;

export class AIUnavailableError extends Error {
  constructor(message = "The AI service is not reachable. Check AI_BASE_URL / AI_API_KEY (or that Ollama is running locally).") {
    super(message);
  }
}

export class AIRateLimitError extends Error {
  constructor() {
    super("The AI service is busy right now. Please try again in a moment.");
  }
}

export async function chatCompletion(
  messages: ChatMessage[],
  options: CompletionOptions = {}
): Promise<string> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(API_KEY && { Authorization: `Bearer ${API_KEY}` }),
      },
      body: JSON.stringify({
        model: options.model || AI_MODEL,
        messages,
        temperature: options.temperature,
        max_tokens: options.maxTokens,
        top_p: options.topP,
        stream: false,
        ...(REASONING_EFFORT && { reasoning_effort: REASONING_EFFORT }),
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new Error("The AI model took too long to respond");
    }
    throw new AIUnavailableError();
  }

  if (response.status === 429) throw new AIRateLimitError();
  if (response.status === 401 || response.status === 403) {
    throw new AIUnavailableError("The AI service rejected the API key (check AI_API_KEY).");
  }
  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(`AI service returned HTTP ${response.status}${details ? `: ${details.slice(0, 300)}` : ""}`);
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string | null } }[];
  };
  return data.choices?.[0]?.message?.content?.trim() ?? "";
}
