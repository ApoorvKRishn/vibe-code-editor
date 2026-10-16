import GitHub from "next-auth/providers/github";
import type { NextAuthConfig } from "next-auth";

// Reads AUTH_GITHUB_ID and AUTH_GITHUB_SECRET from the environment.
export default {
  providers: [GitHub],
} satisfies NextAuthConfig;
