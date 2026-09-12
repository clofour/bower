import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  ...(process.env.OUTPUT_MODE && { output: process.env.OUTPUT_MODE as NextConfig["output"] }),
};

export default nextConfig;
