import { useTranslations } from "next-intl";
import Link from "next/link";
import { getLocale } from "next-intl/server";

export default async function LandingPage() {
  const locale = await getLocale();
  return (
    <div>
      <HeroSection locale={locale} />
      <ProblemSection />
      <EligibilityTeaserSection locale={locale} />
      <AboutSection />
      <ProcessSection locale={locale} />
      <HostSection />
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
          <p className="text-xs sm:text-sm font-semibold text-[#3c3489] tracking-widest uppercase mb-4">
            {t("eyebrow")}
          </p>
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
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="grid sm:grid-cols-2 gap-8 sm:gap-12">
          <div>
            <h2
              style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
              className="text-2xl sm:text-3xl text-white mb-4 leading-snug"
            >
              {t("title")}
            </h2>
            <p className="text-[#a8a8a8] text-sm leading-relaxed">{t("body")}</p>
          </div>
          <div className="bg-[#2a2a2a] rounded-lg p-6">
            <p className="text-sm font-semibold text-[#a89ef0] mb-3">{t("promise_title")}</p>
            <p className="text-[#d4d4d4] text-sm leading-relaxed">{t("promise_body")}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function EligibilityTeaserSection({ locale }: { locale: string }) {
  const t = useTranslations("eligibility_teaser");

  const items = ["age", "passport", "education", "interest"] as const;

  return (
    <section className="bg-[#fafaf9] border-b border-[#e5e5e5]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="max-w-2xl">
          <h2
            style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
            className="text-2xl sm:text-3xl text-[#1a1a1a] mb-2"
          >
            {t("title")}
          </h2>
          <p className="text-[#5c5c5c] text-sm mb-6">{t("subtitle")}</p>
          <ul className="space-y-3 mb-8">
            {items.map((key) => (
              <li key={key} className="flex items-start gap-3">
                <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-[#3c3489] flex items-center justify-center">
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span className="text-[#1a1a1a] text-sm">{t(key)}</span>
              </li>
            ))}
          </ul>
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <Link
              href={`/${locale}/form`}
              className="w-full sm:w-auto inline-flex items-center justify-center h-11 px-6 rounded-md bg-[#3c3489] text-white text-sm font-medium hover:bg-[#2e2770] transition-colors"
            >
              {t("cta")}
            </Link>
            <span className="text-xs text-[#5c5c5c]">{t("note")}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function AboutSection() {
  const t = useTranslations("about");

  const points = ["eligibility", "process", "tips", "qa"] as const;

  return (
    <section className="bg-white border-b border-[#e5e5e5]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="max-w-2xl">
          <h2
            style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
            className="text-2xl sm:text-3xl text-[#1a1a1a] mb-3"
          >
            {t("title")}
          </h2>
          <p className="text-[#5c5c5c] text-sm leading-relaxed mb-7">{t("description")}</p>
          <ul className="space-y-4">
            {points.map((key) => (
              <li key={key} className="flex items-start gap-3">
                <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-[#e8e6fb] flex items-center justify-center">
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
                    <path d="M1 4L3.5 6.5L9 1" stroke="#3c3489" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span className="text-[#1a1a1a] text-sm">{t(`points.${key}`)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function ProcessSection({ locale }: { locale: string }) {
  const t = useTranslations("process");
  const tHero = useTranslations("hero");

  const steps = [
    { num: "01", titleKey: "step1_title", descKey: "step1_desc" },
    { num: "02", titleKey: "step2_title", descKey: "step2_desc" },
    { num: "03", titleKey: "step3_title", descKey: "step3_desc" },
  ] as const;

  return (
    <section className="bg-[#fafaf9] border-b border-[#e5e5e5]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <h2
          style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
          className="text-2xl sm:text-3xl text-[#1a1a1a] mb-10"
        >
          {t("title")}
        </h2>
        <div className="grid sm:grid-cols-3 gap-6 sm:gap-8">
          {steps.map(({ num, titleKey, descKey }) => (
            <div key={num} className="flex flex-col gap-2">
              <span className="text-xs font-bold text-[#3c3489] tracking-widest">{num}</span>
              <h3 className="text-base font-semibold text-[#1a1a1a]">{t(titleKey)}</h3>
              <p className="text-sm text-[#5c5c5c] leading-relaxed">{t(descKey)}</p>
            </div>
          ))}
        </div>
        <div className="mt-10">
          <Link
            href={`/${locale}/form`}
            className="w-full sm:w-auto inline-flex items-center justify-center h-11 px-8 rounded-md bg-[#3c3489] text-white text-sm font-medium hover:bg-[#2e2770] transition-colors"
          >
            {tHero("cta")}
          </Link>
        </div>
      </div>
    </section>
  );
}

function HostSection() {
  const t = useTranslations("host");

  return (
    <section className="bg-white border-b border-[#e5e5e5]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="flex flex-col sm:flex-row gap-8 sm:gap-12 items-start">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#e8e6fb] flex items-center justify-center flex-shrink-0 text-2xl">
            🎓
          </div>
          <div className="max-w-xl">
            <p className="text-xs font-semibold text-[#3c3489] tracking-widest uppercase mb-2">{t("title")}</p>
            <h2
              style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
              className="text-xl sm:text-2xl text-[#1a1a1a] mb-1"
            >
              {t("name")}
            </h2>
            <p className="text-xs text-[#5c5c5c] mb-4">{t("credential")}</p>
            <p className="text-sm text-[#5c5c5c] leading-relaxed">{t("bio")}</p>
          </div>
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
    <section className="bg-[#fafaf9] border-b border-[#e5e5e5]">
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
          className="inline-flex items-center justify-center h-12 px-10 rounded-md bg-white text-[#3c3489] text-sm font-semibold hover:bg-[#f0effe] transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#3c3489]"
        >
          {t("cta")}
        </Link>
      </div>
    </section>
  );
}
