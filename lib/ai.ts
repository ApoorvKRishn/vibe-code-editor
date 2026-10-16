// Calls the Google Gemini REST API (generateContent).
// Docs: https://ai.google.dev/api/generate-content

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// "-latest" aliases always point at Google's current Flash models. If the main
// model is overloaded (it happens on the free tier), we retry on the Lite model.
const MODELS = [
  process.env.GEMINI_MODEL || "gemini-flash-latest",
  "gemini-flash-lite-latest",
];

// Two attempts (main + fallback model) must fit in the route's 60 s limit.
const REQUEST_TIMEOUT_MS = 25_000;

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export class AIError extends Error {
  constructor(message: string, public status = 500, public retryable = false) {
    super(message);
  }
}

/**
 * Sends the conversation to Gemini. With `responseSchema`, Gemini returns JSON
 * matching that schema (structured output) instead of free text.
 */
export async function askGemini(
  systemPrompt: string,
  turns: ChatTurn[],
  responseSchema?: object
): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new AIError("GEMINI_API_KEY is not set on the server.", 503);
  }

  let lastError = new AIError("The AI request failed.", 502);
  for (const model of MODELS) {
    try {
      return await callModel(model, systemPrompt, turns, responseSchema);
    } catch (error) {
      if (!(error instanceof AIError) || !error.retryable) throw error;
      lastError = error;
    }
  }
  throw lastError;
}

async function callModel(
  model: string,
  systemPrompt: string,
  turns: ChatTurn[],
  responseSchema?: object
): Promise<string> {
  let response: Response;
  try {
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": GEMINI_API_KEY!,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          // Gemini calls the assistant role "model".
          contents: turns.map((turn) => ({
            role: turn.role === "assistant" ? "model" : "user",
            parts: [{ text: turn.content }],
          })),
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 8192,
            ...(responseSchema && { responseMimeType: "application/json", responseSchema }),
          },
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      }
    );
  } catch {
    throw new AIError("Could not reach the Gemini API. Please try again.", 503, true);
  }

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    console.error(`Gemini error (${model}):`, response.status, details.slice(0, 300));
    // 429 = rate limit, 5xx = overloaded / server error: worth trying the next model.
    const retryable = response.status === 429 || response.status >= 500;
    throw new AIError(
      retryable
        ? "The AI is busy right now. Please try again in a minute."
        : "The AI request failed.",
      retryable ? 503 : 502,
      retryable
    );
  }

  const data = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  if (!text.trim()) throw new AIError("The AI returned an empty answer.", 502);
  return text.trim();
}
