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
      ["/editions", "weekly", 0.9],
      ["/advertise", "monthly", 0.8],
      ["/about", "yearly", 0.6],
      ["/contact", "yearly", 0.6],
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
  const issueRoutes: MetadataRoute.Sitemap = publications.map((p) => ({
    url: `${base}/editions/${p.slug}`,
    lastModified: new Date(p.created_at),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...issueRoutes];
}
