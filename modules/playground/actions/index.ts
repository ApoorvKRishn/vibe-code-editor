"use server";

import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { TemplateFolder } from "../lib/path-to-json";
import { requireUserId } from "@/modules/auth/actions";

// Generous cap so a single save can't be used to stuff the database.
const MAX_SAVE_BYTES = 5 * 1024 * 1024;

const isTemplateFolder = (value: unknown): value is TemplateFolder =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as TemplateFolder).folderName === "string" &&
  Array.isArray((value as TemplateFolder).items);

export const getPlaygroundById = async (id: string) => {
  const userId = await requireUserId();

  const playground = await db.playground.findFirst({
    where: { id, userId },
    select: {
      id: true,
      title: true,
      template: true,
      templateFiles: {
        select: {
          content: true,
        },
      },
    },
  });
  if (!playground) return null;

  // Older saves stored the tree as a JSON string; newer ones store the object.
  const raw = playground.templateFiles[0]?.content;
  const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;

  return {
    id: playground.id,
    title: playground.title,
    template: playground.template,
    content: isTemplateFolder(parsed) ? parsed : null,
  };
};

export const SaveUpdatedCode = async (
  playgroundId: string,
  data: TemplateFolder
) => {
  const userId = await requireUserId();

  if (!isTemplateFolder(data)) {
    throw new Error("Invalid file tree");
  }
  if (JSON.stringify(data).length > MAX_SAVE_BYTES) {
    throw new Error("Project is too large to save");
  }

  const playground = await db.playground.findFirst({
    where: { id: playgroundId, userId },
    select: { id: true },
  });
  if (!playground) {
    throw new Error("Playground not found");
  }

  const content = data as unknown as Prisma.InputJsonValue;

  await db.templateFile.upsert({
    where: { playgroundId },
    update: { content },
    create: { playgroundId, content },
  });
  // Bump updatedAt so the dashboard sorts recently edited projects first.
  await db.playground.update({
    where: { id: playgroundId },
    data: { updatedAt: new Date() },
  });

  return { success: true };
};
