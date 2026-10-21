import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  // The NestJS API (server/) is served from the same origin, so better-auth's cookie is first-party.
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${process.env.API_INTERNAL_URL ?? "http://localhost:4000"}/api/:path*` }];
  },
  partialPrefetching: true,
  reactCompiler: true,
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
