import type { NextConfig } from "next";

// Every page is per-user and reads the session cookie, so there is nothing to
// prerender or cache across requests: cacheComponents stays off.
const nextConfig: NextConfig = {
  // Self-contained server in .next/standalone for the Docker image (Easypanel).
  output: "standalone",
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
