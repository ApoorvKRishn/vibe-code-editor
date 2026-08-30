"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { createWorkspace } from "../actions";
import { Plus, Sparkles } from "lucide-react";

const TEMPLATES = [
  {
    id: "javascript",
    name: "JavaScript",
    icon: "🟨",
    description: "Node.js environment with algorithms and utility scripts.",
  },
  {
    id: "typescript",
    name: "TypeScript",
    icon: "🔷",
    description: "Type-safe JavaScript environment with modern ES features.",
  },
  {
    id: "python",
    name: "Python 3",
    icon: "🐍",
    description: "Fast Python runtime for scripting, DSA, and problem solving.",
  },
  {
    id: "cpp",
    name: "C++ (DSA)",
    icon: "⚡",
    description: "Competitive programming setup with standard C++ library.",
  },
  {
    id: "java",
    name: "Java",
    icon: "☕",
    description: "Standard Java environment for OOP and system design practice.",
  },
  {
    id: "html",
    name: "Web Starter",
    icon: "🌐",
    description: "HTML5, CSS3, and JavaScript project with live preview.",
  },
];

export function CreateWorkspaceDialog({
  children,
  defaultLanguage,
}: {
  children?: React.ReactNode;
  defaultLanguage?: string;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [language, setLanguage] = useState(defaultLanguage || "javascript");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setLoading(true);
      const workspace = await createWorkspace({
        name: name.trim(),
        description: description.trim(),
        language,
      });

      setOpen(false);
      setName("");
      setDescription("");
      router.push(`/workspace/${workspace.id}`);
    } catch (error) {
      console.error("Failed to create workspace:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children ? (
        <DialogTrigger render={children as React.ReactElement} />
      ) : (
        <DialogTrigger
          render={
            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/20 font-medium">
              <Plus className="mr-2 h-4 w-4" />
              New Workspace
            </Button>
          }
        />
      )}
      <DialogContent className="sm:max-w-xl bg-zinc-900 border-zinc-800 text-zinc-100">
        <form onSubmit={handleCreate}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-white">
              <Sparkles className="h-5 w-5 text-blue-400" />
              Create New Workspace
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Choose your language stack and start coding in seconds.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-300">
                Workspace Name
              </label>
              <input
                type="text"
                placeholder="e.g. Algo-Visualizer, Python-Data-Script"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 bg-zinc-800/80 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-300">
                Description (Optional)
              </label>
              <input
                type="text"
                placeholder="Brief description of this project"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800/80 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="space-y-2 pt-2">
              <label className="text-sm font-medium text-zinc-300">
                Select Template / Environment
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {TEMPLATES.map((tmpl) => {
                  const isSelected = language === tmpl.id;
                  return (
                    <div
                      key={tmpl.id}
                      onClick={() => setLanguage(tmpl.id)}
                      className={`cursor-pointer p-3 rounded-lg border text-left transition-all ${
                        isSelected
                          ? "bg-blue-600/20 border-blue-500 text-white shadow-sm ring-1 ring-blue-500"
                          : "bg-zinc-800/40 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800/80"
                      }`}
                    >
                      <div className="text-2xl mb-1">{tmpl.icon}</div>
                      <div className="font-semibold text-sm text-zinc-200">
                        {tmpl.name}
                      </div>
                      <div className="text-xs text-zinc-400 line-clamp-2 mt-0.5">
                        {tmpl.description}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !name.trim()}
              className="bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-md"
            >
              {loading ? "Creating..." : "Create Workspace"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
