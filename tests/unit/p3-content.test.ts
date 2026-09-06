import { afterEach, describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import robots from "@/app/robots";
import { generateMetadata } from "@/app/(marketing)/problemas/[slug]/page";
import { problems } from "@/content/problems";

const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

afterEach(() => {
  if (originalSiteUrl === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
  else process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
});

describe("P3 problem content and SEO", () => {
  it("keeps every landing unique, reward-based and referral-safe", () => {
    expect(problems).toHaveLength(3);
    expect(new Set(problems.map(({ seoTitle }) => seoTitle)).size).toBe(3);
    expect(new Set(problems.map(({ seoDescription }) => seoDescription)).size).toBe(
      3,
    );

    for (const problem of problems) {
      expect(problem.observations).toHaveLength(3);
      expect(problem.practice.steps).toHaveLength(3);
      expect(problem.programFocus).toHaveLength(3);
      expect(problem.practice.duration).toMatch(/min/);
      expect(problem.safetyReferral).toMatch(/veterinári|profissional/);
      expect(problem.practice.avoid).toMatch(/Evite|evite/);
    }
  });

  it("builds canonical, Open Graph and noindex metadata per landing", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://coach.example.test";

    for (const problem of problems) {
      const metadata = await generateMetadata({
        params: Promise.resolve({ slug: problem.slug }),
      });
      expect(metadata.title).toBe(problem.seoTitle);
      expect(metadata.description).toBe(problem.seoDescription);
      expect(String(metadata.alternates?.canonical)).toBe(
        `https://coach.example.test/problemas/${problem.slug}`,
      );
      expect(metadata.openGraph?.title).toBe(problem.seoTitle);
      expect(metadata.robots).toMatchObject({ index: false, follow: false });
    }
  });

  it("publishes only ready marketing URLs in the sitemap while robots stay closed", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://coach.example.test";
    const entries = sitemap();

    // A vitrine de preços entra no sitemap: é a página que o anúncio precisa
    // alcançar e a que a análise de conta do Stripe procura para confirmar o
    // que é vendido e por quanto.
    expect(entries).toHaveLength(5);
    expect(entries.map(({ url }) => url)).toEqual([
      "https://coach.example.test/",
      "https://coach.example.test/planos",
      ...problems.map(
        ({ slug }) => `https://coach.example.test/problemas/${slug}`,
      ),
    ]);
    expect(robots()).toMatchObject({
      rules: { userAgent: "*", disallow: "/" },
      sitemap: "https://coach.example.test/sitemap.xml",
    });
  });
});
