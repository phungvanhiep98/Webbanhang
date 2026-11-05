import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/payments";

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/gio-hang", "/thanh-toan", "/don-hang/", "/tra-cuu"] },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
