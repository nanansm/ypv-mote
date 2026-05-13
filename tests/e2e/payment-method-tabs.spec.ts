import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

test.describe("Payment method tabs API + admin contract", () => {
  test("public active endpoint returns indonesia default + others", async ({ request }) => {
    const res = await request.get("/api/payment-methods/active");
    expect(res.ok()).toBeTruthy();
    const data = (await res.json()) as {
      indonesiaDefault: { key: string; isDefaultForIndonesia: boolean } | null;
      others: Array<{ key: string; isDefaultForIndonesia: boolean }>;
    };
    if (data.indonesiaDefault) {
      expect(data.indonesiaDefault.isDefaultForIndonesia).toBe(true);
    }
    for (const m of data.others) {
      expect(m.isDefaultForIndonesia).toBe(false);
    }
  });

  test("admin endpoint lists methods sorted by orderIndex", async ({ page }) => {
    const ok = await loginAsAdmin(page);
    test.skip(!ok, "Admin credentials unavailable");
    const res = await page.request.get("/api/admin/payment-methods");
    expect(res.ok()).toBeTruthy();
    const data = (await res.json()) as {
      methods: Array<{ orderIndex: number }>;
    };
    let prev = -1;
    for (const m of data.methods) {
      expect(m.orderIndex).toBeGreaterThanOrEqual(prev);
      prev = m.orderIndex;
    }
  });

  test("setting one method as Indonesia default un-sets others", async ({ page }) => {
    const ok = await loginAsAdmin(page);
    test.skip(!ok, "Admin credentials unavailable");

    const before = await page.request.get("/api/admin/payment-methods");
    const beforeData = (await before.json()) as {
      methods: Array<{
        id: string;
        key: string;
        isDefaultForIndonesia: boolean;
      }>;
    };
    const currentDefault = beforeData.methods.find((m) => m.isDefaultForIndonesia);
    const candidate = beforeData.methods.find((m) => !m.isDefaultForIndonesia);
    test.skip(!candidate, "No alternative method to test with");
    if (!candidate) return;

    // Make candidate the default
    await page.request.patch(`/api/admin/payment-methods/${candidate.id}`, {
      data: { isDefaultForIndonesia: true },
    });

    const after = await page.request.get("/api/admin/payment-methods");
    const afterData = (await after.json()) as {
      methods: Array<{ id: string; isDefaultForIndonesia: boolean }>;
    };
    const defaults = afterData.methods.filter((m) => m.isDefaultForIndonesia);
    expect(defaults).toHaveLength(1);
    expect(defaults[0].id).toBe(candidate.id);

    // Revert
    if (currentDefault) {
      await page.request.patch(`/api/admin/payment-methods/${currentDefault.id}`, {
        data: { isDefaultForIndonesia: true },
      });
    }
  });

  test("reorder endpoint persists new order_index", async ({ page }) => {
    const ok = await loginAsAdmin(page);
    test.skip(!ok, "Admin credentials unavailable");

    const before = await page.request.get("/api/admin/payment-methods");
    const beforeData = (await before.json()) as {
      methods: Array<{ id: string; orderIndex: number }>;
    };
    if (beforeData.methods.length < 2) {
      test.skip(true, "Need at least 2 methods to reorder");
    }
    const ids = beforeData.methods.map((m) => m.id);
    // Reverse the order
    const payload = ids.map((id, i) => ({ id, orderIndex: ids.length - 1 - i }));
    const res = await page.request.post("/api/admin/payment-methods/reorder", {
      data: payload,
    });
    expect(res.ok()).toBeTruthy();
    const data = (await res.json()) as {
      methods: Array<{ id: string; orderIndex: number }>;
    };
    // Verify saved indexes match the payload
    for (const item of payload) {
      const found = data.methods.find((m) => m.id === item.id);
      expect(found?.orderIndex).toBe(item.orderIndex);
    }
    // Restore original order
    const restore = beforeData.methods.map((m) => ({
      id: m.id,
      orderIndex: m.orderIndex,
    }));
    await page.request.post("/api/admin/payment-methods/reorder", { data: restore });
  });
});
