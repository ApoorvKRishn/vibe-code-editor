"use server";

import { db } from "@/lib/db";
import { Prisma, Templates } from "@prisma/client";
import { STARTERS } from "@/modules/playground/lib/languages";
import { currentUser, requireUserId } from "@/modules/auth/actions";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const templateSchema = z.enum(Templates);

const createPlaygroundSchema = z.object({
  title: z.string().trim().min(1).max(100),
  template: templateSchema,
  description: z.string().trim().max(500).optional(),
});

const editPlaygroundSchema = z.object({
  title: z.string().trim().min(1).max(100),
  description: z.string().trim().max(500),
});

/** Throws unless the playground exists and belongs to the user. */
const assertOwnsPlayground = async (playgroundId: string, userId: string) => {
  const playground = await db.playground.findFirst({
    where: { id: playgroundId, userId },
    select: { id: true },
  });
  if (!playground) {
    throw new Error("Playground not found");
  }
};

export const toggleStarMarked = async (
  playgroundId: string,
  isChecked: boolean
) => {
  const userId = await requireUserId();

  try {
    await assertOwnsPlayground(playgroundId, userId);

    if (isChecked) {
      await db.starMark.upsert({
        where: {
          userId_playgroundId: {
            userId,
            playgroundId,
          },
        },
        update: {
          isMarked: true,
        },
        create: {
          userId,
          playgroundId,
          isMarked: true,
        },
      });
    } else {
      await db.starMark.deleteMany({
        where: {
          userId,
          playgroundId,
        },
      });
    }

    revalidatePath("/dashboard");
    revalidatePath("/settings");
    return { success: true, isMarked: isChecked };
  } catch (error) {
    console.error("Error updating star mark:", error);
    return { success: false, error: "Failed to update star mark" };
  }
};

export const getAllPlaygroundForUser = async () => {
  const user = await currentUser();
  if (!user?.id) return [];

  try {
    const playground = await db.playground.findMany({
      where: {
        userId: user.id,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
        starMarks: {
          where: {
            userId: user.id,
          },
          select: {
            isMarked: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return playground;
  } catch (error) {
    console.error("Error fetching playgrounds:", error);
    return [];
  }
};

export const createPlayground = async (data: {
  title: string;
  template: Templates;
  description?: string;
}) => {
  const userId = await requireUserId();
  const { template, title, description } = createPlaygroundSchema.parse(data);

  const playground = await db.playground.create({
    data: {
      title,
      description,
      template,
      userId,
      // Every project starts as a copy of its language's starter files.
      templateFiles: {
        create: {
          content: STARTERS[template].files as unknown as Prisma.InputJsonValue,
        },
      },
    },
  });

  revalidatePath("/dashboard");
  return playground;
};

export const deleteProjectById = async (id: string) => {
  const userId = await requireUserId();

  const { count } = await db.playground.deleteMany({
    where: { id, userId },
  });
  if (count === 0) {
    throw new Error("Playground not found");
  }
  revalidatePath("/dashboard");
};

export const editProjectById = async (
  id: string,
  data: { title: string; description: string }
) => {
  const userId = await requireUserId();
  const parsed = editPlaygroundSchema.parse(data);

  const { count } = await db.playground.updateMany({
    where: { id, userId },
    data: parsed,
  });
  if (count === 0) {
    throw new Error("Playground not found");
  }
  revalidatePath("/dashboard");
};

export const duplicateProjectById = async (id: string) => {
  const userId = await requireUserId();

  const originalPlayground = await db.playground.findFirst({
    where: { id, userId },
    include: { templateFiles: { select: { content: true } } },
  });
  if (!originalPlayground) {
    throw new Error("Playground not found");
  }

  const savedContent = originalPlayground.templateFiles[0]?.content;

  const duplicatedPlayground = await db.playground.create({
    data: {
      title: `${originalPlayground.title} (Copy)`,
      description: originalPlayground.description,
      template: originalPlayground.template,
      userId,
      // Copy the saved code too, otherwise the copy starts from the bare template.
      ...(savedContent != null && {
        templateFiles: {
          create: { content: savedContent as Prisma.InputJsonValue },
        },
      }),
    },
  });

  revalidatePath("/dashboard");
  return duplicatedPlayground;
};
