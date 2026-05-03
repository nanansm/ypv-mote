"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import type { Question } from "@/lib/questions";
import { FormProgress } from "./form-progress";
import { StepContact } from "./step-contact";
import { StepEligibility } from "./step-eligibility";
import { StepGeneral } from "./step-general";

export type FormData = {
  full_name: string;
  email: string;
  phone: string;
  country: string;
  date_of_birth: string;
  vocational_training_completed: string;
  interested_in_field: string;
  english_level: string;
  worked_abroad: string;
  has_passport: string;
  professional_experience: string;
  diploma_in_english: string;
  current_location: string;
  [key: string]: string;
};

const CORE_KEYS_S1 = new Set(["full_name", "email", "phone"]);
const CORE_KEYS_S2 = new Set(["country", "date_of_birth", "vocational_training_completed", "interested_in_field"]);
const CORE_KEYS_S3 = new Set(["english_level", "worked_abroad", "has_passport", "professional_experience", "diploma_in_english", "current_location"]);

type Props = {
  section1Questions: Question[];
  section2Questions: Question[];
  section3Questions: Question[];
  sectionLabels: string[];
};

export function ScreeningForm({
  section1Questions,
  section2Questions,
  section3Questions,
  sectionLabels,
}: Props) {
  const t = useTranslations("form");
  const tErrors = useTranslations("errors");
  const router = useRouter();
  const params = useParams<{ locale: string }>();
  const locale = params.locale;

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [partialId, setPartialId] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, watch, formState: { errors }, trigger, getValues } =
    useForm<FormData>({ mode: "onBlur" });

  const stepFields: Record<number, string[]> = {
    1: section1Questions.map((q) => q.key),
    2: section2Questions.map((q) => q.key),
    3: section3Questions.map((q) => q.key),
  };

  async function handleNext() {
    const valid = await trigger(stepFields[step]);
    if (!valid) return;

    if (step === 2) {
      await submitEligibility();
    } else {
      setStep((s) => s + 1);
    }
  }

  async function submitEligibility() {
    setIsLoading(true);
    setServerError(null);
    const values = getValues();

    try {
      const allValues = values as Record<string, string>;
      const extraResponses: Record<string, string> = {};
      for (const q of [...section1Questions, ...section2Questions]) {
        if (!CORE_KEYS_S1.has(q.key) && !CORE_KEYS_S2.has(q.key) && allValues[q.key] !== undefined) {
          extraResponses[q.key] = allValues[q.key];
        }
      }

      const res = await fetch("/api/screen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale,
          fullName: values.full_name,
          email: values.email,
          phone: values.phone,
          country: values.country,
          dateOfBirth: values.date_of_birth,
          vocationalTrainingCompleted:
            values.vocational_training_completed === "yes",
          interestedInField: values.interested_in_field === "yes",
          ...(Object.keys(extraResponses).length > 0 ? { extraResponses } : {}),
        }),
      });

      const data = (await res.json()) as {
        passed?: boolean;
        partialSubmissionId?: string;
        reasonKey?: string;
        reasonDetails?: Record<string, unknown>;
        error?: string;
      };

      if (!res.ok || data.error) {
        setServerError(data.error ?? tErrors("generic"));
        return;
      }

      if (data.passed) {
        setPartialId(data.partialSubmissionId!);
        setStep(3);
      } else {
        const details = encodeURIComponent(JSON.stringify(data.reasonDetails ?? {}));
        router.push(`/${locale}/rejected?reason=${data.reasonKey}&details=${details}`);
      }
    } catch {
      setServerError(tErrors("network"));
    } finally {
      setIsLoading(false);
    }
  }

  async function onFinalSubmit(data: FormData) {
    if (!partialId) return;
    setIsLoading(true);
    setServerError(null);

    try {
      const allData = data as Record<string, string>;
      const extraResponses: Record<string, string> = {};
      for (const q of section3Questions) {
        if (!CORE_KEYS_S3.has(q.key) && allData[q.key] !== undefined) {
          extraResponses[q.key] = allData[q.key];
        }
      }

      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partialSubmissionId: partialId,
          englishLevel: data.english_level,
          workedAbroad: data.worked_abroad === "yes" ? 1 : 0,
          hasPassport: data.has_passport,
          professionalExperience: data.professional_experience,
          diplomaInEnglish: data.diploma_in_english === "yes" ? 1 : 0,
          currentLocation: data.current_location,
          ...(Object.keys(extraResponses).length > 0 ? { extraResponses } : {}),
        }),
      });

      const result = (await res.json()) as { submissionId?: string; error?: string };

      if (!res.ok || result.error) {
        setServerError(result.error ?? tErrors("submission_failed"));
        return;
      }

      router.push(
        `/${locale}/sessions?submission_id=${result.submissionId}`
      );
    } catch {
      setServerError(tErrors("network"));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <FormProgress current={step} total={3} labels={sectionLabels} />

      <form onSubmit={handleSubmit(onFinalSubmit)} noValidate>
        {step === 1 && (
          <StepContact
            questions={section1Questions}
            register={register}
            errors={errors}
            watch={watch}
          />
        )}
        {step === 2 && (
          <StepEligibility
            questions={section2Questions}
            register={register}
            errors={errors}
            watch={watch}
          />
        )}
        {step === 3 && (
          <StepGeneral
            questions={section3Questions}
            register={register}
            errors={errors}
            watch={watch}
          />
        )}

        {serverError && (
          <div className="mt-4 p-3 rounded-md border border-[#a32d2d] bg-red-50">
            <p className="text-sm text-[#a32d2d]">{serverError}</p>
          </div>
        )}

        <div className="flex gap-3 mt-8">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              disabled={isLoading}
              className="h-11 px-6 rounded-md border border-[#e5e5e5] text-sm font-medium text-[#1a1a1a] hover:bg-[#fafaf9] transition-colors disabled:opacity-50"
            >
              {t("back")}
            </button>
          )}

          {step < 3 && (
            <button
              type="button"
              onClick={handleNext}
              disabled={isLoading}
              className="h-11 px-8 rounded-md bg-[#3c3489] text-white text-sm font-medium hover:bg-[#2e2770] transition-colors disabled:opacity-60 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Spinner />
                  {step === 2 ? t("checking") : t("next")}
                </>
              ) : (
                t("next")
              )}
            </button>
          )}

          {step === 3 && (
            <button
              type="submit"
              disabled={isLoading}
              className="h-11 px-8 rounded-md bg-[#3c3489] text-white text-sm font-medium hover:bg-[#2e2770] transition-colors disabled:opacity-60 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Spinner />
                  {t("submitting")}
                </>
              ) : (
                t("submit")
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v8H4z"
      />
    </svg>
  );
}
