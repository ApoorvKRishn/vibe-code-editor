import type { Templates } from "@prisma/client";

// Starter projects live in /vibecode-starters and are copied into a new
// playground the first time it is opened.
export const templatePaths: Record<Templates, string> = {
  REACT: "vibecode-starters/react-ts",
  NEXTJS: "vibecode-starters/nextjs-new",
  EXPRESS: "vibecode-starters/express-simple",
  VUE: "vibecode-starters/vue",
  HONO: "vibecode-starters/hono-nodejs-starter",
  ANGULAR: "vibecode-starters/angular",
};
