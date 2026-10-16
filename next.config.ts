import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Only GitHub avatars — a wildcard would turn the image optimizer into an open proxy.
    remotePatterns: [{ protocol: "https", hostname: "avatars.githubusercontent.com" }],
  },
};

export default nextConfig;
