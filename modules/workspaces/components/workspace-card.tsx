"use client";

import React, { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Trash2, FolderCode, Calendar, ArrowUpRight } from "lucide-react";
import { deleteWorkspace } from "../actions";
import { Button } from "@/components/ui/button";

const LANG_ICONS: Record<string, string> = {
  javascript: "🟨",
  typescript: "🔷",
  python: "🐍",
  cpp: "⚡",
  java: "☕",
  html: "🌐",
};

export interface WorkspaceItem {
  id: string;
  name: string;
  description: string | null;
  language: string;
  createdAt: Date;
  updatedAt: Date;
  files: { id: string; name: string; path: string; isFolder: boolean }[];
}

export function WorkspaceCard({ workspace }: { workspace: WorkspaceItem }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete "${workspace.name}"?`)) return;

    try {
      setDeleting(true);
      await deleteWorkspace(workspace.id);
    } catch (err) {
      console.error("Failed to delete workspace:", err);
      setDeleting(false);
    }
  };

  const icon = LANG_ICONS[workspace.language] || "💻";

  return (
    <Link
      href={`/workspace/${workspace.id}`}
      className="group relative block p-5 bg-zinc-900/90 hover:bg-zinc-900 border border-zinc-800 hover:border-blue-500/50 rounded-xl transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/5 backdrop-blur-sm"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl p-2 rounded-lg bg-zinc-800/80 border border-zinc-700/50">
            {icon}
          </span>
          <div>
            <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors flex items-center gap-1.5">
              {workspace.name}
              <ArrowUpRight className="h-4 w-4 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-blue-400" />
            </h3>
            <span className="text-xs uppercase tracking-wider font-mono text-zinc-400">
              {workspace.language}
            </span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          disabled={deleting}
          onClick={handleDelete}
          className="h-8 w-8 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          title="Delete Workspace"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {workspace.description && (
        <p className="text-xs text-zinc-400 line-clamp-2 mb-4">
          {workspace.description}
        </p>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80 text-xs text-zinc-400 font-mono">
        <span className="flex items-center gap-1">
          <FolderCode className="h-3.5 w-3.5" />
          {workspace.files.length} {workspace.files.length === 1 ? "file" : "files"}
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          {formatDistanceToNow(new Date(workspace.updatedAt), { addSuffix: true })}
        </span>
      </div>
    </Link>
  );
}
