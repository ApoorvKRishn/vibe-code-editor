import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Only the OAuth providers' avatar hosts — a wildcard would turn the image
    // optimizer into an open proxy.
    remotePatterns: [
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
};

export default nextConfig;
