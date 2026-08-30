"use client";

import React, { useState } from "react";
import { FileItemData, detectLanguageFromFilename } from "../types";
import {
  FileCode,
  Folder,
  FolderOpen,
  FilePlus,
  FolderPlus,
  Trash2,
  Edit2,
  FileText,
  FileJson,
  Code2,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import {
  createFileOrFolder,
  deleteFileOrFolder,
  renameFileOrFolder,
} from "@/modules/files/actions";

interface FileTreeSidebarProps {
  workspaceId: string;
  files: FileItemData[];
  activeFileId: string | null;
  onSelectFile: (file: FileItemData) => void;
  onRefresh: () => Promise<void>;
}

function getFileIcon(filename: string) {
  const lang = detectLanguageFromFilename(filename);
  switch (lang) {
    case "javascript":
      return <span className="text-yellow-400 font-bold text-xs">JS</span>;
    case "typescript":
      return <span className="text-blue-400 font-bold text-xs">TS</span>;
    case "python":
      return <span className="text-emerald-400 font-bold text-xs">PY</span>;
    case "cpp":
      return <span className="text-cyan-400 font-bold text-xs">C++</span>;
    case "java":
      return <span className="text-orange-400 font-bold text-xs">JV</span>;
    case "html":
      return <span className="text-red-400 font-bold text-xs">&lt;&gt;</span>;
    case "css":
      return <span className="text-sky-400 font-bold text-xs">#</span>;
    case "json":
      return <FileJson className="h-4 w-4 text-amber-400" />;
    case "markdown":
      return <FileText className="h-4 w-4 text-slate-400" />;
    default:
      return <FileCode className="h-4 w-4 text-zinc-400" />;
  }
}

export function FileTreeSidebar({
  workspaceId,
  files,
  activeFileId,
  onSelectFile,
  onRefresh,
}: FileTreeSidebarProps) {
  const [creatingType, setCreatingType] = useState<"file" | "folder" | null>(null);
  const [newItemName, setNewItemName] = useState("");
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});

  const toggleFolder = (folderId: string) => {
    setCollapsedFolders((prev) => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !creatingType) return;

    try {
      const isFolder = creatingType === "folder";
      const sanitizedName = newItemName.trim();
      await createFileOrFolder({
        workspaceId,
        name: sanitizedName,
        path: `/${sanitizedName}`,
        isFolder,
        content: isFolder ? "" : "",
      });

      setNewItemName("");
      setCreatingType(null);
      await onRefresh();
    } catch (err) {
      console.error("Failed to create file/folder:", err);
    }
  };

  const handleRenameSubmit = async (file: FileItemData) => {
    if (!editName.trim() || editName === file.name) {
      setEditingFileId(null);
      return;
    }

    try {
      await renameFileOrFolder({
        fileId: file.id,
        newName: editName.trim(),
        newPath: `/${editName.trim()}`,
      });
      setEditingFileId(null);
      await onRefresh();
    } catch (err) {
      console.error("Failed to rename file:", err);
    }
  };

  const handleDelete = async (file: FileItemData, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete ${file.isFolder ? "folder" : "file"} "${file.name}"?`)) return;

    try {
      await deleteFileOrFolder({ fileId: file.id });
      await onRefresh();
    } catch (err) {
      console.error("Failed to delete file:", err);
    }
  };

  // Group files by root / folders
  const rootFiles = files.filter((f) => !f.parentId);

  return (
    <div className="h-full flex flex-col bg-[#0d1117] border-r border-zinc-800 text-zinc-300 select-none">
      {/* Sidebar Header */}
      <div className="p-3 border-b border-zinc-800/80 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
          <Code2 className="h-3.5 w-3.5 text-blue-400" />
          Explorer
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setCreatingType("file")}
            className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors"
            title="New File"
          >
            <FilePlus className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setCreatingType("folder")}
            className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors"
            title="New Folder"
          >
            <FolderPlus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Inline Creation Input */}
      {creatingType && (
        <form onSubmit={handleCreateSubmit} className="p-2 border-b border-zinc-800 bg-zinc-900/60">
          <div className="flex items-center gap-2">
            {creatingType === "file" ? (
              <FileCode className="h-4 w-4 text-blue-400 shrink-0" />
            ) : (
              <Folder className="h-4 w-4 text-amber-400 shrink-0" />
            )}
            <input
              type="text"
              autoFocus
              placeholder={creatingType === "file" ? "script.py, index.js..." : "folder name..."}
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onBlur={() => !newItemName && setCreatingType(null)}
              className="w-full bg-zinc-800 border border-blue-500 rounded px-2 py-0.5 text-xs text-white outline-none"
            />
          </div>
        </form>
      )}

      {/* File List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {rootFiles.length === 0 && !creatingType && (
          <div className="text-center py-8 text-xs text-zinc-400">
            No files in workspace. Click <FilePlus className="inline h-3 w-3" /> above to create one.
          </div>
        )}

        {rootFiles.map((file) => {
          const isActive = activeFileId === file.id;
          const isFolder = file.isFolder;
          const isCollapsed = collapsedFolders[file.id];

          if (editingFileId === file.id) {
            return (
              <div key={file.id} className="p-1">
                <input
                  type="text"
                  autoFocus
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRenameSubmit(file);
                    if (e.key === "Escape") setEditingFileId(null);
                  }}
                  onBlur={() => handleRenameSubmit(file)}
                  className="w-full bg-zinc-800 border border-blue-500 rounded px-2 py-0.5 text-xs text-white outline-none"
                />
              </div>
            );
          }

          return (
            <div
              key={file.id}
              onClick={() => {
                if (isFolder) {
                  toggleFolder(file.id);
                } else {
                  onSelectFile(file);
                }
              }}
              className={`group flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs cursor-pointer transition-colors ${
                isActive
                  ? "bg-blue-600/20 text-blue-300 font-medium border border-blue-500/30"
                  : "hover:bg-zinc-800/60 text-zinc-300 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {isFolder ? (
                  <>
                    {isCollapsed ? (
                      <ChevronRight className="h-3 w-3 text-zinc-400" />
                    ) : (
                      <ChevronDown className="h-3 w-3 text-zinc-400" />
                    )}
                    {isCollapsed ? (
                      <Folder className="h-4 w-4 text-amber-400 shrink-0" />
                    ) : (
                      <FolderOpen className="h-4 w-4 text-amber-400 shrink-0" />
                    )}
                  </>
                ) : (
                  <div className="w-4 h-4 flex items-center justify-center shrink-0">
                    {getFileIcon(file.name)}
                  </div>
                )}
                <span className="truncate">{file.name}</span>
              </div>

              {/* Actions on Hover */}
              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingFileId(file.id);
                    setEditName(file.name);
                  }}
                  className="p-0.5 hover:text-blue-400 text-zinc-400"
                  title="Rename"
                >
                  <Edit2 className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={(e) => handleDelete(file, e)}
                  className="p-0.5 hover:text-red-400 text-zinc-400"
                  title="Delete"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
