"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Clock, Cpu, Loader2, Play } from "lucide-react";

export interface RunResult {
  language: string;
  status: string;
  success: boolean;
  stdout: string;
  stderr: string;
  compileOutput: string;
  message: string;
  timeMs: number | null;
  memoryKb: number | null;
}

/** Everything the program printed, as one string (also sent to the AI as context). */
export const formatRunOutput = (result: RunResult) =>
  [result.compileOutput, result.stdout, result.stderr, result.message]
    .filter(Boolean)
    .join("\n")
    .trim();

interface RunPanelProps {
  languageLabel: string | null;
  stdin: string;
  onStdinChange: (value: string) => void;
  onRun: () => void;
  isRunning: boolean;
  result: RunResult | null;
}

export function RunPanel({
  languageLabel,
  stdin,
  onStdinChange,
  onRun,
  isRunning,
  result,
}: RunPanelProps) {
  return (
    <div className="h-full flex flex-col gap-3 p-3 overflow-auto">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-muted-foreground">
          {languageLabel ?? "Open a .cpp, .py, .java, .js, .ts, .go or .rs file to run it"}
        </span>
        <Button size="sm" onClick={onRun} disabled={!languageLabel || isRunning}>
          {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          Run
        </Button>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="stdin" className="text-xs font-medium text-muted-foreground">
          Input (stdin)
        </label>
        <Textarea
          id="stdin"
          value={stdin}
          onChange={(e) => onStdinChange(e.target.value)}
          placeholder="Text your program reads from standard input"
          className="font-mono text-sm min-h-20"
        />
      </div>

      <div className="flex flex-col gap-1 flex-1 min-h-32">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Output</span>
          {result && (
            <div className="flex items-center gap-3 text-xs">
              <span className={cn("font-medium", result.success ? "text-green-600" : "text-red-500")}>
                {result.status}
              </span>
              {result.timeMs !== null && (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-3 w-3" /> {result.timeMs} ms
                </span>
              )}
              {result.memoryKb !== null && (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Cpu className="h-3 w-3" /> {(result.memoryKb / 1024).toFixed(1)} MB
                </span>
              )}
            </div>
          )}
        </div>
        <pre
          className={cn(
            "flex-1 rounded-md border bg-muted/40 p-3 font-mono text-sm whitespace-pre-wrap break-words",
            result && !result.success && "text-red-500"
          )}
        >
          {isRunning
            ? "Running..."
            : result
              ? formatRunOutput(result) || "(no output)"
              : "Press Run to execute the current file."}
        </pre>
      </div>
    </div>
  );
}
