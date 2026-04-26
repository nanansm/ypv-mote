"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations("footer");
  const tLegal = useTranslations("legal");
  const locale = useLocale();

  const legalLinks = [
    { slug: "privacy", label: tLegal("privacy") },
    { slug: "terms", label: tLegal("terms") },
    { slug: "cookie", label: tLegal("cookie") },
    { slug: "refund", label: tLegal("refund") },
    { slug: "disclaimer", label: tLegal("disclaimer") },
  ];

  return (
    <footer className="border-t border-[#e5e5e5] bg-[#fafaf9] mt-auto">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p
              style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
              className="text-[#3c3489] text-base mb-1"
            >
              {t("brand")}
            </p>
            <p className="text-xs text-[#5c5c5c] max-w-xs">{t("screening_note")}</p>
          </div>
          <nav className="flex flex-wrap gap-x-5 gap-y-2">
            {legalLinks.map((link) => (
              <Link
                key={link.slug}
                href={`/${locale}/legal/${link.slug}`}
                className="text-xs text-[#5c5c5c] hover:text-[#1a1a1a] transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-8 pt-6 border-t border-[#e5e5e5] space-y-4">
          <p className="text-xs text-[#8a8a8a] leading-relaxed max-w-3xl">
            {t("disclaimer")}
          </p>
          <p className="text-xs text-[#5c5c5c]">
            © {new Date().getFullYear()} YPV Switzerland. {t("rights")}
          </p>
        </div>
      </div>
    </footer>
  );
}
