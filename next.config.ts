import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: '/weighttracker',
  turbopack: {
    // Pin to this project so Turbopack doesn't walk up to /Users/gengel/Dev/projects/
    // (where a dev-proxy package-lock.json otherwise gets picked as the workspace root).
    root: process.cwd(),
  },
};

export default nextConfig;
