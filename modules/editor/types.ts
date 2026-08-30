export interface FileItemData {
  id: string;
  name: string;
  path: string;
  content: string;
  isFolder: boolean;
  parentId?: string | null;
  workspaceId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceData {
  id: string;
  name: string;
  description: string | null;
  language: string;
  userId: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  files: FileItemData[];
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

export function detectLanguageFromFilename(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "js":
    case "jsx":
    case "mjs":
      return "javascript";
    case "ts":
    case "tsx":
      return "typescript";
    case "py":
      return "python";
    case "cpp":
    case "cc":
    case "cxx":
    case "hpp":
    case "h":
    case "c":
      return "cpp";
    case "java":
      return "java";
    case "html":
    case "htm":
      return "html";
    case "css":
    case "scss":
    case "less":
      return "css";
    case "json":
      return "json";
    case "md":
    case "markdown":
      return "markdown";
    case "go":
      return "go";
    case "rs":
      return "rust";
    case "sql":
      return "sql";
    case "sh":
    case "bash":
      return "shell";
    default:
      return "plaintext";
  }
}
