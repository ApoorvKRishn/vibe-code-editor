"use client"

import Editor from "@monaco-editor/react"
import { useTheme } from "next-themes"
import type { OpenFile } from "../hooks/useFileExplorer"
import { useEditorSettings } from "../hooks/useEditorSettings"
import { configureMonaco, defaultEditorOptions, getEditorLanguage } from "../lib/editor-config"

interface PlaygroundEditorProps {
  activeFile: OpenFile | undefined
  onContentChange: (value: string) => void
}

export const PlaygroundEditor = ({ activeFile, onContentChange }: PlaygroundEditorProps) => {
  const { resolvedTheme } = useTheme()
  const fontSize = useEditorSettings((state) => state.fontSize)

  return (
    <Editor
      height="100%"
      // A separate Monaco model per file keeps undo history and scroll position per tab.
      path={activeFile?.id}
      value={activeFile?.content ?? ""}
      onChange={(value) => onContentChange(value ?? "")}
      // beforeMount so our dark theme is defined before the editor first renders with it.
      beforeMount={configureMonaco}
      theme={resolvedTheme === "light" ? "vs" : "modern-dark"}
      language={activeFile ? getEditorLanguage(activeFile.fileExtension || "") : "plaintext"}
      // @ts-expect-error the options object includes a few Monaco keys missing from the types
      options={{ ...defaultEditorOptions, fontSize, lineHeight: Math.round(fontSize * 1.45) }}
    />
  )
}
