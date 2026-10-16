// Server-side auth helpers. Intentionally NOT a "use server" module: these must
// never be exposed to the browser as callable server actions.
import { auth } from "@/auth";

import { db } from "@/lib/db";

export const getUserById = async (id: string) => {
  try {
    return await db.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, image: true, role: true },
    });
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const currentUser = async () => {
  const session = await auth();
  return session?.user;
};

/** Returns the signed-in user's id, or throws if nobody is signed in. */
export const requireUserId = async (): Promise<string> => {
  const user = await currentUser();
  if (!user?.id) {
    throw new Error("Not authenticated");
  }
  return user.id;
};
