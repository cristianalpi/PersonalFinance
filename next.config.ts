import type { NextConfig } from "next";

// Every page is per-user and reads the session cookie, so there is nothing to
// prerender or cache across requests: cacheComponents stays off.
const nextConfig: NextConfig = {
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
