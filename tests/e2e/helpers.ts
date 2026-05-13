import { Page, expect, request as pwRequest, APIRequestContext } from "@playwright/test";

export const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "admin@test.local";
export const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "admin12345";

/**
 * Attempt admin login. Returns true on success.
 * Resilient: returns false (no throw) so tests can `test.skip()` cleanly when
 * credentials don't match the seeded admin in this environment.
 */
export async function loginAsAdmin(page: Page): Promise<boolean> {
  const res = await page.request.post("/api/auth/login", {
    data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    failOnStatusCode: false,
  });
  return res.ok();
}

export async function ensureLoggedIn(page: Page): Promise<void> {
  const ok = await loginAsAdmin(page);
  expect(ok, "Could not log in as admin — set E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD env").toBe(true);
}

export function uniqueEmail(prefix = "e2e"): string {
  return `${prefix}+${Date.now()}+${Math.random().toString(36).slice(2, 8)}@e2e.local`;
}

export function todayPlusDays(days: number): string {
  const d = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  return d.toISOString().split("T")[0];
}

export async function apiRequestContext(baseURL: string): Promise<APIRequestContext> {
  return await pwRequest.newContext({ baseURL });
}
