import type { TemplateFile, TemplateFolder, TemplateItem } from "./types";

// Files are identified by their full path ("src/components/App.tsx"), never by
// name alone — templates contain many files that share a name (index.ts, ...).

/** File name including extension, e.g. "App.tsx" or "Dockerfile". */
export function getFileName(file: Pick<TemplateFile, "filename" | "fileExtension">): string {
  return file.fileExtension ? `${file.filename}.${file.fileExtension}` : file.filename;
}

export function getItemName(item: TemplateItem): string {
  return "folderName" in item ? item.folderName : getFileName(item);
}

export function joinPath(parentPath: string, name: string): string {
  return parentPath ? `${parentPath}/${name}` : name;
}

/** Returns the folder at `folderPath` ("" is the root), or null. */
export function findFolder(root: TemplateFolder, folderPath: string): TemplateFolder | null {
  let current: TemplateFolder = root;
  for (const part of folderPath.split("/").filter(Boolean)) {
    const next = current.items.find(
      (item): item is TemplateFolder => "folderName" in item && item.folderName === part
    );
    if (!next) return null;
    current = next;
  }
  return current;
}

/** Returns the file at `filePath`, or null. */
export function findFileByPath(root: TemplateFolder, filePath: string): TemplateFile | null {
  const parts = filePath.split("/");
  const name = parts.pop()!;
  const folder = findFolder(root, parts.join("/"));
  return (
    (folder?.items.find(
      (item) => !("folderName" in item) && getFileName(item) === name
    ) as TemplateFile | undefined) ?? null
  );
}

/** True if a file or folder named `name` already exists directly in the folder. */
export function nameExistsInFolder(folder: TemplateFolder, name: string): boolean {
  return folder.items.some((item) => getItemName(item) === name);
}

export function cloneTree(root: TemplateFolder): TemplateFolder {
  return structuredClone(root);
}

/** Calls `visit` with every file in the tree and its full path. */
export function walkFiles(
  folder: TemplateFolder,
  visit: (file: TemplateFile, path: string) => void,
  basePath = ""
): void {
  for (const item of folder.items) {
    if ("folderName" in item) {
      walkFiles(item, visit, joinPath(basePath, item.folderName));
    } else {
      visit(item, joinPath(basePath, getFileName(item)));
    }
  }
}
