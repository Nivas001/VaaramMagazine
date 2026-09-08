import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Covers and banners are served straight from object storage with a plain
  // <img>. Skipping the Image Optimization pipeline keeps the site inside
  // every free hosting tier.
  images: { unoptimized: true },

  async redirects() {
    // The archive used to live at /editions. Anything already linked or
    // indexed there should keep working, permanently.
    return [
      { source: "/editions", destination: "/archives", permanent: true },
      { source: "/editions/:slug", destination: "/archives/:slug", permanent: true },
      { source: "/advertise", destination: "/contact", permanent: true },
      { source: "/admin/editions", destination: "/admin/issues", permanent: true },
      { source: "/admin/editions/:path*", destination: "/admin/issues/:path*", permanent: true },
    ];
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          // The site needs none of these, so nothing on the page can ask.
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
