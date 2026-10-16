import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { rateLimit } from "@/lib/rate-limit";
import { getRunnableLanguage } from "@/modules/playground/lib/languages";

// Code runs on Judge0, an open-source sandbox that executes each submission in
// an isolated container with CPU-time and memory limits. Running untrusted
// user code on our own server would be a security risk.
const JUDGE0_URL = (process.env.JUDGE0_URL || "https://ce.judge0.com").replace(/\/+$/, "");
const JUDGE0_API_KEY = process.env.JUDGE0_API_KEY; // only needed for the RapidAPI-hosted Judge0

export const maxDuration = 30;

const runSchema = z.object({
  fileExtension: z.string(),
  code: z.string().min(1).max(64_000),
  stdin: z.string().max(16_000).default(""),
});

const toBase64 = (text: string) => Buffer.from(text, "utf8").toString("base64");
const fromBase64 = (text: string | null) =>
  text ? Buffer.from(text, "base64").toString("utf8") : "";

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!rateLimit(`run:${userId}`, 15, 60_000)) {
    return NextResponse.json({ error: "Too many runs. Wait a minute." }, { status: 429 });
  }

  const parsed = runSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { fileExtension, code, stdin } = parsed.data;

  const language = getRunnableLanguage(fileExtension);
  if (!language) {
    return NextResponse.json({ error: `.${fileExtension} files can't be run` }, { status: 400 });
  }

  let response: Response;
  try {
    // wait=true makes Judge0 respond only after the program has finished.
    // Code is base64-encoded so any characters survive the JSON round trip.
    response = await fetch(`${JUDGE0_URL}/submissions?base64_encoded=true&wait=true`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(JUDGE0_API_KEY && {
          "X-RapidAPI-Key": JUDGE0_API_KEY,
          "X-RapidAPI-Host": new URL(JUDGE0_URL).host,
        }),
      },
      body: JSON.stringify({
        language_id: language.judge0Id,
        source_code: toBase64(code),
        stdin: toBase64(stdin),
      }),
      signal: AbortSignal.timeout(25_000),
    });
  } catch {
    return NextResponse.json({ error: "Code runner is not reachable" }, { status: 503 });
  }

  if (!response.ok) {
    console.error("Judge0 error:", response.status, await response.text().catch(() => ""));
    return NextResponse.json({ error: "Code runner failed" }, { status: 502 });
  }

  const result = (await response.json()) as {
    stdout: string | null;
    stderr: string | null;
    compile_output: string | null;
    message: string | null;
    time: string | null; // seconds
    memory: number | null; // kilobytes
    status: { id: number; description: string };
  };

  return NextResponse.json({
    language: language.label,
    status: result.status.description, // e.g. "Accepted", "Compilation Error"
    success: result.status.id === 3,
    stdout: fromBase64(result.stdout),
    stderr: fromBase64(result.stderr),
    compileOutput: fromBase64(result.compile_output),
    message: fromBase64(result.message),
    timeMs: result.time ? Math.round(parseFloat(result.time) * 1000) : null,
    memoryKb: result.memory,
  });
}
