"use client";

import { useTranslations } from "next-intl";

type Props = {
  current: number;
  total: number;
  labels: string[];
};

export function FormProgress({ current, total, labels }: Props) {
  const t = useTranslations("form");

  return (
    <div className="mb-8">
      <p className="text-xs text-[#5c5c5c] mb-3">
        {t("progress", { current, total })}
      </p>
      <div className="flex gap-2">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
              i < current
                ? "bg-[#3c3489]"
                : i === current - 1
                ? "bg-[#3c3489]"
                : "bg-[#e5e5e5]"
            }`}
          />
        ))}
      </div>
      <p className="text-sm font-medium text-[#1a1a1a] mt-3">{labels[current - 1]}</p>
    </div>
  );
}
