import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  // Puppeteer and local tooling hit 127.0.0.1 while Next may bind to localhost.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
};

export default nextConfig;
