import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText } from "ai";
import { auth } from "@/auth";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    // Check authentication
    const session = await auth();

    if (!session?.user) {
      return new Response("Unauthorized", {
        status: 401,
      });
    }

    // Read request body
    const {
      messages,
      codeContext,
      language,
      activeFileName,
    } = await req.json();

    // Build system prompt
    const systemPrompt = `You are Vibe AI, an elite Senior Software Engineer and pair-programmer integrated directly into the Vibe Code Editor.

Your mission is to help the user write, debug, optimize, refactor, and understand code.

Current Workspace Context:
- Active File: ${activeFileName || "Unknown"}
- Language: ${language || "plain text"}

File Content:
\`\`\`${language || ""}
${codeContext || "// No active file content"}
\`\`\`

Guidelines:
1. Provide concise, clean, production-grade solutions.
2. When suggesting code changes, use clear Markdown code blocks with language annotations.
3. When analyzing a bug, clearly explain the root cause and provide the exact fix.
4. Keep explanations crisp and actionable.
5. Preserve the user's existing intent and architecture whenever possible.
6. Prefer simple, maintainable solutions over unnecessary complexity.`;

    // Read API key from .env
    const apiKey = process.env.GEMINI_API_KEY;

    // Make sure the key actually exists
    if (!apiKey) {
      console.error("GEMINI_API_KEY is missing from environment variables.");

      return new Response(
        JSON.stringify({
          error:
            "Gemini API key is missing. Add GEMINI_API_KEY to .env and restart the server.",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // IMPORTANT:
    // Explicitly create the Google provider using our API key.
    const googleProvider = createGoogleGenerativeAI({
      apiKey,
    });

    // Stream response from Gemini
    const result = streamText({
      model: googleProvider("gemini-3.6-flash"),
      system: systemPrompt,
      messages,
    });

    return result.toTextStreamResponse();
  } catch (error: unknown) {
    console.error("Vibe AI error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "AI generation failed";

    return new Response(
      JSON.stringify({
        error: message,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}