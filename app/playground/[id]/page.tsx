"use client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import LoadingStep from "@/modules/playground/components/loader";
import {PlaygroundEditor} from "@/modules/playground/components/playground-editor";
import { TemplateFileTree } from "@/modules/playground/components/playground-explorer";
import ToggleAI from "@/modules/playground/components/toggle-ai";
import { useAISuggestions } from "@/modules/playground/hooks/useAISuggestion";
import { useFileExplorer } from "@/modules/playground/hooks/useFileExplorer";
import { usePlayground } from "@/modules/playground/hooks/usePlayground";
import { getFileName } from "@/modules/playground/lib";
import WebContainerPreview from "@/modules/webcontainers/components/webcontainer-preview";
import { useWebContainer } from "@/modules/webcontainers/hooks/useWebContainer";
import {
  AlertCircle,
  FileText,
  FolderOpen,
  Save,
  Settings,
  X,
} from "lucide-react";
import { useParams } from "next/navigation";
import React, {
  useCallback,
  useEffect,

  useState,
} from "react";
import { toast } from "sonner";

const MainPlaygroundPage = () => {
  const { id } = useParams<{ id: string }>();
  const [isPreviewVisible, setIsPreviewVisible] = useState(true);

  const { playgroundData, templateData, isLoading, error, saveTemplateData } =
    usePlayground(id);

  const aiSuggestions = useAISuggestions();

  const {
    templateData: fileTree,
    initialize,
    setPersist,
    setFsSync,
    setActiveFileId,
    activeFileId,
    closeAllFiles,
    closeFile,
    openFile,
    openFiles,
    saveFiles,
    handleAddFile,
    handleAddFolder,
    handleDeleteFile,
    handleDeleteFolder,
    handleRenameFile,
    handleRenameFolder,
    updateFileContent,
  } = useFileExplorer();

  const {
    serverUrl,
    isLoading: containerLoading,
    error: containerError,
    instance,
    setupStep,
    subscribeOutput,
  } = useWebContainer({ templateData });

  useEffect(() => {
    if (templateData) initialize(id, templateData);
  }, [id, templateData, initialize]);

  useEffect(() => {
    setPersist(saveTemplateData);
  }, [saveTemplateData, setPersist]);

  // Mirror explorer changes into the running WebContainer.
  useEffect(() => {
    if (!instance) {
      setFsSync(null);
      return;
    }
    setFsSync({
      writeFile: async (path, content) => {
        const folder = path.split("/").slice(0, -1).join("/");
        if (folder) await instance.fs.mkdir(folder, { recursive: true });
        await instance.fs.writeFile(path, content);
      },
      mkdir: async (path) => {
        await instance.fs.mkdir(path, { recursive: true });
      },
      rm: (path) => instance.fs.rm(path, { recursive: true, force: true }),
      rename: (oldPath, newPath) => instance.fs.rename(oldPath, newPath),
    });
    return () => setFsSync(null);
  }, [instance, setFsSync]);

  const activeFile = openFiles.find((file) => file.id === activeFileId);
  const hasUnsavedChanges = openFiles.some((file) => file.hasUnsavedChanges);

  const handleSave = useCallback(
    async (fileId?: string) => {
      const targetFile = openFiles.find((f) => f.id === (fileId ?? activeFileId));
      if (!targetFile) return;
      if (!targetFile.hasUnsavedChanges) {
        toast.info("No unsaved changes");
        return;
      }

      try {
        await saveFiles([targetFile.id]);
        toast.success(`Saved ${getFileName(targetFile)}`);
      } catch (error) {
        console.error("Error saving file:", error);
        toast.error(`Failed to save ${getFileName(targetFile)}`);
      }
    },
    [activeFileId, openFiles, saveFiles]
  );

  const handleSaveAll = useCallback(async () => {
    const unsavedCount = openFiles.filter((f) => f.hasUnsavedChanges).length;
    if (unsavedCount === 0) {
      toast.info("No unsaved changes");
      return;
    }

    try {
      await saveFiles();
      toast.success(`Saved ${unsavedCount} file(s)`);
    } catch (error) {
      console.error("Error saving files:", error);
      toast.error("Failed to save files");
    }
  }, [openFiles, saveFiles]);

  const handleCloseFile = (fileId: string) => {
    const file = openFiles.find((f) => f.id === fileId);
    if (
      file?.hasUnsavedChanges &&
      !window.confirm(`${getFileName(file)} has unsaved changes. Close it anyway?`)
    ) {
      return;
    }
    closeFile(fileId);
  };

  const handleCloseAllFiles = () => {
    if (
      hasUnsavedChanges &&
      !window.confirm("Some files have unsaved changes. Close them anyway?")
    ) {
      return;
    }
    closeAllFiles();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (e.shiftKey) {
          handleSaveAll();
        } else {
          handleSave();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSave, handleSaveAll]);

  // Warn before leaving the page with unsaved work.
  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] p-4">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-red-600 mb-2">
          Something went wrong
        </h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()} variant="destructive">
          Try Again
        </Button>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] p-4">
        <div className="w-full max-w-md p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-6 text-center">
            Loading Playground
          </h2>
          <div className="mb-8">
            <LoadingStep
              currentStep={1}
              step={1}
              label="Loading playground data"
            />
            <LoadingStep
              currentStep={2}
              step={2}
              label="Setting up environment"
            />
            <LoadingStep currentStep={3} step={3} label="Ready to code" />
          </div>
        </div>
      </div>
    );
  }

  // No template data
  if (!templateData) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] p-4">
        <FolderOpen className="h-12 w-12 text-amber-500 mb-4" />
        <h2 className="text-xl font-semibold text-amber-600 mb-2">
          No template data available
        </h2>
        <Button onClick={() => window.location.reload()} variant="outline">
          Reload Template
        </Button>
      </div>
    );
  }

  // The explorer store is filled from templateData right after loading.
  if (!fileTree) return null;

  const editorPanel =
    openFiles.length > 0 ? (
      <div className="h-full flex flex-col">
        <div className="border-b bg-muted/30">
          <Tabs value={activeFileId || ""} onValueChange={setActiveFileId}>
            <div className="flex items-center justify-between px-4 py-2 gap-2">
              <TabsList className="h-8 bg-transparent p-0 overflow-x-auto justify-start">
                {openFiles.map((file) => (
                  <TabsTrigger
                    key={file.id}
                    value={file.id}
                    title={file.id}
                    className="relative h-8 px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm group"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-3 w-3" />
                      <span>{getFileName(file)}</span>
                      {file.hasUnsavedChanges && (
                        <span className="h-2 w-2 rounded-full bg-orange-500" />
                      )}
                      <span
                        role="button"
                        aria-label={`Close ${getFileName(file)}`}
                        className="ml-2 h-4 w-4 hover:bg-destructive hover:text-destructive-foreground rounded-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCloseFile(file.id);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </span>
                    </div>
                  </TabsTrigger>
                ))}
              </TabsList>

              {openFiles.length > 1 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCloseAllFiles}
                  className="h-6 px-2 text-xs shrink-0"
                >
                  Close All
                </Button>
              )}
            </div>
          </Tabs>
        </div>
        <div className="flex-1 min-h-0">
          <PlaygroundEditor
            activeFile={activeFile}
            content={activeFile?.content || ""}
            onContentChange={(value) =>
              activeFileId && updateFileContent(activeFileId, value)
            }
            suggestion={aiSuggestions.suggestion}
            suggestionLoading={aiSuggestions.isLoading}
            suggestionPosition={aiSuggestions.position}
            onAcceptSuggestion={aiSuggestions.acceptSuggestion}
            onRejectSuggestion={aiSuggestions.rejectSuggestion}
            onTriggerSuggestion={aiSuggestions.fetchSuggestion}
          />
        </div>
      </div>
    ) : (
      <div className="flex flex-col h-full items-center justify-center text-muted-foreground gap-4">
        <FileText className="h-16 w-16 text-gray-300" />
        <div className="text-center">
          <p className="text-lg font-medium">No files open</p>
          <p className="text-sm text-gray-500">
            Select a file from the sidebar to start editing
          </p>
        </div>
      </div>
    );

  return (
    <TooltipProvider>
      <>
        <TemplateFileTree
          data={fileTree}
          onFileSelect={openFile}
          selectedFileId={activeFileId ?? undefined}
          title="File Explorer"
          onAddFile={handleAddFile}
          onAddFolder={handleAddFolder}
          onDeleteFile={handleDeleteFile}
          onDeleteFolder={handleDeleteFolder}
          onRenameFile={handleRenameFile}
          onRenameFolder={handleRenameFolder}
        />
        <SidebarInset className="min-w-0">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />

            <div className="flex flex-1 items-center gap-2">
              <div className="flex flex-col flex-1">
                <h1 className="text-sm font-medium">
                  {playgroundData?.title || "Code Playground"}
                </h1>
                <p className="text-xs text-muted-foreground">
                  {openFiles.length} File(s) Open
                  {hasUnsavedChanges && " • Unsaved changes"}
                </p>
              </div>

              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSave()}
                      disabled={!activeFile || !activeFile.hasUnsavedChanges}
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Save (Ctrl+S)</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleSaveAll}
                      disabled={!hasUnsavedChanges}
                    >
                      <Save className="h-4 w-4" /> All
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Save All (Ctrl+Shift+S)</TooltipContent>
                </Tooltip>

                <ToggleAI
                  isEnabled={aiSuggestions.isEnabled}
                  onToggle={aiSuggestions.toggleEnabled}
                  suggestionLoading={aiSuggestions.isLoading}
                />

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => setIsPreviewVisible(!isPreviewVisible)}
                    >
                      {isPreviewVisible ? "Hide" : "Show"} Preview
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleCloseAllFiles}>
                      Close All Files
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          <div className="h-[calc(100vh-4rem)]">
            <ResizablePanelGroup direction="horizontal" className="h-full">
              <ResizablePanel id="editor" order={1} defaultSize={50} minSize={20}>
                {editorPanel}
              </ResizablePanel>

              {isPreviewVisible && (
                <>
                  <ResizableHandle />
                  <ResizablePanel id="preview" order={2} defaultSize={50} minSize={20}>
                    <WebContainerPreview
                      isLoading={containerLoading}
                      error={containerError}
                      serverUrl={serverUrl}
                      setupStep={setupStep}
                      instance={instance}
                      subscribeOutput={subscribeOutput}
                    />
                  </ResizablePanel>
                </>
              )}
            </ResizablePanelGroup>
          </div>
        </SidebarInset>
      </>
    </TooltipProvider>
  );
};

export default MainPlaygroundPage;
