export type EligibilityConfig = {
  validCountries: string[];
  defaultAgeMin: number;
  defaultAgeMax: number;
  countryAgeOverrides: Record<string, { min: number; max: number }>;
  requireVocationalTraining: boolean;
  requireFieldInterest: boolean;
};

export type EligibilityResult =
  | { passed: true }
  | { passed: false; reasonKey: string; reasonDetails: Record<string, unknown> };

export function calculateAge(dateOfBirth: string, now: Date): number {
  const dob = new Date(dateOfBirth);
  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

export function evaluateEligibility(
  submission: {
    country: string;
    dateOfBirth: string;
    vocationalTrainingCompleted: boolean;
    interestedInField: boolean;
  },
  config: EligibilityConfig,
  now: Date = new Date()
): EligibilityResult {
  if (!config.validCountries.includes(submission.country)) {
    return {
      passed: false,
      reasonKey: "country_not_eligible",
      reasonDetails: { country: submission.country },
    };
  }

  const age = calculateAge(submission.dateOfBirth, now);
  const ageRange = config.countryAgeOverrides[submission.country] ?? {
    min: config.defaultAgeMin,
    max: config.defaultAgeMax,
  };

  if (age < ageRange.min || age > ageRange.max) {
    return {
      passed: false,
      reasonKey: "age_out_of_range",
      reasonDetails: {
        age,
        country: submission.country,
        min: ageRange.min,
        max: ageRange.max,
      },
    };
  }

  if (config.requireVocationalTraining && !submission.vocationalTrainingCompleted) {
    return {
      passed: false,
      reasonKey: "vocational_training_required",
      reasonDetails: {},
    };
  }

  if (config.requireFieldInterest && !submission.interestedInField) {
    return {
      passed: false,
      reasonKey: "field_interest_required",
      reasonDetails: {},
    };
  }

  return { passed: true };
}

export function loadEligibilityConfig(raw: {
  validCountries: string;
  defaultAgeMin: number;
  defaultAgeMax: number;
  countryAgeOverrides: string;
  requireVocationalTraining: number;
  requireFieldInterest: number;
}): EligibilityConfig {
  return {
    validCountries: JSON.parse(raw.validCountries) as string[],
    defaultAgeMin: raw.defaultAgeMin,
    defaultAgeMax: raw.defaultAgeMax,
    countryAgeOverrides: JSON.parse(raw.countryAgeOverrides) as Record<
      string,
      { min: number; max: number }
    >,
    requireVocationalTraining: raw.requireVocationalTraining === 1,
    requireFieldInterest: raw.requireFieldInterest === 1,
  };
}
