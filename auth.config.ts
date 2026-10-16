import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import type { NextAuthConfig } from "next-auth";

// Providers read their keys from the environment:
// AUTH_GITHUB_ID / AUTH_GITHUB_SECRET and AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET.
export default {
  providers: [GitHub, Google],
} satisfies NextAuthConfig;
