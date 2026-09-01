import type { MetadataRoute } from "next";
import { problems } from "@/content/problems";
import { getPublicEnv } from "@/lib/env/public";

const contentDate = "2026-09-01";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getPublicEnv().NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) return [];

  return [
    {
      url: new URL("/", siteUrl).toString(),
      lastModified: contentDate,
      changeFrequency: "monthly",
      priority: 1,
    },
    ...problems.map((problem) => ({
      url: new URL(`/problemas/${problem.slug}`, siteUrl).toString(),
      lastModified: contentDate,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
