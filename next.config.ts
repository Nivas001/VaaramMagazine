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
    /**
     * Content Security Policy.
     *
     * `unsafe-inline` on scripts is not an oversight: Next's App Router streams
     * hydration data through inline <script> tags, and removing it needs a
     * per-request nonce issued from middleware. That is the upgrade path, and
     * it is written down in the launch manual rather than half-done here.
     *
     * Everything else is closed: nothing may frame this site, no plugins, no
     * <base> rewriting, forms can only post to us, and the page may only talk
     * to our own origin and Supabase.
     */
    const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    const supabaseOrigin = supabase ? new URL(supabase).origin : "";
    const r2 = process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? "";
    const r2Origin = r2 ? new URL(r2).origin : "";

    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      // Artwork is uploaded by advertisers and served from object storage.
      `img-src 'self' data: blob: ${supabaseOrigin} ${r2Origin}`.trim(),
      "font-src 'self' data:",
      // pdf.js runs its parser in a worker created from a blob URL.
      "worker-src 'self' blob:",
      "child-src 'self' blob:",
      `connect-src 'self' ${supabaseOrigin} ${r2Origin}`.trim(),
      `media-src 'self' ${supabaseOrigin} ${r2Origin}`.trim(),
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join("; ");

    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // frame-ancestors above already covers modern browsers; this is the
          // same rule for anything that only understands the older header.
          { key: "X-Frame-Options", value: "DENY" },
          // The site needs none of these, so nothing on the page can ask.
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
