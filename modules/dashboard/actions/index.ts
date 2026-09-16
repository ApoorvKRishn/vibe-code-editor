"use server";

import { db } from "@/lib/db";
import { currentUser } from "@/modules/auth/actions";
import { revalidatePath } from "next/cache";

export const toggleStarMarked = async (
  playgroundId: string,
  isChecked: boolean
) => {
  const user = await currentUser();
  const userId = user?.id;
  if (!userId) {
    throw new Error("User Id is Required");
  }

  try {
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
        user: true,
        Starmark: {
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
  template: "REACT" | "NEXTJS" | "EXPRESS" | "VUE" | "HONO" | "ANGULAR";
  description?: string;
}) => {
  const user = await currentUser();
  if (!user?.id) {
    throw new Error("User not authenticated");
  }

  const { template, title, description } = data;

  try {
    const playground = await db.playground.create({
      data: {
        title,
        description,
        template,
        userId: user.id,
      },
    });

    revalidatePath("/dashboard");
    return playground;
  } catch (error) {
    console.error("Error creating playground:", error);
    throw error;
  }
};

export const deleteProjectById = async (id: string) => {
  try {
    await db.playground.delete({
      where: {
        id,
      },
    });
    revalidatePath("/dashboard");
  } catch (error) {
    console.error("Error deleting project:", error);
  }
};

export const editProjectById = async (
  id: string,
  data: { title: string; description: string }
) => {
  try {
    await db.playground.update({
      where: {
        id,
      },
      data,
    });
    revalidatePath("/dashboard");
  } catch (error) {
    console.error("Error updating project:", error);
  }
};

export const duplicateProjectById = async (id: string) => {
  try {
    const originalPlayground = await db.playground.findUnique({
      where: { id },
    });
    if (!originalPlayground) {
      throw new Error("Original playground not found");
    }

    const duplicatedPlayground = await db.playground.create({
      data: {
        title: `${originalPlayground.title} (Copy)`,
        description: originalPlayground.description,
        template: originalPlayground.template,
        userId: originalPlayground.userId,
      },
    });

    revalidatePath("/dashboard");
    return duplicatedPlayground;
  } catch (error) {
    console.error("Error duplicating project:", error);
  }
};
