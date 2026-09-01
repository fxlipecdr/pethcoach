import type { MetadataRoute } from "next";
import { getPublicEnv } from "@/lib/env/public";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getPublicEnv().NEXT_PUBLIC_SITE_URL;
  return {
    rules: { userAgent: "*", disallow: "/" },
    ...(siteUrl
      ? { sitemap: new URL("/sitemap.xml", siteUrl).toString() }
      : {}),
  };
}
