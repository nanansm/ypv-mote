import { test, expect } from "@playwright/test";
import { ensureLoggedIn, loginAsAdmin, uniqueEmail } from "./helpers";

test.describe("Admin flows", () => {
  test("login then dashboard loads", async ({ page }) => {
    const ok = await loginAsAdmin(page);
    test.skip(!ok, "Admin credentials unavailable");

    await page.goto("/admin");
    await expect(page.getByText(/dashboard/i).first()).toBeVisible();
  });

  test("settings page tabs navigate via hash", async ({ page }) => {
    const ok = await loginAsAdmin(page);
    test.skip(!ok, "Admin credentials unavailable");

    await page.goto("/admin/settings");
    await expect(page.getByRole("heading", { name: /settings/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /payment methods/i })).toBeVisible();

    await page.getByRole("tab", { name: /payment methods/i }).click();
    await expect(page).toHaveURL(/#payment_methods$/);
    await expect(page.getByRole("heading", { name: /payment methods/i })).toBeVisible();

    await page.getByRole("tab", { name: /integrations/i }).click();
    await expect(page).toHaveURL(/#integrations$/);

    await page.getByRole("tab", { name: /email/i }).click();
    await expect(page).toHaveURL(/#email$/);

    await page.getByRole("tab", { name: /general/i }).click();
    await expect(page).toHaveURL(/#general$/);
  });

  test("payment methods: list, toggle active works", async ({ page }) => {
    const ok = await loginAsAdmin(page);
    test.skip(!ok, "Admin credentials unavailable");

    const res = await page.request.get("/api/admin/payment-methods");
    expect(res.ok()).toBeTruthy();
    const data = (await res.json()) as { methods: Array<{ id: string; key: string; isActive: boolean }> };
    expect(data.methods.length).toBeGreaterThan(0);

    // Toggle an inactive one (revolut) on then back off
    const revolut = data.methods.find((m) => m.key === "revolut");
    test.skip(!revolut, "revolut seed method missing");
    if (!revolut) return;

    const turnOn = await page.request.patch(`/api/admin/payment-methods/${revolut.id}`, {
      data: { isActive: !revolut.isActive },
    });
    expect(turnOn.ok()).toBeTruthy();

    // Revert
    await page.request.patch(`/api/admin/payment-methods/${revolut.id}`, {
      data: { isActive: revolut.isActive },
    });
  });

  test("reviews moderation: list pending and approve", async ({ page, request }) => {
    const email = uniqueEmail("admin-approve");
    const create = await request.post("/api/reviews", {
      data: {
        name: "Approve Me",
        email,
        rating: 4,
        comment: "Created from admin moderation e2e test to validate approval.",
        locale: "en",
      },
    });
    expect(create.ok()).toBeTruthy();

    const ok = await loginAsAdmin(page);
    test.skip(!ok, "Admin credentials unavailable");

    const list = await page.request.get("/api/admin/reviews?status=pending");
    const data = (await list.json()) as { reviews: Array<{ id: string; email: string }> };
    const target = data.reviews.find((r) => r.email === email);
    expect(target).toBeTruthy();
    if (!target) return;

    const patch = await page.request.patch(`/api/admin/reviews/${target.id}`, {
      data: { status: "approved" },
    });
    expect(patch.ok()).toBeTruthy();

    // Then hide
    const hide = await page.request.patch(`/api/admin/reviews/${target.id}`, {
      data: { status: "hidden" },
    });
    expect(hide.ok()).toBeTruthy();

    // Then delete
    const del = await page.request.delete(`/api/admin/reviews/${target.id}`);
    expect(del.ok()).toBeTruthy();
  });

  test("admin reviews page renders", async ({ page }) => {
    const ok = await loginAsAdmin(page);
    test.skip(!ok, "Admin credentials unavailable");

    await page.goto("/admin/reviews");
    await expect(page.getByRole("heading", { name: /reviews/i })).toBeVisible();
  });

  test("sessions page renders for admin", async ({ page }) => {
    const ok = await loginAsAdmin(page);
    test.skip(!ok, "Admin credentials unavailable");
    await page.goto("/admin/sessions");
    await expect(page.getByText(/sessions/i).first()).toBeVisible();
  });

  test("bookings page renders for admin", async ({ page }) => {
    const ok = await loginAsAdmin(page);
    test.skip(!ok, "Admin credentials unavailable");
    await page.goto("/admin/bookings");
    await expect(page.getByText(/bookings/i).first()).toBeVisible();
  });
});
