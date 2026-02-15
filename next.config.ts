import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: false, // Temporarily disabled due to build worker crash
  reactCompiler: true,
};

export default nextConfig;
