import { create } from "zustand";
import { persist } from "zustand/middleware";

export const MIN_FONT_SIZE = 10;
export const MAX_FONT_SIZE = 28;

interface EditorSettingsState {
  fontSize: number;
  changeFontSize: (delta: number) => void;
}

// Editor preferences are per browser, so they live in localStorage, not the database.
export const useEditorSettings = create<EditorSettingsState>()(
  persist(
    (set) => ({
      fontSize: 14,
      changeFontSize: (delta) =>
        set((state) => ({
          fontSize: Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, state.fontSize + delta)),
        })),
    }),
    { name: "editor-settings" }
  )
);
