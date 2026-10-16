"use client";
import React, { useState } from "react";

import { CheckCircle, Loader2, RotateCw, XCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

import { WebContainer } from "@webcontainer/api";
import dynamic from "next/dynamic";
import type { SetupStep } from "../hooks/useWebContainer";

const TerminalComponent = dynamic(() => import("./terminal"), { ssr: false });

interface WebContainerPreviewProps {
  serverUrl: string | null;
  isLoading: boolean;
  error: string | null;
  setupStep: SetupStep;
  instance: WebContainer | null;
  subscribeOutput: (listener: (data: string) => void) => () => void;
}

const STEPS: { step: SetupStep; label: string }[] = [
  { step: "mounting", label: "Mounting files" },
  { step: "installing", label: "Installing dependencies" },
  { step: "starting", label: "Starting development server" },
];

const stepIndex = (step: SetupStep) => {
  if (step === "ready") return STEPS.length;
  const index = STEPS.findIndex((s) => s.step === step);
  return index === -1 ? 0 : index;
};

const WebContainerPreview = ({
  error,
  instance,
  isLoading,
  serverUrl,
  setupStep,
  subscribeOutput,
}: WebContainerPreviewProps) => {
  const [reloadKey, setReloadKey] = useState(0);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md p-6 rounded-lg bg-gray-50 dark:bg-gray-900">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <h3 className="text-lg font-medium">Initializing WebContainer</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Setting up the environment for your project...
          </p>
        </div>
      </div>
    );
  }

  const currentIndex = stepIndex(setupStep);

  const renderStep = (index: number, label: string) => {
    const isComplete = index < currentIndex;
    const isActive = index === currentIndex && !error;
    return (
      <div key={label} className="flex items-center gap-3">
        {isComplete ? (
          <CheckCircle className="h-5 w-5 text-green-500" />
        ) : isActive ? (
          <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
        ) : (
          <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
        )}
        <span
          className={`text-sm font-medium ${
            isComplete ? "text-green-600" : isActive ? "text-blue-600" : "text-gray-500"
          }`}
        >
          {label}
        </span>
      </div>
    );
  };

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex-1 min-h-0 flex flex-col">
        {serverUrl ? (
          <>
            <div className="flex items-center gap-2 border-b px-2 py-1">
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                title="Reload preview"
                onClick={() => setReloadKey((k) => k + 1)}
              >
                <RotateCw className="h-3 w-3" />
              </Button>
              <span className="text-xs text-muted-foreground truncate">{serverUrl}</span>
            </div>
            <iframe
              key={reloadKey}
              src={serverUrl}
              className="w-full flex-1 border-none"
              title="WebContainer Preview"
            />
          </>
        ) : (
          <div className="w-full max-w-md p-6 m-5 rounded-lg bg-white dark:bg-zinc-800 shadow-sm mx-auto">
            {error ? (
              <div className="text-red-600 dark:text-red-400">
                <div className="flex items-center gap-2 mb-3">
                  <XCircle className="h-5 w-5" />
                  <h3 className="font-semibold">Preview failed</h3>
                </div>
                <p className="text-sm">{error}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Check the terminal below for details.
                </p>
              </div>
            ) : (
              <>
                <Progress
                  value={(currentIndex / STEPS.length) * 100}
                  className="h-2 mb-6"
                />
                <div className="space-y-4">
                  {STEPS.map(({ label }, index) => renderStep(index, label))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Kept at a stable position so it isn't remounted when the preview appears. */}
      <div className="h-64 shrink-0 border-t p-2">
        <TerminalComponent
          webContainerInstance={instance}
          subscribeOutput={subscribeOutput}
          theme="dark"
          className="h-full"
        />
      </div>
    </div>
  );
};

export default WebContainerPreview;
