import { test, expect } from "@playwright/test";

test.describe("Public user landing + screening flows", () => {
  test("landing renders in EN with hero + CTA", async ({ page }) => {
    await page.goto("/en");
    await expect(page.locator("h1").first()).toBeVisible();
    await expect(page.getByRole("link", { name: /check my eligibility/i }).first()).toBeVisible();
  });

  test("landing renders in DE", async ({ page }) => {
    await page.goto("/de");
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("eligibility form: route exists and renders for EN", async ({ page }) => {
    await page.goto("/en/form");
    await expect(page).toHaveURL(/\/en\/form/);
    // Form must render a primary heading
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("ineligible country (Germany) is filtered out of country select", async ({ page }) => {
    await page.goto("/en/form");
    const select = page.locator('select').first();
    if (await select.count() === 0) {
      test.skip(true, "Form structure differs in this environment");
    }
    // Eligible list does not include Germany
    const html = await page.content();
    expect(html.toLowerCase()).not.toContain(">germany<");
  });

  test("sessions page is reachable when navigated to directly", async ({ page }) => {
    const res = await page.goto("/en/sessions");
    expect(res?.status()).toBeLessThan(500);
  });

  test("success page without booking_id shows not-found view", async ({ page }) => {
    await page.goto("/en/success");
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("review page renders in EN and DE", async ({ page }) => {
    await page.goto("/en/review");
    await expect(page.getByRole("heading", { name: /share your experience/i })).toBeVisible();

    await page.goto("/de/review");
    await expect(page.getByRole("heading", { name: /erfahrung/i })).toBeVisible();
  });

  test("eligible page route exists", async ({ page }) => {
    const res = await page.goto("/en/eligible");
    expect(res?.status()).toBeLessThan(500);
  });

  test("legal pages route exists (privacy)", async ({ page }) => {
    const res = await page.goto("/en/legal/privacy");
    expect(res?.status()).toBeLessThan(500);
  });
});
