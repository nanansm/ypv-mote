"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { LanguageSwitcher } from "./language-switcher";

export function Header() {
  const t = useTranslations("nav");
  const locale = useLocale();

  return (
    <header className="border-b border-[#e5e5e5] bg-white">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link
          href={`/${locale}`}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <Logo />
        </Link>
        <nav className="flex items-center gap-6">
          <Link
            href={`/${locale}/form`}
            className="hidden sm:block text-sm font-medium text-[#3c3489] hover:opacity-80 transition-opacity"
          >
            {t("apply")}
          </Link>
          <LanguageSwitcher />
        </nav>
      </div>
    </header>
  );
}

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect width="32" height="32" rx="6" fill="#3c3489" />
        <path
          d="M10 10 L16 8 L22 10 L22 18 C22 22 16 24 16 24 C16 24 10 22 10 18 Z"
          fill="none"
          stroke="white"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <line x1="16" y1="12" x2="16" y2="20" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="12" y1="16" x2="20" y2="16" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <span
        style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
        className="text-[#3c3489] text-lg leading-tight"
      >
        YPV Switzerland
      </span>
    </div>
  );
}
