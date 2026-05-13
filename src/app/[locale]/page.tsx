import Image from "next/image";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { getLocale } from "next-intl/server";
import { TestimonialsSection } from "@/components/landing/testimonials-section";

const ELIGIBLE_COUNTRIES: { name: string; code: string; flag: string }[] = [
  { name: "Argentina", code: "AR", flag: "🇦🇷" },
  { name: "Australia", code: "AU", flag: "🇦🇺" },
  { name: "Canada", code: "CA", flag: "🇨🇦" },
  { name: "Chile", code: "CL", flag: "🇨🇱" },
  { name: "Indonesia", code: "ID", flag: "🇮🇩" },
  { name: "Japan", code: "JP", flag: "🇯🇵" },
  { name: "Monaco", code: "MC", flag: "🇲🇨" },
  { name: "New Zealand", code: "NZ", flag: "🇳🇿" },
  { name: "Philippines", code: "PH", flag: "🇵🇭" },
  { name: "Russia", code: "RU", flag: "🇷🇺" },
  { name: "San Marino", code: "SM", flag: "🇸🇲" },
  { name: "South Africa", code: "ZA", flag: "🇿🇦" },
  { name: "Tunisia", code: "TN", flag: "🇹🇳" },
  { name: "Ukraine", code: "UA", flag: "🇺🇦" },
  { name: "USA", code: "US", flag: "🇺🇸" },
];

export default async function LandingPage() {
  const locale = await getLocale();
  return (
    <div>
      <HeroSection locale={locale} />
      <ProblemSection />
      <WhatIsYpvSection />
      <CountriesSection />
      <HostSection />
      <AboutSection />
      <TestimonialsSection locale={locale} />
      <FaqSection />
      <CtaSection locale={locale} />
    </div>
  );
}

function HeroSection({ locale }: { locale: string }) {
  const t = useTranslations("hero");

  return (
    <section className="bg-white border-b border-[#e5e5e5]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-28">
        <div className="max-w-2xl">
          <h1
            style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
            className="text-3xl sm:text-5xl text-[#1a1a1a] leading-tight mb-6"
          >
            {t("title")}
          </h1>
          <p className="text-base sm:text-lg text-[#5c5c5c] leading-relaxed mb-8 sm:mb-10 max-w-xl">
            {t("description")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <Link
              href={`/${locale}/form`}
              className="w-full sm:w-auto inline-flex items-center justify-center h-12 sm:h-11 px-8 rounded-md bg-[#3c3489] text-white text-sm font-medium hover:bg-[#2e2770] transition-colors focus:outline-none focus:ring-2 focus:ring-[#3c3489] focus:ring-offset-2"
            >
              {t("cta")}
            </Link>
          </div>
          <p className="mt-4 text-xs text-[#5c5c5c]">{t("disclaimer")}</p>
        </div>
      </div>
    </section>
  );
}

function ProblemSection() {
  const t = useTranslations("problem");

  return (
    <section className="bg-[#1a1a1a]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="max-w-3xl">
          <h2
            style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
            className="text-2xl sm:text-3xl text-white mb-6 leading-snug"
          >
            {t("title")}
          </h2>
          <p className="text-[#d4d4d4] text-sm sm:text-base leading-relaxed mb-5">
            {t("body1")}
          </p>
          <p className="text-[#d4d4d4] text-sm sm:text-base leading-relaxed">
            {t("body2")}
          </p>
        </div>
      </div>
    </section>
  );
}

function WhatIsYpvSection() {
  const t = useTranslations("what_is_ypv");

  return (
    <section className="bg-white border-b border-[#e5e5e5]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="max-w-3xl">
          <h2
            style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
            className="text-2xl sm:text-3xl text-[#1a1a1a] mb-5"
          >
            {t("title")}
          </h2>
          <p className="text-[#5c5c5c] text-sm sm:text-base leading-relaxed mb-5">
            {t("body")}
          </p>
          <p className="italic text-xs sm:text-sm text-[#8a8a8a] leading-relaxed">
            {t("disclaimer")}
          </p>
        </div>
      </div>
    </section>
  );
}

function CountriesSection() {
  const t = useTranslations("countries");

  return (
    <section className="bg-[#fafaf9] border-b border-[#e5e5e5]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <h2
          style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
          className="text-2xl sm:text-3xl text-[#1a1a1a] mb-3"
        >
          {t("title")}
        </h2>
        <p className="text-[#5c5c5c] text-sm sm:text-base leading-relaxed mb-8 max-w-3xl">
          {t("lead")}
        </p>
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {ELIGIBLE_COUNTRIES.map((c) => (
            <li
              key={c.code}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-md border border-[#e5e5e5] bg-white"
            >
              <span className="text-base leading-none" aria-hidden="true">{c.flag}</span>
              <span className="text-sm text-[#1a1a1a] truncate">{c.name}</span>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-xs text-[#5c5c5c] max-w-2xl">{t("note")}</p>
      </div>
    </section>
  );
}

function HostSection() {
  const t = useTranslations("host");

  return (
    <section className="bg-white border-b border-[#e5e5e5]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="grid sm:grid-cols-[280px_1fr] gap-8 sm:gap-12 items-start">
          {/* TODO: Replace with actual host photo */}
          <div className="w-full max-w-[280px] aspect-square overflow-hidden rounded-md border border-[#e5e5e5]">
            <Image
              src="/host-photo.webp"
              alt={t("photo_alt")}
              width={280}
              height={280}
              className="w-full h-full object-cover"
              priority
            />
          </div>
          <div className="max-w-xl">
            <p className="text-xs font-semibold text-[#3c3489] tracking-widest uppercase mb-2">
              {t("title")}
            </p>
            <h2
              style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
              className="text-xl sm:text-2xl text-[#1a1a1a] mb-2 leading-snug"
            >
              {t("subtitle")}
            </h2>
            <p className="text-sm text-[#5c5c5c] leading-relaxed mb-5">
              {t("bio")}
            </p>
            <p className="text-sm font-semibold text-[#1a1a1a]">
              {t("name_placeholder")}
            </p>
            <p className="text-xs text-[#5c5c5c]">
              {t("credential_placeholder")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function AboutSection() {
  const t = useTranslations("about");

  const points = [
    { titleKey: "points.eligibility_title", descKey: "points.eligibility_desc" },
    { titleKey: "points.documents_title", descKey: "points.documents_desc" },
    { titleKey: "points.timing_title", descKey: "points.timing_desc" },
    { titleKey: "points.mistakes_title", descKey: "points.mistakes_desc" },
  ] as const;

  return (
    <section className="bg-[#fafaf9] border-b border-[#e5e5e5]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="max-w-3xl">
          <h2
            style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
            className="text-2xl sm:text-3xl text-[#1a1a1a] mb-4"
          >
            {t("title")}
          </h2>
          <p className="text-[#5c5c5c] text-sm sm:text-base leading-relaxed mb-8">
            {t("description")}
          </p>
          <ul className="space-y-5">
            {points.map(({ titleKey, descKey }) => (
              <li key={titleKey} className="flex items-start gap-3">
                <span className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-[#e8e6fb] flex items-center justify-center">
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
                    <path d="M1 4L3.5 6.5L9 1" stroke="#3c3489" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <div>
                  <p className="text-sm font-semibold text-[#1a1a1a] mb-0.5">{t(titleKey)}</p>
                  <p className="text-sm text-[#5c5c5c] leading-relaxed">{t(descKey)}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function FaqSection() {
  const t = useTranslations("faq");

  const items = [
    { q: "q1", a: "a1" },
    { q: "q2", a: "a2" },
    { q: "q3", a: "a3" },
    { q: "q4", a: "a4" },
    { q: "q5", a: "a5" },
  ] as const;

  return (
    <section className="bg-white border-b border-[#e5e5e5]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <h2
          style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
          className="text-2xl sm:text-3xl text-[#1a1a1a] mb-8"
        >
          {t("title")}
        </h2>
        <div className="max-w-2xl space-y-0 divide-y divide-[#e5e5e5] border border-[#e5e5e5] rounded-lg overflow-hidden">
          {items.map(({ q, a }) => (
            <details key={q} className="group bg-white">
              <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none select-none hover:bg-[#fafaf9] transition-colors">
                <span className="text-sm font-medium text-[#1a1a1a] pr-4">{t(q)}</span>
                <span className="flex-shrink-0 w-5 h-5 rounded-full border border-[#e5e5e5] flex items-center justify-center text-[#5c5c5c] text-xs group-open:rotate-45 transition-transform">
                  +
                </span>
              </summary>
              <div className="px-5 pb-4">
                <p className="text-sm text-[#5c5c5c] leading-relaxed">{t(a)}</p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaSection({ locale }: { locale: string }) {
  const t = useTranslations("cta_section");

  return (
    <section className="bg-[#3c3489]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20 text-center">
        <h2
          style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
          className="text-2xl sm:text-4xl text-white mb-4"
        >
          {t("title")}
        </h2>
        <p className="text-[#c4bff5] text-sm sm:text-base mb-8 max-w-md mx-auto">{t("body")}</p>
        <Link
          href={`/${locale}/form`}
          className="inline-flex items-center justify-center h-12 px-10 rounded-md bg-white text-[#3c3489] text-sm font-semibold no-underline hover:bg-[#f0effe] transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#3c3489]"
        >
          {t("cta")}
        </Link>
      </div>
    </section>
  );
}
