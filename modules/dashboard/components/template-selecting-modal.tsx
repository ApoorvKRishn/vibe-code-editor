"use client";

import { useState } from "react";
import type { Templates } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { STARTERS } from "@/modules/playground/lib/languages";

type TemplateSelectionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { title: string; template: Templates; description?: string }) => void;
};

const TemplateSelectingModal = ({ isOpen, onClose, onSubmit }: TemplateSelectionModalProps) => {
  const [template, setTemplate] = useState<Templates>("PYTHON");
  const [title, setTitle] = useState("");

  const handleSubmit = () => {
    onSubmit({ title: title.trim() || `${STARTERS[template].label} project`, template });
    setTitle("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>New project</DialogTitle>
          <DialogDescription>Pick a language. You can add more files later.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(STARTERS) as Templates[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setTemplate(key)}
              className={cn(
                "text-left rounded-lg border p-3 transition-colors hover:bg-muted",
                template === key && "border-primary bg-muted"
              )}
            >
              <div className="font-medium text-sm">{STARTERS[key].label}</div>
              <div className="text-xs text-muted-foreground">{STARTERS[key].description}</div>
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <Label htmlFor="project-title">Project name</Label>
          <Input
            id="project-title"
            value={title}
            maxLength={100}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={`${STARTERS[template].label} project`}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TemplateSelectingModal;
