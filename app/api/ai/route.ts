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
Explain clearly and briefly. Use markdown.
When you suggest a fix, include the COMPLETE corrected file in exactly one fenced
code block (not just the changed lines), so the editor can apply it with one click.`;

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
    `Current file: ${fileName}`,
    "```",
    code,
    "```",
    runOutput ? `Output of the last run:\n\`\`\`\n${runOutput}\n\`\`\`` : "",
  ].join("\n");

  const turns = messages.slice(-10);
  const last = turns[turns.length - 1];
  turns[turns.length - 1] = { ...last, content: `${context}\n\n${last.content}` };

  try {
    const reply = await askGemini(SYSTEM_PROMPT, turns);
    return NextResponse.json({ reply });
  } catch (error) {
    const status = error instanceof AIError ? error.status : 500;
    const message = error instanceof Error ? error.message : "AI request failed";
    return NextResponse.json({ error: message }, { status });
  }
}
