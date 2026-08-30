"use client";

import React, { useState } from "react";
import {
  Terminal as TerminalIcon,
  RotateCcw,
  Copy,
  Check,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { ExecutionResult } from "@/modules/execution/actions/execute-code";

interface TerminalConsoleProps {
  isRunning: boolean;
  result: ExecutionResult | null;
  stdin: string;
  onStdinChange: (val: string) => void;
  onClear: () => void;
  activeFileName?: string;
}

export function TerminalConsole({
  isRunning,
  result,
  stdin,
  onStdinChange,
  onClear,
  activeFileName,
}: TerminalConsoleProps) {
  const [activeTab, setActiveTab] = useState<"output" | "stdin" | "stats">("output");
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!result?.output) return;
    navigator.clipboard.writeText(result.output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col bg-[#0a0e17] border-t border-zinc-800 text-zinc-300 font-mono text-xs select-none">
      {/* Console Top Toolbar */}
      <div className="px-3 py-2 bg-[#0d111a] border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TerminalIcon className="h-4 w-4 text-emerald-400" />
          <span className="font-semibold text-zinc-200">Terminal</span>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 ml-4 bg-zinc-900 p-0.5 rounded-lg border border-zinc-800">
            <button
              type="button"
              onClick={() => setActiveTab("output")}
              className={`px-2.5 py-1 rounded text-xs transition-all ${
                activeTab === "output"
                  ? "bg-zinc-800 text-white font-medium shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Output
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("stdin")}
              className={`px-2.5 py-1 rounded text-xs transition-all flex items-center gap-1 ${
                activeTab === "stdin"
                  ? "bg-zinc-800 text-white font-medium shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Stdin Input {stdin.trim() && <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("stats")}
              className={`px-2.5 py-1 rounded text-xs transition-all ${
                activeTab === "stats"
                  ? "bg-zinc-800 text-white font-medium shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Metrics
            </button>
          </div>
        </div>

        {/* Action Controls & Status */}
        <div className="flex items-center gap-3">
          {isRunning && (
            <span className="flex items-center gap-1.5 text-amber-400 text-[11px] animate-pulse">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              Executing {activeFileName || "code"}...
            </span>
          )}

          {!isRunning && result && (
            <span
              className={`flex items-center gap-1 text-[11px] font-medium ${
                result.exitCode === 0 ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {result.exitCode === 0 ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                <AlertTriangle className="h-3.5 w-3.5" />
              )}
              Exit: {result.exitCode ?? 0} ({result.executionTimeMs}ms)
            </span>
          )}

          <button
            type="button"
            onClick={handleCopy}
            disabled={!result?.output}
            className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors disabled:opacity-30"
            title="Copy Output"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          </button>

          <button
            type="button"
            onClick={onClear}
            className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors"
            title="Clear Console"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Main Console Content */}
      <div className="flex-1 p-3 overflow-y-auto font-mono">
        {activeTab === "output" && (
          <div className="space-y-2 select-text">
            {!result && !isRunning && (
              <div className="text-zinc-600 italic">
                Press <span className="text-zinc-400 font-bold">Run (Ctrl+Enter)</span> to execute the active file. Output and errors will stream here.
              </div>
            )}

            {isRunning && (
              <div className="text-amber-400/80 animate-pulse">
                [Running program in sandboxed container...]
              </div>
            )}

            {result && (
              <>
                {result.stdout && (
                  <pre className="text-emerald-300/90 whitespace-pre-wrap leading-relaxed">
                    {result.stdout}
                  </pre>
                )}
                {result.stderr && (
                  <pre className="text-rose-400 whitespace-pre-wrap leading-relaxed mt-2 bg-red-950/20 p-2 rounded border border-red-900/40">
                    {result.stderr}
                  </pre>
                )}
                {!result.stdout && !result.stderr && (
                  <pre className="text-zinc-400 italic">(Process completed with no output)</pre>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === "stdin" && (
          <div className="h-full flex flex-col space-y-2">
            <div className="text-zinc-400 text-[11px]">
              Provide input to be passed to your program via standard input (`stdin` / `cin` / `input()`):
            </div>
            <textarea
              value={stdin}
              onChange={(e) => onStdinChange(e.target.value)}
              placeholder="e.g. Test case inputs, numbers separated by space or newline..."
              className="w-full flex-1 p-2.5 bg-zinc-900/80 border border-zinc-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
            />
          </div>
        )}

        {activeTab === "stats" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-lg">
                <div className="text-zinc-400 text-[11px]">Execution Time</div>
                <div className="text-base font-bold text-white mt-1">
                  {result ? `${result.executionTimeMs} ms` : "0 ms"}
                </div>
              </div>
              <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-lg">
                <div className="text-zinc-400 text-[11px]">Exit Code</div>
                <div
                  className={`text-base font-bold mt-1 ${
                    result?.exitCode === 0 ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {result?.exitCode ?? "N/A"}
                </div>
              </div>
              <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-lg">
                <div className="text-zinc-400 text-[11px]">Runner Status</div>
                <div className="text-base font-bold text-zinc-200 mt-1">
                  {isRunning ? "Executing" : result ? "Ready" : "Idle"}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
