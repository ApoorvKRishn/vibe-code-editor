import { useState, useEffect, useCallback } from "react";

import type { TemplateFolder } from "../lib/types";
import { getPlaygroundById, SaveUpdatedCode } from "../actions";

interface PlaygroundData {
  id: string;
  title: string;
  template: string;
  /** Path of the file to open first, e.g. "main.py". */
  mainFile: string;
}

export const usePlayground = (id: string) => {
  const [playgroundData, setPlaygroundData] = useState<PlaygroundData | null>(null);
  /** The project's file tree as it was when the playground was loaded. */
  const [templateData, setTemplateData] = useState<TemplateFolder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPlayground = useCallback(async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      setError(null);

      const data = await getPlaygroundById(id);
      if (!data) {
        setError("This playground doesn't exist or you don't have access to it.");
        return;
      }

      setPlaygroundData({
        id: data.id,
        title: data.title,
        template: data.template,
        mainFile: data.mainFile,
      });
      setTemplateData(data.content);
    } catch (error) {
      console.error("Error loading playground:", error);
      setError("Failed to load playground data");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  const saveTemplateData = useCallback(
    async (data: TemplateFolder) => {
      await SaveUpdatedCode(id, data);
    },
    [id]
  );

  useEffect(() => {
    loadPlayground();
  }, [loadPlayground]);

  return { playgroundData, templateData, isLoading, error, saveTemplateData };
};
