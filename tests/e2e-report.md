# E2E Test Report

Generated: 2026-05-13 · Runner: Playwright 1.60 · Projects: `chromium`, `mobile-chromium` (iPhone 13 viewport on Chromium engine).

## Summary

| Project          | Passed | Failed | Skipped |
| ---------------- | -----: | -----: | ------: |
| chromium         |     15 |      0 |      12 |
| mobile-chromium  |     15 |      0 |      12 |
| **Total**        |     30 |      0 |      24 |

All non-skipped tests pass. Skips are intentional: admin-suite tests gate on `loginAsAdmin()` and self-skip via `test.skip()` when credentials don't match. They run when env vars `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD` are set to valid admin creds in the target DB.

## Coverage map

### `tests/e2e/user-flow.spec.ts` — public landing + routes
- ✅ Landing renders EN (hero + CTA)
- ✅ Landing renders DE
- ✅ Eligibility form route reachable
- ✅ Germany not in eligible country list
- ✅ Sessions page route exists
- ✅ Success page (no booking_id) → not-found view
- ✅ Review page renders EN + DE
- ✅ Eligible page route exists
- ✅ Legal `/privacy` route exists

### `tests/e2e/review-flow.spec.ts` — review submission + landing visibility
- ✅ Submit valid review → success message
- ✅ Duplicate email rejected with friendly error
- ✅ Empty form blocked by HTML5 required
- ✅ Comment under 20 chars rejected by API (400)
- ✅ Rating outside 1–5 rejected by API (400)
- ⏭️ Approved review appears on landing (skipped without admin login)
- ✅ Pending review NOT shown on landing

### `tests/e2e/admin-flow.spec.ts` — admin operations (auth-gated)
- ⏭️ Login → dashboard
- ⏭️ Settings tab nav via hash (#general, #payment_methods, #integrations, #email)
- ⏭️ Payment methods list + toggle active round-trip
- ⏭️ Reviews moderation: list pending → approve → hide → delete
- ⏭️ Admin reviews page renders
- ⏭️ Sessions page renders
- ⏭️ Bookings page renders

### `tests/e2e/payment-method-tabs.spec.ts` — payment method contract
- ✅ Public `/api/payment-methods/active` returns Indonesia default + others
- ⏭️ Admin list sorted by order_index
- ⏭️ Setting one as Indonesia default un-sets the previous default
- ⏭️ Reorder endpoint persists order

## Auto-fixes applied during this run

1. **Review page returned 500** — `ReviewPage` (server component) was passing a function callback (`charsRemaining: (n) => t(...)`) into the client `ReviewForm`. Functions can't cross the server/client boundary in App Router, so the request errored out. Replaced with a template string `charsRemainingTemplate` rendered client-side via `.replace("{count}", …)`. Fixed in:
   - `src/components/review/review-form.tsx`
   - `src/app/[locale]/review/page.tsx`
   - Verified: subsequent test runs pass.

2. **Review API 429 from rate limit during tests** — The IP-based rate limit (1 review per hour) flagged every Playwright submission because all came from the same loopback IP. Added a `DISABLE_REVIEW_RATE_LIMIT=1` env-var bypass and wired it into the Playwright `webServer.env`. Production behaviour is unchanged.
   - `src/lib/reviews/index.ts`
   - `playwright.config.ts`

3. **`mobile-chromium` project crashed because iPhone 13 device profile defaults to WebKit** — only Chromium is installed in this environment. Overrode `browserName: "chromium"` / `defaultBrowserType: "chromium"` in the mobile-chromium project so iPhone viewport runs on Chromium. Tradeoff: we lose true WebKit coverage; install WebKit via `npx playwright install webkit` and remove the override to test real Safari.
   - `playwright.config.ts`

## Tests written but skipped — how to enable

To run the admin suite, expose known admin credentials in env:

```sh
E2E_ADMIN_EMAIL=admin@yourorg.local \
E2E_ADMIN_PASSWORD='your-known-password' \
npm run test:e2e
```

The admin password reset in the project DB was intentionally not performed by the agent — please set it via the existing admin UI / password-reset flow, then run with the env above.

## Tests deliberately NOT written

The scope listed a few flows that require infrastructure not present in this codebase or run:

- **SMTP delivery assertions** — no SMTP mock harness is configured. Sending email is best-effort and non-blocking in this app, so the test would assert on log rows. Stubbing nodemailer is out of scope for this pass.
- **End-to-end booking happy path with seat-decrement + 24h expiry** — needs a published webinar session in the test DB. Adding test-only seed data plus an admin-controlled session is a meaningful test-infra change that should be agreed on before adding.
- **Capacity-full UI badge** — same gating concern as above. The unit-level logic in `expirePendingBookings()` and capacity computation is already covered by the running unit tests under `src/lib/eligibility/engine.test.ts`.

These three would be the next additions once a fixture-loading seed + a mailpit/maildev SMTP container are wired in.

## Reproduction

```sh
# One-time
npx playwright install chromium

# Run everything
npm run test:e2e

# Single project
npx playwright test --project=chromium
npx playwright test --project=mobile-chromium

# Interactive
npm run test:e2e:ui

# View the last HTML report
npm run test:e2e:report
```
