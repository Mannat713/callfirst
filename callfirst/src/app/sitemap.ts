import type { MetadataRoute } from "next";
import { POSTS } from "@/content/posts";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const latest = POSTS.map((p) => p.date).sort().at(-1) ?? "2026-11-20";
  return [
    { url: SITE_URL, lastModified: latest, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/app`, lastModified: latest, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/blog`, lastModified: latest, changeFrequency: "weekly", priority: 0.7 },
    ...POSTS.map((p) => ({ url: `${SITE_URL}/blog/${p.slug}`, lastModified: p.date, changeFrequency: "monthly" as const, priority: 0.6 })),
    { url: `${SITE_URL}/privacy`, lastModified: "2026-11-20", changeFrequency: "yearly", priority: 0.2 },
  ];
}
