import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Only the OAuth providers' avatar hosts — a wildcard turns the image
    // optimizer into an open proxy.
    remotePatterns: [
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  // The template API reads starter projects from disk at runtime; make sure
  // they are bundled with the serverless function when deployed.
  outputFileTracingIncludes: {
    "/api/template/[id]": ["./vibecode-starters/**/*"],
  },
  async headers() {
    return [
      {
        // WebContainers need cross-origin isolation (SharedArrayBuffer).
        source: "/:path*",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "require-corp",
          },
        ],
      },
    ];
  },
  reactStrictMode: false,
};

export default nextConfig;
