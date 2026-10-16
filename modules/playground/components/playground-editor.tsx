"use client"

import { useRef, useEffect } from "react"
import Editor, { type Monaco } from "@monaco-editor/react"
import type { OpenFile } from "../hooks/useFileExplorer"
import { getFileName } from "../lib"
import { configureMonaco, defaultEditorOptions, getEditorLanguage } from "../lib/editor-config"

// Wait for the user to pause typing before asking the model for a completion.
const SUGGESTION_DEBOUNCE_MS = 600

interface PlaygroundEditorProps {
  activeFile: OpenFile | undefined
  content: string
  onContentChange: (value: string) => void
  suggestion: string | null
  suggestionLoading: boolean
  suggestionPosition: { line: number; column: number } | null
  onAcceptSuggestion: () => void
  onRejectSuggestion: () => void
  onTriggerSuggestion: (type: string, editor: any, fileName?: string) => void
}

export const PlaygroundEditor = ({
  activeFile,
  content,
  onContentChange,
  suggestion,
  suggestionLoading,
  suggestionPosition,
  onAcceptSuggestion,
  onRejectSuggestion,
  onTriggerSuggestion,
}: PlaygroundEditorProps) => {
  const editorRef = useRef<any>(null)
  const disposablesRef = useRef<{ dispose: () => void }[]>([])
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Monaco callbacks are registered once, so they read the latest values via refs.
  const suggestionRef = useRef<{ text: string; line: number; column: number } | null>(null)
  const callbacksRef = useRef({ onAcceptSuggestion, onRejectSuggestion, onTriggerSuggestion })
  const fileNameRef = useRef<string | undefined>(undefined)

  callbacksRef.current = { onAcceptSuggestion, onRejectSuggestion, onTriggerSuggestion }
  fileNameRef.current = activeFile ? getFileName(activeFile) : undefined

  // Show a newly arrived suggestion as ghost text.
  useEffect(() => {
    suggestionRef.current =
      suggestion && suggestionPosition
        ? { text: suggestion.replace(/\r/g, ""), ...suggestionPosition }
        : null

    const editor = editorRef.current
    if (!editor) return
    editor.trigger("ai", suggestionRef.current ? "editor.action.inlineSuggest.trigger" : "editor.action.inlineSuggest.hide", null)
  }, [suggestion, suggestionPosition])

  const handleEditorDidMount = (editor: any, monaco: Monaco) => {
    editorRef.current = editor
    configureMonaco(monaco)

    editor.updateOptions({
      ...defaultEditorOptions,
      inlineSuggest: { enabled: true, mode: "prefix" },
    })

    // Runs after Monaco inserts an accepted inline suggestion (Tab).
    const acceptCommandId = editor.addCommand(0, () => {
      suggestionRef.current = null
      callbacksRef.current.onAcceptSuggestion()
    })

    disposablesRef.current.push(
      monaco.languages.registerInlineCompletionsProvider("*", {
        provideInlineCompletions: (model: any, position: any) => {
          const current = suggestionRef.current
          if (!current || model !== editor.getModel()) return { items: [] }
          if (position.lineNumber !== current.line || position.column !== current.column) {
            return { items: [] }
          }
          return {
            items: [
              {
                insertText: current.text,
                range: new monaco.Range(current.line, current.column, current.line, current.column),
                command: { id: acceptCommandId, title: "Accept AI suggestion" },
              },
            ],
          }
        },
        freeInlineCompletions: () => {},
        // Newer Monaco versions call this instead of freeInlineCompletions.
        disposeInlineCompletions: () => {},
      } as any),
    )

    // Alt+\ asks for a suggestion right away (same shortcut as Copilot).
    editor.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.Backslash, () => {
      callbacksRef.current.onTriggerSuggestion("completion", editor, fileNameRef.current)
    })

    const clearPendingSuggestion = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      if (suggestionRef.current) {
        suggestionRef.current = null
        callbacksRef.current.onRejectSuggestion()
      }
    }

    disposablesRef.current.push(
      editor.onDidChangeModelContent((e: any) => {
        // Flushes come from switching files or programmatic updates, not typing.
        if (e.isFlush) return
        clearPendingSuggestion()
        debounceRef.current = setTimeout(() => {
          callbacksRef.current.onTriggerSuggestion("completion", editor, fileNameRef.current)
        }, SUGGESTION_DEBOUNCE_MS)
      }),
      editor.onDidChangeCursorPosition((e: any) => {
        const current = suggestionRef.current
        if (current && (e.position.lineNumber !== current.line || e.position.column !== current.column)) {
          clearPendingSuggestion()
        }
      }),
      editor.onDidChangeModel(clearPendingSuggestion),
      // Monaco hides the ghost text on Escape itself; drop our copy too.
      editor.onKeyDown((e: any) => {
        if (e.keyCode === monaco.KeyCode.Escape) clearPendingSuggestion()
      }),
    )
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      disposablesRef.current.forEach((d) => d.dispose())
      disposablesRef.current = []
    }
  }, [])

  return (
    <div className="h-full relative">
      {suggestionLoading && (
        <div className="absolute top-2 right-2 z-10 bg-red-100 dark:bg-red-900 px-2 py-1 rounded text-xs text-red-700 dark:text-red-300 flex items-center gap-1">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          AI thinking...
        </div>
      )}

      {suggestion && !suggestionLoading && (
        <div className="absolute top-2 right-2 z-10 bg-green-100 dark:bg-green-900 px-2 py-1 rounded text-xs text-green-700 dark:text-green-300 flex items-center gap-1">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          Tab to accept · Esc to dismiss
        </div>
      )}

      <Editor
        height="100%"
        // A separate model per file keeps undo history and scroll position per tab.
        path={activeFile?.id}
        value={content}
        onChange={(value) => onContentChange(value || "")}
        onMount={handleEditorDidMount}
        language={activeFile ? getEditorLanguage(activeFile.fileExtension || "") : "plaintext"}
        // @ts-ignore
        options={defaultEditorOptions}
      />
    </div>
  )
}
