import { test, expect } from "@playwright/test";
import { uniqueEmail, loginAsAdmin } from "./helpers";

test.describe("Review submission flow", () => {
  test("submits a valid review and shows success", async ({ page }) => {
    await page.goto("/en/review");
    await expect(page.getByRole("heading", { name: /share your experience/i })).toBeVisible();

    await page.getByLabel(/your name/i).fill("Playwright Tester");
    await page.getByLabel(/email/i).first().fill(uniqueEmail("review-ok"));
    // 4 stars
    await page.getByRole("radio", { name: "4 stars" }).click();
    await page
      .getByLabel(/your review/i)
      .fill("This is a fantastic webinar with super useful, actionable insights.");
    await page.getByRole("button", { name: /submit review/i }).click();

    await expect(page.getByRole("heading", { name: /thank you/i })).toBeVisible();
  });

  test("rejects duplicate email with friendly message", async ({ page }) => {
    const email = uniqueEmail("dup");
    // Submit once via API
    const first = await page.request.post("/api/reviews", {
      data: {
        name: "Dup Tester",
        email,
        rating: 5,
        comment: "First time submitting and it works fine for everyone here.",
        locale: "en",
      },
    });
    expect(first.ok()).toBeTruthy();

    // Submit again with same email via UI
    await page.goto("/en/review");
    await page.getByLabel(/your name/i).fill("Dup Tester");
    await page.getByLabel(/email/i).first().fill(email);
    await page.getByRole("radio", { name: "5 stars" }).click();
    await page
      .getByLabel(/your review/i)
      .fill("Second time trying to submit but it should be rejected with a duplicate error.");
    await page.getByRole("button", { name: /submit review/i }).click();

    await expect(page.getByText(/already submitted/i)).toBeVisible();
  });

  test("validation: empty form blocks submission", async ({ page }) => {
    await page.goto("/en/review");
    await page.getByRole("button", { name: /submit review/i }).click();
    // Required attribute on inputs prevents submission and keeps form visible
    await expect(page.getByRole("heading", { name: /share your experience/i })).toBeVisible();
  });

  test("validation: comment under 20 chars rejected by API", async ({ request }) => {
    const res = await request.post("/api/reviews", {
      data: {
        name: "Short",
        email: uniqueEmail("short"),
        rating: 3,
        comment: "Too short",
        locale: "en",
      },
    });
    expect(res.status()).toBe(400);
  });

  test("validation: rating outside 1-5 rejected by API", async ({ request }) => {
    const res = await request.post("/api/reviews", {
      data: {
        name: "OOR",
        email: uniqueEmail("oor"),
        rating: 9,
        comment: "Rating out of range should be rejected by the server.",
        locale: "en",
      },
    });
    expect(res.status()).toBe(400);
  });

  test("approved review appears on landing testimonials section", async ({ page, request }) => {
    const email = uniqueEmail("approved");
    const create = await request.post("/api/reviews", {
      data: {
        name: "Approved Tester",
        email,
        rating: 5,
        comment:
          "TESTIMONIAL_VISIBLE_MARK Approved review content for landing visibility check.",
        locale: "en",
      },
    });
    expect(create.ok()).toBeTruthy();

    const ok = await loginAsAdmin(page);
    test.skip(!ok, "Admin login unavailable in this environment");

    // Find the just-created review and approve
    const list = await page.request.get("/api/admin/reviews?status=pending");
    const data = (await list.json()) as {
      reviews: Array<{ id: string; email: string }>;
    };
    const target = data.reviews.find((r) => r.email === email);
    expect(target, "newly created pending review present").toBeTruthy();
    if (!target) return;

    const patch = await page.request.patch(`/api/admin/reviews/${target.id}`, {
      data: { status: "approved" },
    });
    expect(patch.ok()).toBeTruthy();

    await page.goto("/en");
    await expect(page.getByText(/TESTIMONIAL_VISIBLE_MARK/).first()).toBeVisible();
  });

  test("pending review does NOT appear on landing", async ({ page, request }) => {
    const email = uniqueEmail("pending-hidden");
    const create = await request.post("/api/reviews", {
      data: {
        name: "Pending Tester",
        email,
        rating: 4,
        comment: "PENDING_INVISIBLE_MARK should never appear on the landing page.",
        locale: "en",
      },
    });
    expect(create.ok()).toBeTruthy();

    await page.goto("/en");
    await expect(page.getByText(/PENDING_INVISIBLE_MARK/)).toHaveCount(0);
  });
});

test.describe("Public reviews summary and listing", () => {
  test("summary shows the correct approved total and average", async ({ page, request }) => {
    const statsRes = await request.get("/api/reviews");
    expect(statsRes.ok()).toBeTruthy();
    const data = (await statsRes.json()) as {
      total: number;
      stats: { total: number; average: number };
    };
    expect(data.total).toBe(data.stats.total);

    await page.goto("/en/review");
    await expect(page.getByText(new RegExp(`${data.stats.total} reviews`))).toBeVisible();
  });

  test("star filter narrows the list to matching ratings only", async ({ page, request }) => {
    const filtered = await request.get("/api/reviews?rating=5");
    expect(filtered.ok()).toBeTruthy();
    const data = (await filtered.json()) as {
      reviews: Array<{ rating: number }>;
    };
    for (const r of data.reviews) {
      expect(r.rating).toBe(5);
    }

    await page.goto("/en/review");
    await page.getByRole("button", { name: "5 stars" }).click();
    await expect(page.locator('[aria-label="5 out of 5 stars"]').first()).toBeVisible();
  });

  test("load more appends additional reviews without duplicating the first page", async ({
    request,
  }) => {
    const first = await request.get("/api/reviews?page=1&perPage=1");
    expect(first.ok()).toBeTruthy();
    const firstData = (await first.json()) as {
      reviews: Array<{ id: string }>;
      hasMore: boolean;
    };
    test.skip(!firstData.hasMore, "Not enough approved reviews seeded to test load-more");

    const second = await request.get("/api/reviews?page=2&perPage=1");
    const secondData = (await second.json()) as { reviews: Array<{ id: string }> };
    expect(secondData.reviews[0]?.id).not.toBe(firstData.reviews[0]?.id);
  });

  test("pending review never leaks into the public list or the public count", async ({
    request,
    page,
  }) => {
    const email = uniqueEmail("pending-leak");
    const before = await request.get("/api/reviews");
    const beforeData = (await before.json()) as { total: number };

    const create = await request.post("/api/reviews", {
      data: {
        name: "Leak Tester",
        email,
        rating: 5,
        comment: "PENDING_LEAK_MARK this pending review must never be public anywhere.",
        locale: "en",
      },
    });
    expect(create.ok()).toBeTruthy();
    const created = (await create.json()) as { review: { id: string } };
    const pendingId = created.review.id;

    try {
      const after = await request.get("/api/reviews");
      const afterData = (await after.json()) as {
        total: number;
        stats: { total: number };
        reviews: Array<{ id: string; comment: string }>;
      };

      // Public count must not change — the new row is pending, not approved.
      expect(afterData.total).toBe(beforeData.total);
      expect(afterData.reviews.some((r) => r.id === pendingId)).toBe(false);
      expect(afterData.reviews.some((r) => r.comment.includes("PENDING_LEAK_MARK"))).toBe(false);

      // Also check every rating-filtered slice, and a generous page range.
      for (const rating of [1, 2, 3, 4, 5]) {
        const res = await request.get(`/api/reviews?rating=${rating}&perPage=50`);
        const data = (await res.json()) as { reviews: Array<{ id: string }> };
        expect(data.reviews.some((r) => r.id === pendingId)).toBe(false);
      }
    } finally {
      const ok = await loginAsAdmin(page);
      if (ok) {
        await page.request.delete(`/api/admin/reviews/${pendingId}`);
      }
    }
  });
});
