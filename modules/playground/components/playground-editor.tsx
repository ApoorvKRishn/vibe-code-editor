"use client"

import Editor, { type Monaco } from "@monaco-editor/react"
import type { OpenFile } from "../hooks/useFileExplorer"
import { configureMonaco, defaultEditorOptions, getEditorLanguage } from "../lib/editor-config"

interface PlaygroundEditorProps {
  activeFile: OpenFile | undefined
  onContentChange: (value: string) => void
}

export const PlaygroundEditor = ({ activeFile, onContentChange }: PlaygroundEditorProps) => {
  return (
    <Editor
      height="100%"
      // A separate Monaco model per file keeps undo history and scroll position per tab.
      path={activeFile?.id}
      value={activeFile?.content ?? ""}
      onChange={(value) => onContentChange(value ?? "")}
      onMount={(_editor, monaco: Monaco) => configureMonaco(monaco)}
      language={activeFile ? getEditorLanguage(activeFile.fileExtension || "") : "plaintext"}
      // @ts-expect-error the options object includes a few Monaco keys missing from the types
      options={defaultEditorOptions}
    />
  )
}
