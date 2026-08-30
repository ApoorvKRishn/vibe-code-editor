"use server";

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  output: string;
  exitCode: number | null;
  executionTimeMs: number;
  error?: string;
}

// Wandbox compiler mapping — https://wandbox.org/api/list.json
const WANDBOX_COMPILER_MAP: Record<string, { compiler: string; fileName?: string }> = {
  javascript: { compiler: "nodejs-20.17.0" },
  js:         { compiler: "nodejs-20.17.0" },
  typescript: { compiler: "typescript-5.6.2" },
  ts:         { compiler: "typescript-5.6.2" },
  python:     { compiler: "cpython-3.14.0" },
  py:         { compiler: "cpython-3.14.0" },
  cpp:        { compiler: "gcc-head" },
  "c++":      { compiler: "gcc-head" },
  c:          { compiler: "gcc-head-c" },
  java:       { compiler: "openjdk-jdk-22+36", fileName: "Main.java" },
  go:         { compiler: "go-1.23.2" },
  rust:       { compiler: "rust-1.82.0" },
};

export async function executeCode(params: {
  language: string;
  code: string;
  stdin?: string;
}): Promise<ExecutionResult> {
  const startTime = Date.now();
  const normalizedLang = params.language.toLowerCase().trim();
  const runtime = WANDBOX_COMPILER_MAP[normalizedLang];

  if (!runtime) {
    return {
      stdout: "",
      stderr: `Language "${params.language}" is not supported.`,
      output: `Language "${params.language}" is not supported.`,
      exitCode: 1,
      executionTimeMs: 0,
    };
  }

  try {
    // For Java, Wandbox requires the file to be named "Main.java"
    // so we use the `codes` array to pass it with the correct filename.
    const body: Record<string, unknown> = {
      compiler: runtime.compiler,
      stdin: params.stdin || "",
    };

    if (runtime.fileName) {
      // Multi-file submission (used for Java to set filename = Main.java)
      body.code = "";
      body.codes = [{ file: runtime.fileName, code: params.code }];
    } else {
      body.code = params.code;
    }

    const response = await fetch("https://wandbox.org/api/compile.json", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        stdout: "",
        stderr: `Execution service error: ${response.statusText} - ${errorText}`,
        output: `Execution service error: ${response.statusText}`,
        exitCode: 1,
        executionTimeMs: Date.now() - startTime,
        error: errorText,
      };
    }

    const data = await response.json();
    const endTime = Date.now();

    // Wandbox returns:
    //   status         → "0" on success (string!)
    //   compiler_error → compile-time errors
    //   program_output → combined stdout+stderr
    //   program_error  → runtime stderr

    const exitCode = parseInt(data.status ?? "1", 10);
    const stdout = data.program_output || "";

    if (data.compiler_error) {
      return {
        stdout: "",
        stderr: data.compiler_error,
        output: data.compiler_error,
        exitCode: exitCode || 1,
        executionTimeMs: endTime - startTime,
      };
    }

    return {
      stdout,
      stderr: data.program_error || "",
      output: stdout || data.program_error || "(No output)",
      exitCode,
      executionTimeMs: endTime - startTime,
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Execution failed";
    return {
      stdout: "",
      stderr: errorMessage,
      output: errorMessage,
      exitCode: 1,
      executionTimeMs: Date.now() - startTime,
      error: errorMessage,
    };
  }
}
