import { useState, useCallback, useRef, useEffect } from "react";

interface AISuggestionsState {
  suggestion: string | null;
  isLoading: boolean;
  position: { line: number; column: number } | null;
  isEnabled: boolean;
}

interface UseAISuggestionsReturn extends AISuggestionsState {
  toggleEnabled: () => void;
  fetchSuggestion: (type: string, editor: any, fileName?: string) => Promise<void>;
  /** The editor inserts the text itself; this just clears the suggestion. */
  acceptSuggestion: () => void;
  rejectSuggestion: () => void;
}

const EMPTY_SUGGESTION = { suggestion: null, position: null } as const;

export const useAISuggestions = (): UseAISuggestionsReturn => {
  const [state, setState] = useState<AISuggestionsState>({
    suggestion: null,
    isLoading: false,
    position: null,
    isEnabled: true,
  });

  const isEnabledRef = useRef(state.isEnabled);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    isEnabledRef.current = state.isEnabled;
  }, [state.isEnabled]);

  // Cancel any in-flight request when the editor unmounts.
  useEffect(() => () => abortRef.current?.abort(), []);

  const toggleEnabled = useCallback(() => {
    setState((prev) => {
      if (prev.isEnabled) abortRef.current?.abort();
      return {
        ...prev,
        ...EMPTY_SUGGESTION,
        isLoading: false,
        isEnabled: !prev.isEnabled,
      };
    });
  }, []);

  const fetchSuggestion = useCallback(
    async (type: string, editor: any, fileName?: string) => {
      if (!isEnabledRef.current || !editor) return;

      const model = editor.getModel();
      const cursorPosition = editor.getPosition();
      if (!model || !cursorPosition) return;

      // Only the newest request matters; drop the previous one.
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setState((prev) => ({ ...prev, ...EMPTY_SUGGESTION, isLoading: true }));

      try {
        const response = await fetch("/api/code-completion", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            fileContent: model.getValue(),
            cursorLine: cursorPosition.lineNumber - 1,
            cursorColumn: cursorPosition.column - 1,
            suggestionType: type,
            fileName,
          }),
        });
        if (!response.ok) {
          throw new Error(`API responded with status ${response.status}`);
        }

        const data = await response.json();
        const suggestionText =
          typeof data.suggestion === "string" ? data.suggestion.trimEnd() : "";

        setState((prev) => ({
          ...prev,
          isLoading: false,
          suggestion: suggestionText || null,
          position: suggestionText
            ? { line: cursorPosition.lineNumber, column: cursorPosition.column }
            : null,
        }));
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Error fetching code suggestion:", error);
        setState((prev) => ({ ...prev, isLoading: false }));
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
      }
    },
    []
  );

  const clear = useCallback(() => {
    setState((prev) => ({ ...prev, ...EMPTY_SUGGESTION }));
  }, []);

  return {
    ...state,
    toggleEnabled,
    fetchSuggestion,
    acceptSuggestion: clear,
    rejectSuggestion: clear,
  };
};
