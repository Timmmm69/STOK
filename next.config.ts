import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  serverExternalPackages: ["@prisma/adapter-pg", "pg", "pino"],
};

export default nextConfig;
