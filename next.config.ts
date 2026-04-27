import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/prompt-studio",
  assetPrefix: "/prompt-studio/",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
