import type { MetadataRoute } from "next";
import { getPublications } from "@/lib/queries";
import { siteConfig } from "@/site.config";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url.replace(/\/$/, "");

  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = (
    [
      ["/", "weekly", 1],
      ["/archives", "weekly", 0.9],
      ["/about", "monthly", 0.7],
      ["/contact", "monthly", 0.7],
      ["/privacy", "yearly", 0.2],
      ["/terms", "yearly", 0.2],
    ] as const
  ).map(([path, changeFrequency, priority]) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));

  const publications = await getPublications();
  const editionRoutes: MetadataRoute.Sitemap = publications.map((p) => ({
    url: `${base}/archives/${p.slug}`,
    lastModified: new Date(p.created_at),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...editionRoutes];
}
