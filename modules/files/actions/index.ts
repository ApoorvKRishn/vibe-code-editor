"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function createFileOrFolder(params: {
  workspaceId: string;
  name: string;
  path: string;
  isFolder: boolean;
  parentId?: string;
  content?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Verify workspace ownership
  const workspace = await db.workspace.findFirst({
    where: { id: params.workspaceId, userId: session.user.id },
  });

  if (!workspace) {
    throw new Error("Workspace not found or unauthorized");
  }

  const file = await db.fileItem.create({
    data: {
      name: params.name,
      path: params.path,
      content: params.content || "",
      isFolder: params.isFolder,
      parentId: params.parentId,
      workspaceId: params.workspaceId,
    },
  });

  return file;
}

export async function updateFileContent(params: {
  fileId: string;
  content: string;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const file = await db.fileItem.findUnique({
    where: { id: params.fileId },
    include: { workspace: true },
  });

  if (!file || file.workspace.userId !== session.user.id) {
    throw new Error("File not found or unauthorized");
  }

  return db.fileItem.update({
    where: { id: params.fileId },
    data: {
      content: params.content,
    },
  });
}

export async function deleteFileOrFolder(params: {
  fileId: string;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const file = await db.fileItem.findUnique({
    where: { id: params.fileId },
    include: { workspace: true },
  });

  if (!file || file.workspace.userId !== session.user.id) {
    throw new Error("File not found or unauthorized");
  }

  // If folder, recursively delete child items
  if (file.isFolder) {
    await db.fileItem.deleteMany({
      where: {
        workspaceId: file.workspaceId,
        path: { startsWith: file.path },
      },
    });
  }

  await db.fileItem.delete({
    where: { id: params.fileId },
  });

  return { success: true };
}

export async function renameFileOrFolder(params: {
  fileId: string;
  newName: string;
  newPath: string;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const file = await db.fileItem.findUnique({
    where: { id: params.fileId },
    include: { workspace: true },
  });

  if (!file || file.workspace.userId !== session.user.id) {
    throw new Error("File not found or unauthorized");
  }

  return db.fileItem.update({
    where: { id: params.fileId },
    data: {
      name: params.newName,
      path: params.newPath,
    },
  });
}
