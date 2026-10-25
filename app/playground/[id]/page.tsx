"use client";

import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AIPanel } from "@/modules/playground/components/ai-panel";
import { PlaygroundEditor } from "@/modules/playground/components/playground-editor";
import { TemplateFileTree } from "@/modules/playground/components/playground-explorer";
import { RunPanel, formatRunOutput, type RunResult } from "@/modules/playground/components/run-panel";
import { SettingsMenu } from "@/modules/playground/components/settings-menu";
import { WebPreview } from "@/modules/playground/components/web-preview";
import { useFileExplorer } from "@/modules/playground/hooks/useFileExplorer";
import { usePlayground } from "@/modules/playground/hooks/usePlayground";
import { cloneTree, downloadFile, findFileByPath, getFileName, joinPath } from "@/modules/playground/lib";
import type { TemplateFile } from "@/modules/playground/lib/types";
import { getRunnableLanguage } from "@/modules/playground/lib/languages";
import { AlertCircle, ArrowLeft, Check, FileText, Loader2, X } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

// Auto-save runs this long after the user stops typing (debounce).
const AUTOSAVE_DELAY_MS = 1500;

type SaveStatus = "saved" | "unsaved" | "saving" | "error";

/** Each file keeps its own stdin and last output, so switching files never mixes them up. */
interface RunState {
  stdin: string;
  result: RunResult | null;
}

const EMPTY_RUN_STATE: RunState = { stdin: "", result: null };

const MainPlaygroundPage = () => {
  const { id } = useParams<{ id: string }>();
  const { playgroundData, templateData, isLoading, error, saveTemplateData } = usePlayground(id);

  const {
    templateData: fileTree,
    initialize,
    setPersist,
    setActiveFileId,
    activeFileId,
    closeFile,
    openFile,
    openFiles,
    saveFiles,
    handleAddFile,
    handleAddFolder,
    handleDuplicateFile,
    handleDeleteFile,
    handleDeleteFolder,
    handleRenameFile,
    handleRenameFolder,
    updateFileContent,
  } = useFileExplorer();

  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  // Keyed by file path. Only one program runs at a time.
  const [runStates, setRunStates] = useState<Record<string, RunState>>({});
  const [runningFileId, setRunningFileId] = useState<string | null>(null);

  const activeFile = openFiles.find((file) => file.id === activeFileId);
  const { stdin, result: runResult } = (activeFileId && runStates[activeFileId]) || EMPTY_RUN_STATE;
  const hasUnsavedChanges = openFiles.some((file) => file.hasUnsavedChanges);
  const runnableLanguage = activeFile ? getRunnableLanguage(activeFile.fileExtension) : null;

  // Load the project into the file explorer and open the main file.
  useEffect(() => {
    if (!templateData || !playgroundData) return;
    initialize(id, templateData);
    const mainFile = findFileByPath(templateData, playgroundData.mainFile);
    if (mainFile) openFile(mainFile, "");
  }, [id, templateData, playgroundData, initialize, openFile]);

  useEffect(() => {
    setPersist(saveTemplateData);
  }, [saveTemplateData, setPersist]);

  const save = useCallback(async () => {
    setSaveStatus("saving");
    try {
      await saveFiles();
      setSaveStatus("saved");
    } catch (error) {
      console.error("Error saving files:", error);
      setSaveStatus("error");
      toast.error("Failed to save");
    }
  }, [saveFiles]);

  // Auto-save: every edit restarts the timer, so we only save once typing pauses.
  useEffect(() => {
    if (!hasUnsavedChanges) return;
    setSaveStatus("unsaved");
    const timer = setTimeout(save, AUTOSAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [openFiles, hasUnsavedChanges, save]);

  // Ctrl+S saves immediately instead of waiting for auto-save.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        save();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [save]);

  // Warn before closing the tab while a save is still pending.
  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const updateRunState = useCallback((fileId: string, change: Partial<RunState>) => {
    setRunStates((prev) => ({
      ...prev,
      [fileId]: { ...(prev[fileId] ?? EMPTY_RUN_STATE), ...change },
    }));
  }, []);

  const handleRun = useCallback(async () => {
    if (!activeFile || !runnableLanguage) return;
    if (runningFileId) {
      toast.info("Wait for the current run to finish");
      return;
    }
    // Remember which file was run: the user may switch tabs before the output comes back.
    const fileId = activeFile.id;
    setRunningFileId(fileId);
    updateRunState(fileId, { result: null });
    try {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileExtension: activeFile.fileExtension,
          code: activeFile.content,
          stdin,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Run failed");
      updateRunState(fileId, { result: data });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Run failed");
    } finally {
      setRunningFileId(null);
    }
  }, [activeFile, runnableLanguage, runningFileId, stdin, updateRunState]);

  // Ctrl+Enter runs the file. Listening in the capture phase catches the keys
  // before Monaco does (it would otherwise insert a new line).
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        handleRun();
      }
    };
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [handleRun]);

  // Downloads include edits that haven't been auto-saved yet.
  const handleDownloadFile = (file: TemplateFile, parentPath: string) => {
    const filePath = joinPath(parentPath, getFileName(file));
    const content = openFiles.find((f) => f.id === filePath)?.content ?? file.content;
    downloadFile(getFileName(file), content);
  };

  // The preview shows unsaved edits too: overlay open files on the saved tree.
  const liveTree = useMemo(() => {
    if (!fileTree) return null;
    const tree = cloneTree(fileTree);
    for (const open of openFiles) {
      const file = findFileByPath(tree, open.id);
      if (file) file.content = open.content;
    }
    return tree;
  }, [fileTree, openFiles]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-full p-4">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-red-600 mb-2">Something went wrong</h2>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={() => window.location.reload()} variant="destructive">
          Try Again
        </Button>
      </div>
    );
  }

  if (isLoading || !fileTree || !liveTree) {
    return (
      <div className="flex items-center justify-center h-screen w-full gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading playground...
      </div>
    );
  }

  const isWebProject = playgroundData?.template === "WEB";
  const pageTitle = `${playgroundData?.title ?? "Playground"} · Vibe Code Editor`;

  return (
    <>
      <title>{pageTitle}</title>
      <TemplateFileTree
        data={fileTree}
        onFileSelect={openFile}
        selectedFileId={activeFileId ?? undefined}
        title="File Explorer"
        defaultExtension={playgroundData?.mainFile.split(".").pop()}
        footer={
          <SettingsMenu
            activeFileName={activeFile ? getFileName(activeFile) : null}
            onDownloadActiveFile={() =>
              activeFile && downloadFile(getFileName(activeFile), activeFile.content)
            }
          />
        }
        onAddFile={handleAddFile}
        onAddFolder={handleAddFolder}
        onDuplicateFile={handleDuplicateFile}
        onDownloadFile={handleDownloadFile}
        onDeleteFile={handleDeleteFile}
        onDeleteFolder={handleDeleteFolder}
        onRenameFile={handleRenameFile}
        onRenameFolder={handleRenameFolder}
      />
      <SidebarInset className="min-w-0">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" /> Dashboard
            </Link>
          </Button>
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-sm font-medium flex-1 truncate">
            {playgroundData?.title || "Code Playground"}
          </h1>
          <SaveIndicator status={saveStatus} />
        </header>

        <div className="h-[calc(100vh-3.5rem)]">
          <ResizablePanelGroup direction="horizontal" className="h-full">
            <ResizablePanel defaultSize={58} minSize={25}>
              <div className="h-full flex flex-col">
                {/* Tabs: one per open file */}
                <div className="flex border-b bg-muted/30 overflow-x-auto">
                  {openFiles.map((file) => (
                    <div
                      key={file.id}
                      title={file.id}
                      onClick={() => setActiveFileId(file.id)}
                      className={`group flex items-center gap-2 px-3 h-9 text-sm border-r cursor-pointer shrink-0 ${
                        file.id === activeFileId ? "bg-background" : "text-muted-foreground hover:bg-background/50"
                      }`}
                    >
                      <FileText className="h-3 w-3" />
                      {getFileName(file)}
                      {file.hasUnsavedChanges && <span className="h-2 w-2 rounded-full bg-orange-500" />}
                      <button
                        aria-label={`Close ${getFileName(file)}`}
                        className="opacity-0 group-hover:opacity-100 hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          closeFile(file.id);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex-1 min-h-0">
                  {activeFile ? (
                    <PlaygroundEditor
                      activeFile={activeFile}
                      onContentChange={(value) => updateFileContent(activeFile.id, value)}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                      Select a file from the explorer to start editing
                    </div>
                  )}
                </div>
              </div>
            </ResizablePanel>

            <ResizableHandle />

            <ResizablePanel defaultSize={42} minSize={20}>
              <Tabs defaultValue={isWebProject ? "preview" : "run"} className="h-full flex flex-col gap-0">
                <TabsList className="m-2">
                  <TabsTrigger value="run">Run</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                  <TabsTrigger value="ai">AI</TabsTrigger>
                </TabsList>
                {/* forceMount keeps each panel's state (chat, output) when switching tabs */}
                <TabsContent value="run" forceMount className="flex-1 min-h-0 data-[state=inactive]:hidden">
                  <RunPanel
                    languageLabel={runnableLanguage?.label ?? null}
                    stdin={stdin}
                    onStdinChange={(value) => activeFileId && updateRunState(activeFileId, { stdin: value })}
                    onRun={handleRun}
                    isRunning={runningFileId !== null && runningFileId === activeFileId}
                    result={runResult}
                  />
                </TabsContent>
                <TabsContent value="preview" forceMount className="flex-1 min-h-0 data-[state=inactive]:hidden">
                  <WebPreview files={liveTree} />
                </TabsContent>
                <TabsContent value="ai" forceMount className="flex-1 min-h-0 data-[state=inactive]:hidden">
                  <AIPanel
                    fileName={activeFile ? getFileName(activeFile) : null}
                    code={activeFile?.content ?? ""}
                    runOutput={runResult ? formatRunOutput(runResult) : ""}
                    onApplyCode={(code) => activeFile && updateFileContent(activeFile.id, code)}
                  />
                </TabsContent>
              </Tabs>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </SidebarInset>
    </>
  );
};

function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === "saving" || status === "unsaved") {
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" /> Saving...
      </span>
    );
  }
  if (status === "error") {
    return <span className="text-xs text-red-500">Save failed — press Ctrl+S to retry</span>;
  }
  return (
    <span className="flex items-center gap-1 text-xs text-muted-foreground">
      <Check className="h-3 w-3" /> Saved
    </span>
  );
}

export default MainPlaygroundPage;
