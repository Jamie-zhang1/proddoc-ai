import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  experimental: {
    cpus: 1,
    workerThreads: true,
  },
  webpack: (config) => config,
};

export default nextConfig;
