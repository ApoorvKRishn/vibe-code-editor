"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileItemData, WorkspaceData, detectLanguageFromFilename } from "../types";
import { FileTreeSidebar } from "./file-tree-sidebar";
import { MonacoCodeEditor } from "./monaco-code-editor";
import { TerminalConsole } from "./terminal-console";
import { AICopilotPanel } from "./ai-copilot-panel";
import { WebPreview } from "./web-preview";
import UserButton from "@/modules/auth/components/user-button";
import { executeCode, ExecutionResult } from "@/modules/execution/actions/execute-code";
import { updateWorkspace } from "@/modules/workspaces/actions";
import {
  Code2,
  Play,
  ArrowLeft,
  Sparkles,
  Globe,
  Share2,
  Check,
  Edit2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface WorkspaceIDEProps {
  initialWorkspace: WorkspaceData;
}

// ──────────────────────────────────────────────
// Drag-handle hook — handles mouse drag resizing
// ──────────────────────────────────────────────
function useDrag(
  direction: "horizontal" | "vertical",
  onDelta: (delta: number) => void
) {
  const dragging = useRef(false);
  const last = useRef(0);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dragging.current = true;
      last.current = direction === "horizontal" ? e.clientX : e.clientY;

      const onMove = (ev: MouseEvent) => {
        if (!dragging.current) return;
        const cur = direction === "horizontal" ? ev.clientX : ev.clientY;
        onDelta(cur - last.current);
        last.current = cur;
      };
      const onUp = () => {
        dragging.current = false;
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [direction, onDelta]
  );

  return onMouseDown;
}

export function WorkspaceIDE({ initialWorkspace }: WorkspaceIDEProps) {
  const [workspace, setWorkspace] = useState<WorkspaceData>(initialWorkspace);
  const [files, setFiles] = useState<FileItemData[]>(initialWorkspace.files);
  const [openFileIds, setOpenFileIds] = useState<string[]>(() => {
    const firstFile = initialWorkspace.files.find((f) => !f.isFolder);
    return firstFile ? [firstFile.id] : [];
  });
  const [activeFileId, setActiveFileId] = useState<string | null>(() => {
    const firstFile = initialWorkspace.files.find((f) => !f.isFolder);
    return firstFile ? firstFile.id : null;
  });

  // Runner state
  const [isRunning, setIsRunning] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [stdin, setStdin] = useState("");

  // UI toggles
  const [showAIChat, setShowAIChat] = useState(true);
  const [showWebPreview, setShowWebPreview] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(initialWorkspace.name);
  const [copiedLink, setCopiedLink] = useState(false);

  // Panel sizes (percentages of total width/height)
  const [leftWidth, setLeftWidth] = useState(18);   // file tree %
  const [rightWidth, setRightWidth] = useState(28); // AI panel %
  const [editorHeight, setEditorHeight] = useState(65); // editor % of center

  const containerRef = useRef<HTMLDivElement>(null);
  const centerRef = useRef<HTMLDivElement>(null);

  const router = useRouter();

  const activeFile = files.find((f) => f.id === activeFileId);
  const activeLanguage = activeFile
    ? detectLanguageFromFilename(activeFile.name)
    : workspace.language;

  const isWebProject =
    workspace.language === "html" || files.some((f) => f.name.endsWith(".html"));

  // ── Drag handlers ──────────────────────────────
  const onLeftDrag = useDrag("horizontal", (delta) => {
    const w = containerRef.current?.offsetWidth ?? 1;
    setLeftWidth((prev) => Math.min(32, Math.max(14, prev + (delta / w) * 100)));
  });

  const onRightDrag = useDrag("horizontal", (delta) => {
    const w = containerRef.current?.offsetWidth ?? 1;
    setRightWidth((prev) => Math.min(48, Math.max(18, prev - (delta / w) * 100)));
  });

  const onVerticalDrag = useDrag("vertical", (delta) => {
    const h = centerRef.current?.offsetHeight ?? 1;
    setEditorHeight((prev) => Math.min(80, Math.max(20, prev + (delta / h) * 100)));
  });

  // ── File & tab operations ───────────────────────
  const handleSelectFile = (file: FileItemData) => {
    if (file.isFolder) return;
    if (!openFileIds.includes(file.id)) {
      setOpenFileIds((prev) => [...prev, file.id]);
    }
    setActiveFileId(file.id);
  };

  const handleCloseTab = (fileId: string) => {
    const nextOpen = openFileIds.filter((id) => id !== fileId);
    setOpenFileIds(nextOpen);
    if (activeFileId === fileId) {
      setActiveFileId(nextOpen.length > 0 ? nextOpen[nextOpen.length - 1] : null);
    }
  };

  const handleContentChange = (fileId: string, newContent: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, content: newContent } : f))
    );
  };

  // ── Code Execution ──────────────────────────────
  const handleRunCode = useCallback(async () => {
    if (!activeFile || isRunning) return;
    try {
      setIsRunning(true);
      const result = await executeCode({
        language: activeLanguage,
        code: activeFile.content,
        stdin: stdin.trim(),
      });
      setExecutionResult(result);
    } catch (err) {
      console.error("Execution failure:", err);
      setExecutionResult({
        stdout: "",
        stderr: "Failed to execute code",
        output: "Execution failed",
        exitCode: 1,
        executionTimeMs: 0,
      });
    } finally {
      setIsRunning(false);
    }
  }, [activeFile, activeLanguage, isRunning, stdin]);

  const handleApplyCodeFromAI = (newCode: string) => {
    if (!activeFileId) return;
    handleContentChange(activeFileId, newCode);
  };

  const handleRefresh = async () => router.refresh();

  const handleRenameWorkspace = async () => {
    if (!titleInput.trim() || titleInput === workspace.name) {
      setIsEditingTitle(false);
      return;
    }
    try {
      const updated = await updateWorkspace(workspace.id, titleInput.trim());
      setWorkspace((prev) => ({ ...prev, name: updated.name }));
      setIsEditingTitle(false);
    } catch (err) {
      console.error("Failed to rename workspace:", err);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Keyboard shortcut: Ctrl+Enter → Run
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleRunCode();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleRunCode]);

  // Center panel width
  const showRight = showAIChat || showWebPreview;
  const centerWidth = 100 - leftWidth - (showRight ? rightWidth : 0);

  return (
    <div className="h-screen flex flex-col bg-[#0b0f19] text-zinc-100 overflow-hidden font-sans">

      {/* ── Top Navbar ────────────────────────────────── */}
      <header className="h-12 bg-[#090d16] border-b border-zinc-800 px-4 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
            title="Back to Workspaces"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="h-4 w-px bg-zinc-800" />
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-blue-600/30 text-blue-400 flex items-center justify-center">
              <Code2 className="h-3.5 w-3.5" />
            </div>
            {isEditingTitle ? (
              <input
                type="text"
                autoFocus
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onBlur={handleRenameWorkspace}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRenameWorkspace();
                  if (e.key === "Escape") setIsEditingTitle(false);
                }}
                className="bg-zinc-800 text-sm font-semibold text-white px-2 py-0.5 rounded border border-blue-500 outline-none"
              />
            ) : (
              <button
                type="button"
                onClick={() => setIsEditingTitle(true)}
                className="font-bold text-sm text-white hover:text-blue-400 flex items-center gap-1.5 group transition-colors"
              >
                <span>{workspace.name}</span>
                <Edit2 className="h-3 w-3 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            )}
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400 border border-zinc-700/50">
              {workspace.language}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleRunCode}
            disabled={isRunning || !activeFile}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold shadow-lg shadow-emerald-500/20 px-4 h-8 text-xs gap-1.5 cursor-pointer"
          >
            {isRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5 fill-white" />}
            Run
            <kbd className="hidden sm:inline-block ml-1 text-[10px] font-mono bg-black/20 px-1.5 py-0.5 rounded text-emerald-200">
              Ctrl+Enter
            </kbd>
          </Button>

          {isWebProject && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowWebPreview((p) => !p)}
              className={`h-8 text-xs gap-1.5 border-zinc-700 ${
                showWebPreview ? "bg-emerald-600/20 text-emerald-400 border-emerald-500/40" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
              }`}
            >
              <Globe className="h-3.5 w-3.5" />
              Web Preview
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowAIChat((p) => !p)}
            className={`h-8 text-xs gap-1.5 border-zinc-700 ${
              showAIChat ? "bg-blue-600/20 text-blue-400 border-blue-500/40" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-blue-400" />
            Vibe AI
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleShare}
            className="h-8 text-xs gap-1 text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Share2 className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{copiedLink ? "Copied" : "Share"}</span>
          </Button>
          <UserButton />
        </div>
      </header>

      {/* ── Main IDE Body (horizontal split) ──────────── */}
      <div ref={containerRef} className="flex-1 flex min-h-0 overflow-hidden select-none">

        {/* LEFT: File Tree */}
        <div style={{ width: `${leftWidth}%`, minWidth: "160px" }} className="h-full flex-shrink-0 overflow-hidden">
          <FileTreeSidebar
            workspaceId={workspace.id}
            files={files}
            activeFileId={activeFileId}
            onSelectFile={handleSelectFile}
            onRefresh={handleRefresh}
          />
        </div>

        {/* DRAG HANDLE: Left ↔ Center */}
        <div
          onMouseDown={onLeftDrag}
          className="w-1 h-full flex-shrink-0 bg-zinc-800 hover:bg-blue-500 active:bg-blue-400 cursor-col-resize transition-colors z-10"
          title="Drag to resize"
        />

        {/* CENTER: Editor + Terminal (vertical split) */}
        <div
          ref={centerRef}
          style={{ width: `${centerWidth}%` }}
          className="h-full flex flex-col min-w-0 overflow-hidden"
        >
          {/* Editor */}
          <div style={{ height: `${editorHeight}%` }} className="flex-shrink-0 overflow-hidden">
            <MonacoCodeEditor
              files={files}
              openFileIds={openFileIds}
              activeFileId={activeFileId}
              onSelectTab={setActiveFileId}
              onCloseTab={handleCloseTab}
              onContentChange={handleContentChange}
              onRunCode={handleRunCode}
              onToggleAIChat={() => setShowAIChat((p) => !p)}
              showAIChat={showAIChat}
            />
          </div>

          {/* DRAG HANDLE: Editor ↕ Terminal */}
          <div
            onMouseDown={onVerticalDrag}
            className="h-1 w-full flex-shrink-0 bg-zinc-800 hover:bg-blue-500 active:bg-blue-400 cursor-row-resize transition-colors z-10"
            title="Drag to resize"
          />

          {/* Terminal */}
          <div style={{ height: `${100 - editorHeight}%` }} className="flex-shrink-0 overflow-hidden">
            <TerminalConsole
              isRunning={isRunning}
              result={executionResult}
              stdin={stdin}
              onStdinChange={setStdin}
              onClear={() => setExecutionResult(null)}
              activeFileName={activeFile?.name}
            />
          </div>
        </div>

        {/* DRAG HANDLE: Center ↔ Right (only when right panel visible) */}
        {showRight && (
          <div
            onMouseDown={onRightDrag}
            className="w-1 h-full flex-shrink-0 bg-zinc-800 hover:bg-blue-500 active:bg-blue-400 cursor-col-resize transition-colors z-10"
            title="Drag to resize"
          />
        )}

        {/* RIGHT: AI Copilot or Web Preview */}
        {showRight && (
          <div style={{ width: `${rightWidth}%`, minWidth: "220px" }} className="h-full flex-shrink-0 overflow-hidden">
            {showWebPreview ? (
              <WebPreview files={files} />
            ) : (
              <AICopilotPanel
                activeFileName={activeFile?.name}
                activeFileContent={activeFile?.content}
                language={activeLanguage}
                onApplyCode={handleApplyCodeFromAI}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
