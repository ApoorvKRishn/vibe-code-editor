import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import type { NextAuthConfig } from "next-auth";

export default {
  providers: [
    GitHub({
      clientId:
        process.env.AUTH_GITHUB_ID ||
        process.env.GITHUB_ID ||
        process.env.GITHUB_CLIENT_ID,
      clientSecret:
        process.env.AUTH_GITHUB_SECRET ||
        process.env.GITHUB_SECRET ||
        process.env.GITHUB_CLIENT_SECRET,
      checks: ["state"],
    }),
    Google({
      clientId:
        process.env.AUTH_GOOGLE_ID ||
        process.env.GOOGLE_ID ||
        process.env.GOOGLE_CLIENT_ID,
      clientSecret:
        process.env.AUTH_GOOGLE_SECRET ||
        process.env.GOOGLE_SECRET ||
        process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
} satisfies NextAuthConfig;