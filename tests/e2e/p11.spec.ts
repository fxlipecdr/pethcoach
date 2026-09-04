import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("P11 - Consent banner renders on initial visit and allows essential-only choice", async ({
  page,
}, testInfo) => {
  await page.goto("/");

  const banner = page.getByRole("region", {
    name: "Consentimento de privacidade e cookies",
  });
  await expect(banner).toBeVisible();

  await expect(
    banner.getByText("Privacidade e respeito ao seu ritmo"),
  ).toBeVisible();

  // WCAG 2.2 AA accessibility test on the banner
  const axeResults = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(axeResults.violations).toEqual([]);

  // Responsive: no horizontal overflow at 360px
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);

  // Click "Apenas essenciais"
  const rejectButton = banner.getByRole("button", {
    name: /Apenas essenciais/i,
  });
  await rejectButton.click();

  // Banner closes
  await expect(banner).not.toBeVisible();

  // Verify cookie is set to denied
  const cookies = await page.context().cookies();
  const consentCookie = cookies.find((c) => c.name === "peth_consent");
  expect(consentCookie?.value).toBe("denied");

  await page.screenshot({
    path: testInfo.outputPath("p11-consent-denied.png"),
    fullPage: true,
  });
});

test("P11 - Accepting analytics persists consent and allows reopening from footer", async ({
  page,
}, testInfo) => {
  await page.goto("/");

  const banner = page.getByRole("region", {
    name: "Consentimento de privacidade e cookies",
  });
  await expect(banner).toBeVisible();

  // Click "Aceitar analíticos"
  const acceptButton = banner.getByRole("button", {
    name: /Aceitar analíticos/i,
  });
  await acceptButton.click();

  // Banner closes
  await expect(banner).not.toBeVisible();

  // Verify cookie is set to granted
  const cookies = await page.context().cookies();
  const consentCookie = cookies.find((c) => c.name === "peth_consent");
  expect(consentCookie?.value).toBe("granted");

  // Click footer "Preferências de cookies" button to reopen
  const footerButton = page.getByRole("button", {
    name: /Preferências de cookies/i,
  });
  await footerButton.scrollIntoViewIfNeeded();
  await footerButton.click();

  // Banner reopens
  await expect(banner).toBeVisible();

  await page.screenshot({
    path: testInfo.outputPath("p11-consent-reopened.png"),
    fullPage: true,
  });
});
