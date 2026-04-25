import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["better-sqlite3"],
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  webpack: (config) => {
    config.externals = config.externals ?? [];
    if (Array.isArray(config.externals)) {
      config.externals.push({ "better-sqlite3": "commonjs better-sqlite3" });
    }
    return config;
  },
};

export default nextConfig;
