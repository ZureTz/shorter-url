import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  // Generate static HTML for all pages
  output: "export",

  async rewrites() {
    const backendUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
