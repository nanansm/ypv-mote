"use client";

import { UseFormRegister, FieldErrors, UseFormWatch } from "react-hook-form";
import { useTranslations } from "next-intl";
import type { Question } from "@/lib/questions";
import type { FormData } from "./screening-form";

type Props = {
  question: Question;
  register: UseFormRegister<FormData>;
  errors: FieldErrors<FormData>;
  watch: UseFormWatch<FormData>;
};

export function FieldRenderer({ question, register, errors }: Props) {
  const t = useTranslations("form");
  const key = question.key as keyof FormData;
  const error = errors[key];

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={question.key}
        className="text-sm font-medium text-[#1a1a1a]"
      >
        {question.label}
        {question.required && (
          <span className="text-[#a32d2d] ml-1">*</span>
        )}
      </label>

      {question.helpText && (
        <p className="text-xs text-[#5c5c5c] leading-relaxed">
          {question.helpText}
        </p>
      )}

      {question.type === "text" && (
        <input
          id={question.key}
          type="text"
          placeholder={question.placeholder ?? ""}
          {...register(key, { required: question.required ? t("required") : false })}
          className={inputClass(!!error)}
        />
      )}

      {question.type === "email" && (
        <input
          id={question.key}
          type="email"
          placeholder={question.placeholder ?? ""}
          {...register(key, {
            required: question.required ? t("required") : false,
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: t("invalidEmail"),
            },
          })}
          className={inputClass(!!error)}
        />
      )}

      {question.type === "tel" && (
        <input
          id={question.key}
          type="tel"
          placeholder={question.placeholder ?? "+41 xxx xxx xx xx"}
          {...register(key, { required: question.required ? t("required") : false })}
          className={inputClass(!!error)}
        />
      )}

      {question.type === "date" && (
        <input
          id={question.key}
          type="date"
          {...register(key, {
            required: question.required ? t("required") : false,
            validate: (v) => {
              if (!v) return true;
              const d = new Date(v as string);
              if (isNaN(d.getTime())) return t("invalidDate");
              return true;
            },
          })}
          className={inputClass(!!error)}
        />
      )}

      {question.type === "select" && (
        <select
          id={question.key}
          {...register(key, { required: question.required ? t("required") : false })}
          className={`${inputClass(!!error)} bg-white`}
        >
          <option value="">{question.placeholder ?? t("selectPlaceholder")}</option>
          {question.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}

      {question.type === "radio" && (
        <div className="flex flex-col gap-2 mt-1">
          {question.options.map((opt) => (
            <label
              key={opt.value}
              className="flex items-start gap-3 p-3 rounded-md border border-[#e5e5e5] cursor-pointer hover:border-[#3c3489] hover:bg-[#fafaf9] transition-colors"
            >
              <input
                type="radio"
                value={opt.value}
                {...register(key, {
                  required: question.required ? t("required") : false,
                })}
                className="mt-0.5 accent-[#3c3489]"
              />
              <span className="text-sm text-[#1a1a1a]">{opt.label}</span>
            </label>
          ))}
        </div>
      )}

      {error && (
        <p className="text-xs text-[#a32d2d]">{error.message as string}</p>
      )}
    </div>
  );
}

function inputClass(hasError: boolean) {
  return [
    "w-full h-11 px-3 rounded-md border text-sm text-[#1a1a1a]",
    "focus:outline-none focus:ring-2 focus:ring-[#3c3489] focus:ring-offset-1",
    "placeholder:text-[#5c5c5c]",
    hasError ? "border-[#a32d2d]" : "border-[#e5e5e5]",
  ].join(" ");
}
