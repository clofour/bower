import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: (process.env.OUTPUT_MODE ?? "") as NextConfig["output"],
};

export default nextConfig;
