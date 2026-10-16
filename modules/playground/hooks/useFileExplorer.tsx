import { create } from "zustand";
import { toast } from "sonner";

import { TemplateFile, TemplateFolder } from "../lib/types";
import {
  cloneTree,
  findFileByPath,
  findFolder,
  getFileName,
  joinPath,
  nameExistsInFolder,
} from "../lib";

export interface OpenFile extends TemplateFile {
  /** Full path of the file inside the project — unique per file. */
  id: string;
  hasUnsavedChanges: boolean;
  content: string;
  originalContent: string;
}

interface FileExplorerState {
  playgroundId: string;
  templateData: TemplateFolder | null;
  openFiles: OpenFile[];
  activeFileId: string | null;

  persist: ((data: TemplateFolder) => Promise<void>) | null;

  initialize: (playgroundId: string, templateData: TemplateFolder) => void;
  setPersist: (persist: (data: TemplateFolder) => Promise<void>) => void;
  setActiveFileId: (fileId: string | null) => void;

  openFile: (file: TemplateFile, parentPath: string) => void;
  closeFile: (fileId: string) => void;
  closeAllFiles: () => void;
  updateFileContent: (fileId: string, content: string) => void;
  /** Saves the given open files, or every file with unsaved changes. */
  saveFiles: (fileIds?: string[]) => Promise<void>;

  handleAddFile: (newFile: TemplateFile, parentPath: string) => Promise<void>;
  handleAddFolder: (newFolder: TemplateFolder, parentPath: string) => Promise<void>;
  handleDeleteFile: (file: TemplateFile, parentPath: string) => Promise<void>;
  handleDeleteFolder: (folder: TemplateFolder, parentPath: string) => Promise<void>;
  handleRenameFile: (
    file: TemplateFile,
    newFilename: string,
    newExtension: string,
    parentPath: string
  ) => Promise<void>;
  handleRenameFolder: (
    folder: TemplateFolder,
    newFolderName: string,
    parentPath: string
  ) => Promise<void>;
}

const isValidName = (name: string) =>
  name.trim().length > 0 && !/[\\/]/.test(name) && name !== "." && name !== "..";

const isInFolder = (filePath: string, folderPath: string) =>
  filePath.startsWith(`${folderPath}/`);

// Saves are queued so they reach the server in the order they were made.
let saveQueue: Promise<unknown> = Promise.resolve();

export const useFileExplorer = create<FileExplorerState>((set, get) => {
  const persistTree = (tree: TemplateFolder): Promise<void> => {
    const { persist } = get();
    if (!persist) return Promise.reject(new Error("Saving is not ready yet"));
    const next = saveQueue.catch(() => {}).then(() => persist(tree));
    saveQueue = next;
    return next;
  };

  /**
   * Applies a structural change to a copy of the tree, saves it, and rolls the
   * tree back if saving fails. Returns false if nothing was changed.
   */
  const applyTreeChange = async (
    change: (tree: TemplateFolder) => string | void,
    extraState: Partial<FileExplorerState> = {}
  ): Promise<boolean> => {
    const previous = get().templateData;
    if (!previous) return false;

    const updated = cloneTree(previous);
    const errorMessage = change(updated);
    if (errorMessage) {
      toast.error(errorMessage);
      return false;
    }

    set({ templateData: updated, ...extraState });
    try {
      await persistTree(updated);
      return true;
    } catch (error) {
      console.error("Failed to save project:", error);
      set({ templateData: previous });
      toast.error("Failed to save changes");
      return false;
    }
  };

  return {
    playgroundId: "",
    templateData: null,
    openFiles: [],
    activeFileId: null,
    persist: null,

    initialize: (playgroundId, templateData) =>
      set({ playgroundId, templateData, openFiles: [], activeFileId: null }),
    setPersist: (persist) => set({ persist }),
    setActiveFileId: (fileId) => set({ activeFileId: fileId }),

    openFile: (file, parentPath) => {
      const fileId = joinPath(parentPath, getFileName(file));
      if (get().openFiles.some((f) => f.id === fileId)) {
        set({ activeFileId: fileId });
        return;
      }

      const newOpenFile: OpenFile = {
        ...file,
        id: fileId,
        hasUnsavedChanges: false,
        content: file.content || "",
        originalContent: file.content || "",
      };

      set((state) => ({
        openFiles: [...state.openFiles, newOpenFile],
        activeFileId: fileId,
      }));
    },

    closeFile: (fileId) => {
      const { openFiles, activeFileId } = get();
      const index = openFiles.findIndex((f) => f.id === fileId);
      if (index === -1) return;

      const newFiles = openFiles.filter((f) => f.id !== fileId);
      let newActiveFileId = activeFileId;
      if (activeFileId === fileId) {
        // Prefer the neighbouring tab, like most editors do.
        newActiveFileId = newFiles[Math.min(index, newFiles.length - 1)]?.id ?? null;
      }

      set({ openFiles: newFiles, activeFileId: newActiveFileId });
    },

    closeAllFiles: () => set({ openFiles: [], activeFileId: null }),

    updateFileContent: (fileId, content) => {
      set((state) => ({
        openFiles: state.openFiles.map((file) =>
          file.id === fileId
            ? {
                ...file,
                content,
                hasUnsavedChanges: content !== file.originalContent,
              }
            : file
        ),
      }));
    },

    saveFiles: async (fileIds) => {
      const { templateData, openFiles } = get();
      if (!templateData) return;

      const toSave = openFiles.filter((f) =>
        fileIds ? fileIds.includes(f.id) : f.hasUnsavedChanges
      );
      if (toSave.length === 0) return;

      // Snapshot what is being saved: the user may keep typing meanwhile.
      const savedContent = new Map(toSave.map((f) => [f.id, f.content]));
      const updated = cloneTree(templateData);
      for (const [path, content] of savedContent) {
        const file = findFileByPath(updated, path);
        if (!file) throw new Error(`Could not find ${path} in the project`);
        file.content = content;
      }

      await persistTree(updated);

      set((state) => {
        // Re-apply onto the latest tree in case a rename/delete happened meanwhile.
        const latest = state.templateData ? cloneTree(state.templateData) : updated;
        for (const [path, content] of savedContent) {
          const file = findFileByPath(latest, path);
          if (file) file.content = content;
        }
        return {
          templateData: latest,
          openFiles: state.openFiles.map((f) => {
            const content = savedContent.get(f.id);
            if (content === undefined) return f;
            return {
              ...f,
              originalContent: content,
              hasUnsavedChanges: f.content !== content,
            };
          }),
        };
      });
    },

    handleAddFile: async (newFile, parentPath) => {
      const name = getFileName(newFile);
      const saved = await applyTreeChange((tree) => {
        if (!isValidName(name)) return "Invalid file name";
        const folder = findFolder(tree, parentPath);
        if (!folder) return "Folder not found";
        if (nameExistsInFolder(folder, name)) return `"${name}" already exists here`;
        folder.items.push(newFile);
      });
      if (!saved) return;

      toast.success(`Created file: ${name}`);
      get().openFile(newFile, parentPath);
    },

    handleAddFolder: async (newFolder, parentPath) => {
      const name = newFolder.folderName;
      const saved = await applyTreeChange((tree) => {
        if (!isValidName(name)) return "Invalid folder name";
        const folder = findFolder(tree, parentPath);
        if (!folder) return "Folder not found";
        if (nameExistsInFolder(folder, name)) return `"${name}" already exists here`;
        folder.items.push(newFolder);
      });
      if (!saved) return;

      toast.success(`Created folder: ${name}`);
    },

    handleDeleteFile: async (file, parentPath) => {
      const name = getFileName(file);
      const filePath = joinPath(parentPath, name);
      const { openFiles, activeFileId } = get();
      const remaining = openFiles.filter((f) => f.id !== filePath);

      const saved = await applyTreeChange(
        (tree) => {
          const folder = findFolder(tree, parentPath);
          if (!folder) return "Folder not found";
          folder.items = folder.items.filter(
            (item) => "folderName" in item || getFileName(item) !== name
          );
        },
        {
          openFiles: remaining,
          activeFileId: activeFileId === filePath ? remaining.at(-1)?.id ?? null : activeFileId,
        }
      );
      if (!saved) {
        set({ openFiles, activeFileId });
        return;
      }

      toast.success(`Deleted file: ${name}`);
    },

    handleDeleteFolder: async (folder, parentPath) => {
      const name = folder.folderName;
      const folderPath = joinPath(parentPath, name);
      const { openFiles, activeFileId } = get();
      const remaining = openFiles.filter((f) => !isInFolder(f.id, folderPath));
      const activeStillOpen = remaining.some((f) => f.id === activeFileId);

      const saved = await applyTreeChange(
        (tree) => {
          const parent = findFolder(tree, parentPath);
          if (!parent) return "Folder not found";
          parent.items = parent.items.filter(
            (item) => !("folderName" in item) || item.folderName !== name
          );
        },
        {
          openFiles: remaining,
          activeFileId: activeStillOpen ? activeFileId : remaining.at(-1)?.id ?? null,
        }
      );
      if (!saved) {
        set({ openFiles, activeFileId });
        return;
      }

      toast.success(`Deleted folder: ${name}`);
    },

    handleRenameFile: async (file, newFilename, newExtension, parentPath) => {
      const oldName = getFileName(file);
      const newName = getFileName({ filename: newFilename, fileExtension: newExtension });
      if (oldName === newName) return;

      const oldPath = joinPath(parentPath, oldName);
      const newPath = joinPath(parentPath, newName);
      const { openFiles, activeFileId } = get();

      const saved = await applyTreeChange(
        (tree) => {
          if (!isValidName(newName)) return "Invalid file name";
          const folder = findFolder(tree, parentPath);
          if (!folder) return "Folder not found";
          if (nameExistsInFolder(folder, newName)) return `"${newName}" already exists here`;
          const target = findFileByPath(tree, oldPath);
          if (!target) return "File not found";
          target.filename = newFilename;
          target.fileExtension = newExtension;
        },
        {
          openFiles: openFiles.map((f) =>
            f.id === oldPath
              ? { ...f, id: newPath, filename: newFilename, fileExtension: newExtension }
              : f
          ),
          activeFileId: activeFileId === oldPath ? newPath : activeFileId,
        }
      );
      if (!saved) {
        set({ openFiles, activeFileId });
        return;
      }

      toast.success(`Renamed file to: ${newName}`);
    },

    handleRenameFolder: async (folder, newFolderName, parentPath) => {
      const oldName = folder.folderName;
      if (oldName === newFolderName) return;

      const oldPath = joinPath(parentPath, oldName);
      const newPath = joinPath(parentPath, newFolderName);
      const movePath = (path: string) =>
        isInFolder(path, oldPath) ? newPath + path.slice(oldPath.length) : path;
      const { openFiles, activeFileId } = get();

      const saved = await applyTreeChange(
        (tree) => {
          if (!isValidName(newFolderName)) return "Invalid folder name";
          const parent = findFolder(tree, parentPath);
          if (!parent) return "Folder not found";
          if (nameExistsInFolder(parent, newFolderName)) {
            return `"${newFolderName}" already exists here`;
          }
          const target = findFolder(tree, oldPath);
          if (!target) return "Folder not found";
          target.folderName = newFolderName;
        },
        {
          openFiles: openFiles.map((f) => ({ ...f, id: movePath(f.id) })),
          activeFileId: activeFileId ? movePath(activeFileId) : null,
        }
      );
      if (!saved) {
        set({ openFiles, activeFileId });
        return;
      }

      toast.success(`Renamed folder to: ${newFolderName}`);
    },
  };
});
