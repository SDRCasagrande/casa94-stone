import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  env: {
    JWT_SECRET: process.env.JWT_SECRET || 'casa94-stone-secret-key-default',
  },
};

export default nextConfig;
