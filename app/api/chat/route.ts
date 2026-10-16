import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { AI_MODEL, AIRateLimitError, AIUnavailableError, chatCompletion } from "@/lib/ai";
import { rateLimit } from "@/lib/rate-limit";

// LLM calls can be slow; allow up to 60s on Vercel (the default can be as low as 10s).
export const maxDuration = 60;

const MAX_MESSAGE_CHARS = 20_000;

const chatRequestSchema = z.object({
  message: z.string().trim().min(1).max(MAX_MESSAGE_CHARS),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(MAX_MESSAGE_CHARS),
      })
    )
    .default([]),
});

const SYSTEM_PROMPT = `You are a helpful AI coding assistant. You help developers with:
- Code explanations and debugging
- Best practices and architecture advice
- Writing clean, efficient code
- Troubleshooting errors
- Code reviews and optimizations

Always provide clear, practical answers. Use proper code formatting when showing examples.`;

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!rateLimit(`chat:${userId}`, 20, 60_000)) {
    return NextResponse.json(
      { error: "Too many requests", details: "Please wait a moment and try again." },
      { status: 429 }
    );
  }

  const parsed = chatRequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: "Message is required and must be a string" },
      { status: 400 }
    );
  }

  const { message, history } = parsed.data;

  try {
    const response = await chatCompletion(
      [
        { role: "system", content: SYSTEM_PROMPT },
        ...history.slice(-10),
        { role: "user", content: message },
      ],
      { temperature: 0.7, maxTokens: 2048, topP: 0.9 }
    );
    if (!response) throw new Error("No response from AI model");

    return NextResponse.json({
      response,
      model: AI_MODEL,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Chat API Error:", error);
    const details = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        error: "Failed to generate AI response",
        details,
        timestamp: new Date().toISOString(),
      },
      {
        status:
          error instanceof AIRateLimitError ? 429 : error instanceof AIUnavailableError ? 503 : 500,
      }
    );
  }
}
