import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  evaluateEligibility,
  loadEligibilityConfig,
  calculateAge,
} from "./engine";

const rawConfig = {
  validCountries: JSON.stringify([
    "Argentina", "Australia", "Canada", "Chile", "Indonesia", "Japan",
    "Monaco", "New Zealand", "Philippines", "Russia", "San Marino",
    "South Africa", "Tunisia", "Ukraine", "USA",
  ]),
  defaultAgeMin: 18,
  defaultAgeMax: 35,
  countryAgeOverrides: JSON.stringify({
    Australia: { min: 20, max: 30 },
    "New Zealand": { min: 18, max: 30 },
    Russia: { min: 18, max: 30 },
  }),
  requireVocationalTraining: 1,
  requireFieldInterest: 1,
};

const config = loadEligibilityConfig(rawConfig);

function makeDOB(ageYears: number, referenceDate: Date): string {
  const d = new Date(referenceDate);
  d.setFullYear(d.getFullYear() - ageYears);
  return d.toISOString().split("T")[0];
}

const NOW = new Date("2026-04-24");
const base = { vocationalTrainingCompleted: true, interestedInField: true };

describe("calculateAge", () => {
  test("exact birthday returns correct age", () => {
    assert.equal(calculateAge("2001-04-24", new Date("2026-04-24")), 25);
  });

  test("day before birthday: still prior age", () => {
    assert.equal(calculateAge("2001-04-25", new Date("2026-04-24")), 24);
  });

  test("Feb 29 birthday — non-leap year Mar 1 is birthday", () => {
    // Born 2004-02-29, checked 2026-03-01 → should be 22
    assert.equal(calculateAge("2004-02-29", new Date("2026-03-01")), 22);
  });
});

describe("evaluateEligibility", () => {
  // Country not in whitelist
  test("Others (not whitelist) → country_not_eligible", () => {
    const r = evaluateEligibility({ ...base, country: "Others", dateOfBirth: makeDOB(25, NOW) }, config, NOW);
    assert.equal(r.passed, false);
    if (!r.passed) assert.equal(r.reasonKey, "country_not_eligible");
  });

  test("Malaysia not in whitelist → country_not_eligible", () => {
    const r = evaluateEligibility({ ...base, country: "Malaysia", dateOfBirth: makeDOB(25, NOW) }, config, NOW);
    assert.equal(r.passed, false);
    if (!r.passed) assert.equal(r.reasonKey, "country_not_eligible");
  });

  // Indonesia (default 18-35)
  test("Indonesia age 35 → PASS", () => {
    const r = evaluateEligibility({ ...base, country: "Indonesia", dateOfBirth: makeDOB(35, NOW) }, config, NOW);
    assert.equal(r.passed, true);
  });

  test("Indonesia age 36 → age_out_of_range", () => {
    const r = evaluateEligibility({ ...base, country: "Indonesia", dateOfBirth: makeDOB(36, NOW) }, config, NOW);
    assert.equal(r.passed, false);
    if (!r.passed) assert.equal(r.reasonKey, "age_out_of_range");
  });

  test("Indonesia age 18 → PASS", () => {
    const r = evaluateEligibility({ ...base, country: "Indonesia", dateOfBirth: makeDOB(18, NOW) }, config, NOW);
    assert.equal(r.passed, true);
  });

  test("Indonesia age 17 → age_out_of_range", () => {
    const r = evaluateEligibility({ ...base, country: "Indonesia", dateOfBirth: makeDOB(17, NOW) }, config, NOW);
    assert.equal(r.passed, false);
    if (!r.passed) assert.equal(r.reasonKey, "age_out_of_range");
  });

  // Australia (20-30)
  test("Australia age 20 → PASS", () => {
    const r = evaluateEligibility({ ...base, country: "Australia", dateOfBirth: makeDOB(20, NOW) }, config, NOW);
    assert.equal(r.passed, true);
  });

  test("Australia age 30 → PASS", () => {
    const r = evaluateEligibility({ ...base, country: "Australia", dateOfBirth: makeDOB(30, NOW) }, config, NOW);
    assert.equal(r.passed, true);
  });

  test("Australia age 31 → age_out_of_range", () => {
    const r = evaluateEligibility({ ...base, country: "Australia", dateOfBirth: makeDOB(31, NOW) }, config, NOW);
    assert.equal(r.passed, false);
    if (!r.passed) assert.equal(r.reasonKey, "age_out_of_range");
  });

  test("Australia age 19 → age_out_of_range", () => {
    const r = evaluateEligibility({ ...base, country: "Australia", dateOfBirth: makeDOB(19, NOW) }, config, NOW);
    assert.equal(r.passed, false);
    if (!r.passed) assert.equal(r.reasonKey, "age_out_of_range");
  });

  test("Australia age 36 → age_out_of_range", () => {
    const r = evaluateEligibility({ ...base, country: "Australia", dateOfBirth: makeDOB(36, NOW) }, config, NOW);
    assert.equal(r.passed, false);
    if (!r.passed) assert.equal(r.reasonKey, "age_out_of_range");
  });

  // New Zealand (18-30)
  test("New Zealand age 30 → PASS", () => {
    const r = evaluateEligibility({ ...base, country: "New Zealand", dateOfBirth: makeDOB(30, NOW) }, config, NOW);
    assert.equal(r.passed, true);
  });

  test("New Zealand age 31 → age_out_of_range", () => {
    const r = evaluateEligibility({ ...base, country: "New Zealand", dateOfBirth: makeDOB(31, NOW) }, config, NOW);
    assert.equal(r.passed, false);
    if (!r.passed) assert.equal(r.reasonKey, "age_out_of_range");
  });

  test("New Zealand age 18 → PASS", () => {
    const r = evaluateEligibility({ ...base, country: "New Zealand", dateOfBirth: makeDOB(18, NOW) }, config, NOW);
    assert.equal(r.passed, true);
  });

  // Russia (18-30)
  test("Russia age 30 → PASS", () => {
    const r = evaluateEligibility({ ...base, country: "Russia", dateOfBirth: makeDOB(30, NOW) }, config, NOW);
    assert.equal(r.passed, true);
  });

  test("Russia age 18 → PASS", () => {
    const r = evaluateEligibility({ ...base, country: "Russia", dateOfBirth: makeDOB(18, NOW) }, config, NOW);
    assert.equal(r.passed, true);
  });

  // Vocational training
  test("Indonesia age 25, no vocational → vocational_training_required", () => {
    const r = evaluateEligibility({ ...base, vocationalTrainingCompleted: false, country: "Indonesia", dateOfBirth: makeDOB(25, NOW) }, config, NOW);
    assert.equal(r.passed, false);
    if (!r.passed) assert.equal(r.reasonKey, "vocational_training_required");
  });

  // Field interest
  test("Indonesia age 25, no field interest → field_interest_required", () => {
    const r = evaluateEligibility({ ...base, interestedInField: false, country: "Indonesia", dateOfBirth: makeDOB(25, NOW) }, config, NOW);
    assert.equal(r.passed, false);
    if (!r.passed) assert.equal(r.reasonKey, "field_interest_required");
  });
});
