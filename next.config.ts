import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // User-uploaded banners are served straight from object storage with plain <img>.
  // Skipping the Image Optimization pipeline keeps the site inside every free tier.
  images: { unoptimized: true },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};

export default nextConfig;
