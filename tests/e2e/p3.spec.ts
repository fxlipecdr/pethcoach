import { expect, test } from "@playwright/test";
import { problems } from "../../content/problems";

test("problem landings have unique copy, one real CTA and safety referrals", async ({
  page,
}) => {
  for (const problem of problems) {
    await page.goto(`/problemas/${problem.slug}`);

    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      problem.title,
    );
    await expect(page).toHaveTitle(`${problem.seoTitle} | PethCoach`);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      problem.seoDescription,
    );
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex/,
    );
    await expect(
      page.getByRole("link", { name: "Começar avaliação" }),
    ).toHaveAttribute("href", `/quiz/${problem.slug}`);
    await expect(
      page.getByRole("heading", { name: "Segurança vem antes do treino." }),
    ).toBeVisible();
    await expect(page.getByText(problem.safetyReferral)).toBeVisible();
  }
});

test("robots remains closed and sitemap is empty without a configured site URL", async ({
  request,
}) => {
  const robotsResponse = await request.get("/robots.txt");
  expect(await robotsResponse.text()).toContain("Disallow: /");

  const sitemapResponse = await request.get("/sitemap.xml");
  expect(sitemapResponse.status()).toBe(200);
  expect(await sitemapResponse.text()).not.toContain("/problemas/");
});
