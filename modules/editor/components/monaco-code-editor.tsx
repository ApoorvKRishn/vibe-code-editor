"use client";

import React, { useState, useEffect, useRef } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import { FileItemData, detectLanguageFromFilename } from "../types";
import {
  X,
  Check,
  Sparkles,
  FileCode,
} from "lucide-react";
import { updateFileContent } from "@/modules/files/actions";

interface MonacoCodeEditorProps {
  files: FileItemData[];
  openFileIds: string[];
  activeFileId: string | null;
  onSelectTab: (fileId: string) => void;
  onCloseTab: (fileId: string) => void;
  onContentChange: (fileId: string, newContent: string) => void;
  onRunCode: () => void;
  onToggleAIChat: () => void;
  showAIChat: boolean;
}

export function MonacoCodeEditor({
  files,
  openFileIds,
  activeFileId,
  onSelectTab,
  onCloseTab,
  onContentChange,
  onRunCode,
  onToggleAIChat,
  showAIChat,
}: MonacoCodeEditorProps) {
  const [theme, setTheme] = useState<"vs-dark" | "light">("vs-dark");
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);

  const activeFile = files.find((f) => f.id === activeFileId);
  const activeLanguage = activeFile ? detectLanguageFromFilename(activeFile.name) : "plaintext";

  // Handle Monaco Editor Mount
  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Add keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleManualSave();
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      onRunCode();
    });
  };

  const handleManualSave = async () => {
    if (!activeFile) return;
    try {
      setSaveStatus("saving");
      await updateFileContent({
        fileId: activeFile.id,
        content: activeFile.content,
      });
      setSaveStatus("saved");
    } catch (err) {
      console.error("Save error:", err);
      setSaveStatus("unsaved");
    }
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value === undefined || !activeFile) return;
    onContentChange(activeFile.id, value);
    setSaveStatus("unsaved");
  };

  // Debounced auto-save effect
  useEffect(() => {
    if (saveStatus !== "unsaved" || !activeFile) return;

    const timer = setTimeout(async () => {
      try {
        setSaveStatus("saving");
        await updateFileContent({
          fileId: activeFile.id,
          content: activeFile.content,
        });
        setSaveStatus("saved");
      } catch (err) {
        console.error("Auto-save failed:", err);
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [activeFile, saveStatus]);

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e] select-none">
      {/* Tab Navigation Bar */}
      <div className="flex items-center justify-between bg-[#181818] border-b border-zinc-800 text-xs px-2 select-none overflow-x-auto">
        <div className="flex items-center space-x-0.5 overflow-x-auto no-scrollbar">
          {openFileIds.map((fileId) => {
            const file = files.find((f) => f.id === fileId);
            if (!file) return null;
            const isActive = file.id === activeFileId;

            return (
              <div
                key={file.id}
                onClick={() => onSelectTab(file.id)}
                className={`group flex items-center gap-2 px-3 py-2 border-t-2 text-xs font-mono cursor-pointer transition-colors ${
                  isActive
                    ? "bg-[#1e1e1e] border-blue-500 text-white font-medium shadow-sm"
                    : "bg-[#141414] border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-[#1a1a1a]"
                }`}
              >
                <span className="truncate max-w-[120px]">{file.name}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseTab(file.id);
                  }}
                  className="p-0.5 hover:bg-zinc-700/60 rounded text-zinc-500 hover:text-white transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Editor Controls / Toolbar */}
        <div className="flex items-center gap-2 py-1 shrink-0">
          {/* Save Status Badge */}
          <span className="text-[11px] font-mono text-zinc-400 flex items-center gap-1">
            {saveStatus === "saved" && (
              <span className="flex items-center text-emerald-400">
                <Check className="h-3 w-3 mr-0.5" /> Saved
              </span>
            )}
            {saveStatus === "saving" && (
              <span className="text-amber-400 animate-pulse">Saving...</span>
            )}
            {saveStatus === "unsaved" && (
              <span className="text-zinc-500">Unsaved edits</span>
            )}
          </span>

          {/* Theme Selector */}
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as "vs-dark" | "light")}
            className="bg-zinc-800 text-zinc-300 border border-zinc-700 rounded px-2 py-0.5 text-[11px] focus:outline-none"
          >
            <option value="vs-dark">VS Dark</option>
            <option value="light">Light</option>
          </select>

          {/* AI Copilot Toggle Button */}
          <button
            type="button"
            onClick={onToggleAIChat}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
              showAIChat
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white border border-zinc-700"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Vibe AI
          </button>
        </div>
      </div>

      {/* Monaco Editor Workspace */}
      <div className="flex-1 relative overflow-hidden">
        {activeFile ? (
          <Editor
            height="100%"
            language={activeLanguage}
            value={activeFile.content}
            theme={theme}
            onChange={handleEditorChange}
            onMount={handleEditorDidMount}
            options={{
              fontSize: 14,
              minimap: { enabled: false },
              wordWrap: "on",
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              formatOnPaste: true,
              formatOnType: true,
              fontFamily: "'Geist Mono', 'Fira Code', Menlo, Monaco, 'Courier New', monospace",
              fontLigatures: true,
              cursorBlinking: "smooth",
              smoothScrolling: true,
              padding: { top: 12, bottom: 12 },
            }}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-2">
            <FileCode className="h-8 w-8 text-zinc-600" />
            <div className="text-sm font-medium">No file selected</div>
            <div className="text-xs">Choose a file from the explorer sidebar to begin editing</div>
          </div>
        )}
      </div>
    </div>
  );
}
