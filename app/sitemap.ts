import type { MetadataRoute } from "next";
import { getCatalog, categoriesOf } from "@/lib/catalog";
import { getPosts } from "@/lib/blog";
import { siteUrl } from "@/lib/payments";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const [products, posts] = await Promise.all([getCatalog(), getPosts()]);
  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/gioi-thieu`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/blog`, changeFrequency: "weekly", priority: 0.6 },
    ...categoriesOf(products).map((c) => ({ url: `${base}/?c=${encodeURIComponent(c)}`, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...products.map((p) => ({ url: `${base}/san-pham/${p.slug}`, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...posts.map((p) => ({ url: `${base}/blog/${p.slug}`, lastModified: p.updated_at, changeFrequency: "monthly" as const, priority: 0.6 })),
  ];
}
