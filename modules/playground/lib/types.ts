// The Virtual File System: a project is a tree of folders and files that lives
// in memory while editing and is stored as one JSON document in MongoDB.

export interface TemplateFile {
  filename: string;
  fileExtension: string;
  content: string;
}

export interface TemplateFolder {
  folderName: string;
  items: (TemplateFile | TemplateFolder)[];
}

export type TemplateItem = TemplateFile | TemplateFolder;
