import { useState, useEffect, useCallback } from "react";

import type { TemplateFolder } from "../lib/path-to-json";
import { getPlaygroundById, SaveUpdatedCode } from "../actions";

interface PlaygroundData {
  id: string;
  title: string;
  template: string;
}

interface UsePlaygroundReturn {
  playgroundData: PlaygroundData | null;
  /** The project's file tree as it was when the playground was loaded. */
  templateData: TemplateFolder | null;
  isLoading: boolean;
  error: string | null;
  loadPlayground: () => Promise<void>;
  saveTemplateData: (data: TemplateFolder) => Promise<void>;
}

export const usePlayground = (id: string): UsePlaygroundReturn => {
  const [playgroundData, setPlaygroundData] = useState<PlaygroundData | null>(
    null
  );
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

      setPlaygroundData({ id: data.id, title: data.title, template: data.template });

      if (data.content) {
        setTemplateData(data.content);
        return;
      }

      // Nothing saved yet: start from the starter template.
      const res = await fetch(`/api/template/${id}`);
      if (!res.ok) throw new Error(`Failed to load template: ${res.status}`);

      const templateRes = await res.json();
      setTemplateData(templateRes.templateJson);
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

  return {
    playgroundData,
    templateData,
    isLoading,
    error,
    loadPlayground,
    saveTemplateData,
  };
};
