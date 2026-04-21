import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 允许 Vercel 在构建时跳过 lint（CI 里单独跑）
  eslint: { ignoreDuringBuilds: false },
  typescript: { ignoreBuildErrors: false },
};

export default nextConfig;
