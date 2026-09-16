"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Github, FolderGit2, ArrowRight } from "lucide-react";

interface GithubRepoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    template: "REACT" | "NEXTJS" | "EXPRESS" | "VUE" | "HONO" | "ANGULAR";
    description?: string;
  }) => void;
}

export default function GithubRepoModal({
  isOpen,
  onClose,
  onSubmit,
}: GithubRepoModalProps) {
  const [repoUrl, setRepoUrl] = useState("");
  const [title, setTitle] = useState("");
  const [template, setTemplate] = useState<
    "REACT" | "NEXTJS" | "EXPRESS" | "VUE" | "HONO" | "ANGULAR"
  >("REACT");

  const handleRepoUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setRepoUrl(val);

    // Auto-extract repository name for title if empty or default
    if (val && !title) {
      const parts = val.replace(/\.git$/, "").split("/");
      const repoName = parts[parts.length - 1];
      if (repoName) {
        setTitle(repoName);
      }
    }
  };

  const handleImport = () => {
    const repoTitle = title.trim() || (repoUrl ? repoUrl.split("/").pop() || "GitHub Repo" : "GitHub Playground");
    onSubmit({
      title: repoTitle,
      template,
      description: repoUrl ? `Imported from ${repoUrl}` : "GitHub Repository Import",
    });

    // Reset state
    setRepoUrl("");
    setTitle("");
    setTemplate("REACT");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#e93f3f] flex items-center gap-2">
            <Github className="h-6 w-6 text-[#e93f3f]" />
            Import GitHub Repository
          </DialogTitle>
          <DialogDescription>
            Enter a public GitHub repository link to open and edit it in Vibe Code Editor.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5 py-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="repo-url" className="text-sm font-semibold flex items-center gap-2">
              <FolderGit2 className="h-4 w-4 text-primary" /> GitHub Repository URL
            </Label>
            <Input
              id="repo-url"
              placeholder="https://github.com/username/repository"
              value={repoUrl}
              onChange={handleRepoUrlChange}
            />
            <p className="text-xs text-muted-foreground">
              Supports any public GitHub repository (e.g. facebook/react).
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="playground-title" className="text-sm font-semibold">
              Playground Title
            </Label>
            <Input
              id="playground-title"
              placeholder="e.g. My GitHub Project"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="template-type" className="text-sm font-semibold">
              Framework Runner Template
            </Label>
            <Select
              value={template}
              onValueChange={(val) =>
                setTemplate(val as "REACT" | "NEXTJS" | "EXPRESS" | "VUE" | "HONO" | "ANGULAR")
              }
            >
              <SelectTrigger id="template-type">
                <SelectValue placeholder="Select runner template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="REACT">React (Vite / Node)</SelectItem>
                <SelectItem value="NEXTJS">Next.js</SelectItem>
                <SelectItem value="EXPRESS">Express.js (Node)</SelectItem>
                <SelectItem value="VUE">Vue.js</SelectItem>
                <SelectItem value="HONO">Hono Web API</SelectItem>
                <SelectItem value="ANGULAR">Angular</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Select the WebContainer runtime environment for this repository.
            </p>
          </div>
        </div>

        <div className="flex justify-between gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="bg-[#E93F3F] hover:bg-[#d03636] text-white flex items-center gap-2"
            onClick={handleImport}
          >
            Import Repository <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
