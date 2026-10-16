import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { AIError, askGemini } from "@/lib/ai";
import { rateLimit } from "@/lib/rate-limit";

export const maxDuration = 60;

const aiSchema = z.object({
  fileName: z.string().max(200),
  code: z.string().max(64_000),
  // Output of the last run, so the AI can see the actual error.
  runOutput: z.string().max(16_000).default(""),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(20_000),
      })
    )
    .min(1)
    .max(20),
});

const SYSTEM_PROMPT = `You are an AI pair-programmer inside a code editor.
You can see the user's current file and the output of their last run.
Answer as JSON with two fields:
- "reply": your answer in markdown. Explain clearly and briefly.
- "fixedCode": ONLY when you propose changes to the file, the COMPLETE corrected
  file content as plain code (no markdown fences, no file name). Otherwise "".`;

// Structured output: Gemini must return JSON in this shape, so the editor gets
// the fixed code directly instead of having to dig it out of markdown.
const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    reply: { type: "STRING" },
    fixedCode: { type: "STRING" },
  },
  required: ["reply", "fixedCode"],
};

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!rateLimit(`ai:${userId}`, 10, 60_000)) {
    return NextResponse.json({ error: "Too many AI requests. Wait a minute." }, { status: 429 });
  }

  const parsed = aiSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { fileName, code, runOutput, messages } = parsed.data;

  // The current file and last run output are sent as context with every request,
  // so the AI always sees the latest version of the code.
  const context = [
    `<file name="${fileName}">`,
    code,
    "</file>",
    runOutput ? `<last_run_output>\n${runOutput}\n</last_run_output>` : "",
  ].join("\n");

  const turns = messages.slice(-10);
  const last = turns[turns.length - 1];
  turns[turns.length - 1] = { ...last, content: `${context}\n\n${last.content}` };

  try {
    const raw = await askGemini(SYSTEM_PROMPT, turns, RESPONSE_SCHEMA);
    const { reply, fixedCode } = JSON.parse(raw) as { reply: string; fixedCode?: string };
    return NextResponse.json({ reply, fixedCode: fixedCode?.trim() ? fixedCode : null });
  } catch (error) {
    const status = error instanceof AIError ? error.status : 500;
    const message = error instanceof Error ? error.message : "AI request failed";
    return NextResponse.json({ error: message }, { status });
  }
}
