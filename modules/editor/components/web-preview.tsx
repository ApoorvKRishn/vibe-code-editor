"use client";

import React, { useMemo } from "react";
import { Globe } from "lucide-react";
import { FileItemData } from "../types";

interface WebPreviewProps {
  files: FileItemData[];
}

export function WebPreview({ files }: WebPreviewProps) {
  const htmlFile = files.find((f) => f.name.endsWith(".html") || f.name === "index.html");
  const cssFile = files.find((f) => f.name.endsWith(".css"));
  const jsFile = files.find((f) => f.name.endsWith(".js") && !f.name.includes("server"));

  const srcDoc = useMemo(() => {
    const html = htmlFile?.content || "<h1>Web Preview</h1><p>Add an index.html file to view.</p>";
    const css = cssFile ? `<style>${cssFile.content}</style>` : "";
    const js = jsFile ? `<script>${jsFile.content}<\/script>` : "";

    // Inject CSS into <head> or prepend
    let combined = html;
    if (css) {
      if (combined.includes("</head>")) {
        combined = combined.replace("</head>", `${css}</head>`);
      } else {
        combined = css + combined;
      }
    }
    if (js) {
      if (combined.includes("</body>")) {
        combined = combined.replace("</body>", `${js}</body>`);
      } else {
        combined = combined + js;
      }
    }

    return combined;
  }, [htmlFile, cssFile, jsFile]);

  return (
    <div className="h-full flex flex-col bg-[#0f172a] border-l border-zinc-800 select-none">
      {/* Header */}
      <div className="p-2.5 bg-[#1e293b] border-b border-zinc-700 flex items-center justify-between text-xs text-zinc-300">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-emerald-400" />
          <span className="font-semibold text-white">Live Web Preview</span>
        </div>
        <span className="text-[11px] text-zinc-400 font-mono">auto-reloading</span>
      </div>

      {/* Sandboxed iFrame Preview */}
      <div className="flex-1 bg-white">
        <iframe
          title="Live Preview"
          srcDoc={srcDoc}
          sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
          className="w-full h-full border-none"
        />
      </div>
    </div>
  );
}
