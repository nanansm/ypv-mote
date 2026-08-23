import { test, expect } from "@playwright/test";

test.describe("CV guide page", () => {
  test("EN: returns 200 and shows the title", async ({ page }) => {
    const res = await page.goto("/en/guide/cv-guide");
    expect(res?.status()).toBe(200);
    await expect(
      page.getByRole("heading", { name: /Not Sure If Your CV Is Good Enough/i })
    ).toBeVisible();
  });

  test("EN: Europass URL renders as a real anchor with target=_blank", async ({ page }) => {
    await page.goto("/en/guide/cv-guide");
    const link = page.locator('a[href="https://europass.europa.eu/en/create-europass-cv"]');
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", /noopener/);
    await expect(link).toHaveAttribute("rel", /noreferrer/);
  });

  test("DE: renders the German text", async ({ page }) => {
    const res = await page.goto("/de/guide/cv-guide");
    expect(res?.status()).toBe(200);
    await expect(
      page.getByRole("heading", { level: 1, name: /Lebenslauf/i })
    ).toBeVisible();
  });

  test("unknown slug 404s", async ({ page }) => {
    const res = await page.goto("/en/guide/does-not-exist");
    expect(res?.status()).toBe(404);
  });

  test("footer link is present and navigates to the guide", async ({ page }) => {
    await page.goto("/en");
    const footerLink = page.locator('footer a[href="/en/guide/cv-guide"]');
    await expect(footerLink).toBeVisible();
    await footerLink.click();
    await expect(page).toHaveURL(/\/en\/guide\/cv-guide/);
    await expect(
      page.getByRole("heading", { name: /Not Sure If Your CV Is Good Enough/i })
    ).toBeVisible();
  });
});
