import type { MetadataRoute } from "next";
import { siteConfig } from "@/site.config";

/**
 * The web app manifest. Vaaram is a reading site rather than an app, so this
 * exists for the small things a manifest actually buys: a proper name and
 * colour when a reader adds the site to a phone's home screen.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${siteConfig.name} — ${siteConfig.tagline}`,
    short_name: siteConfig.name,
    description: siteConfig.shortDescription,
    start_url: "/",
    display: "standalone",
    background_color: "#faf8f4",
    theme_color: "#8a1332",
    lang: "en-CA",
    categories: ["news", "shopping", "business"],
    icons: [
      { src: "/brand/vaaram-mark.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
