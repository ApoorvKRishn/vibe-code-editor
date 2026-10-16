// Calls the Google Gemini REST API (generateContent).
// Docs: https://ai.google.dev/api/generate-content

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// "gemini-flash-latest" always points at Google's current Flash model.
export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-flash-latest";

const REQUEST_TIMEOUT_MS = 55_000;

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export class AIError extends Error {
  constructor(message: string, public status = 500) {
    super(message);
  }
}

export async function askGemini(systemPrompt: string, turns: ChatTurn[]): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new AIError("GEMINI_API_KEY is not set on the server.", 503);
  }

  let response: Response;
  try {
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": GEMINI_API_KEY,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          // Gemini calls the assistant role "model".
          contents: turns.map((turn) => ({
            role: turn.role === "assistant" ? "model" : "user",
            parts: [{ text: turn.content }],
          })),
          generationConfig: { temperature: 0.3, maxOutputTokens: 4096 },
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      }
    );
  } catch {
    throw new AIError("Could not reach the Gemini API. Please try again.", 503);
  }

  if (response.status === 429) {
    throw new AIError("The AI is busy (rate limit reached). Try again in a minute.", 429);
  }
  if (!response.ok) {
    const details = await response.text().catch(() => "");
    console.error("Gemini error:", response.status, details.slice(0, 500));
    throw new AIError("The AI request failed.", 502);
  }

  const data = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  if (!text.trim()) throw new AIError("The AI returned an empty answer.", 502);
  return text.trim();
}
