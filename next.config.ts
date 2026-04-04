import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Avoid tracing from a parent folder when another lockfile exists up-tree
  outputFileTracingRoot: path.join(process.cwd()),
};

export default nextConfig;
