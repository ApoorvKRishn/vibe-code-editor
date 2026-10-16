"use client";

import { useEffect, useState } from "react";
import type { TemplateFolder } from "../lib/types";
import { buildPreviewHtml } from "../lib/build-preview";

// Wait until the user stops typing before reloading the preview.
const PREVIEW_DELAY_MS = 500;

export function WebPreview({ files }: { files: TemplateFolder }) {
  const [html, setHtml] = useState<string | null>(() => buildPreviewHtml(files));

  useEffect(() => {
    const timer = setTimeout(() => setHtml(buildPreviewHtml(files)), PREVIEW_DELAY_MS);
    return () => clearTimeout(timer);
  }, [files]);

  if (html === null) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-muted-foreground p-4 text-center">
        Add an index.html file at the top level of the project to see a preview.
      </div>
    );
  }

  return (
    // sandbox without "allow-same-origin" runs the page's scripts in an isolated
    // origin, so they cannot read this app's cookies or call our API as the user.
    <iframe
      title="Preview"
      srcDoc={html}
      sandbox="allow-scripts allow-modals"
      className="h-full w-full bg-white border-0"
    />
  );
}
