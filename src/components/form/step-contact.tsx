"use client";

import {
  UseFormRegister,
  FieldErrors,
  UseFormWatch,
} from "react-hook-form";
import { useTranslations } from "next-intl";
import type { Question } from "@/lib/questions";
import type { FormData } from "./screening-form";
import { FieldRenderer } from "./field-renderer";

type Props = {
  questions: Question[];
  register: UseFormRegister<FormData>;
  errors: FieldErrors<FormData>;
  watch: UseFormWatch<FormData>;
};

export function StepContact({ questions, register, errors, watch }: Props) {
  const t = useTranslations("form");

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-[#1a1a1a] mb-1">
          {t("section1")}
        </h2>
        <p className="text-sm text-[#5c5c5c]">
          We&apos;ll use this to send you your eligibility result and payment instructions.
        </p>
      </div>
      {questions.map((q) => (
        <FieldRenderer
          key={q.key}
          question={q}
          register={register}
          errors={errors}
          watch={watch}
        />
      ))}
    </div>
  );
}
