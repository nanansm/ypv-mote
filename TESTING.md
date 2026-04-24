# Manual Test Cases — Phase 1

Run `npm run dev` and navigate to http://localhost:3004/en/form for each test.

## Eligibility Tests

| # | Test | Country | DOB (age) | Vocational | Field | Expected |
|---|------|---------|-----------|------------|-------|----------|
| 1 | Indonesian 25yo, pass | Indonesia | (25yo) | Yes | Yes | **PASS** → email sent → sheet updated |
| 2 | Indonesian 17yo | Indonesia | (17yo) | Yes | Yes | **REJECT** age_out_of_range (min 18) |
| 3 | Indonesian 36yo | Indonesia | (36yo) | Yes | Yes | **REJECT** age_out_of_range (max 35) |
| 4 | Australian 19yo | Australia | (19yo) | Yes | Yes | **REJECT** age_out_of_range (min 20 for AU) |
| 5 | Australian 20yo | Australia | (20yo) | Yes | Yes | **PASS** |
| 6 | Australian 30yo | Australia | (30yo) | Yes | Yes | **PASS** |
| 7 | Australian 31yo | Australia | (31yo) | Yes | Yes | **REJECT** age_out_of_range (max 30 for AU) |
| 8 | NZ 30yo | New Zealand | (30yo) | Yes | Yes | **PASS** (boundary) |
| 9 | NZ 31yo | New Zealand | (31yo) | Yes | Yes | **REJECT** (max 30 for NZ) |
| 10 | Russian 30yo | Russia | (30yo) | Yes | Yes | **PASS** |
| 11 | Malaysian 25yo | Others | (25yo) | Yes | Yes | **REJECT** country_not_eligible |
| 12 | Indonesian 25yo, no vocational | Indonesia | (25yo) | No | Yes | **REJECT** vocational_training_required |
| 13 | Indonesian 25yo, no field interest | Indonesia | (25yo) | Yes | No | **REJECT** field_interest_required |

To calculate DOBs: from today's date 2026-04-24, subtract the target age in years.

## Form Flow Tests

| # | Test | Steps |
|---|------|-------|
| 14 | Submit twice same email | Submit once (pass), submit again same email → both allowed (no dedup in Phase 1) |
| 15 | Language switcher EN→ZH | On form page, switch to ZH → form labels appear in Chinese, URL changes to /zh/form |
| 16 | Refresh mid-form | Fill section 1, advance to section 2, refresh → returns to section 1 (data lost, expected) |
| 17 | Health check | GET /api/health → 200 `{"ok":true,"db":"up","ts":"..."}` |

## Integration Tests

| # | Test | Setup | Expected |
|---|------|-------|----------|
| 18 | Sheet sync failure | Remove/invalidate GOOGLE_SHEETS_SHEET_ID | Submission still saves and user sees success page; error logged to sync_logs table |
| 19 | SMTP failure | Set incorrect SMTP credentials | User still redirected to /success; error logged to console |
| 20 | Legal pages both locales | Visit /en/legal/privacy and /zh/legal/privacy | Both render with correct language content |

## UI / Design Checks

- [ ] Landing page: professional, clean, indigo accent, Instrument Serif heading
- [ ] Form: 3-step progress bar updates correctly
- [ ] Rejected page: warm tone, shows correct reason in current locale
- [ ] Success page: Wise payment details displayed clearly
- [ ] Footer: all 5 legal page links work
- [ ] Mobile: form is readable and usable at 375px width
- [ ] Focus rings: visible on all inputs and buttons

## Age Boundary Notes

When testing age boundaries, DOBs on the exact boundary date of today should pass (inclusive). The engine uses `< min || > max` so:
- Age exactly at min: **passes**
- Age exactly at max: **passes**
- Age one year below min: **fails**
- Age one year above max: **fails**

The engine handles leap year correctly: a person born Feb 29 has their birthday counted as Feb 28 in non-leap years for the purpose of age calculation.
