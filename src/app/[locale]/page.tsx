import { useTranslations } from "next-intl";
import Link from "next/link";
import { getLocale } from "next-intl/server";

export default async function LandingPage() {
  const locale = await getLocale();
  return <LandingContent locale={locale} />;
}

function LandingContent({ locale }: { locale: string }) {
  return (
    <div>
      <HeroSection locale={locale} />
      <AboutSection />
      <ProcessSection locale={locale} />
    </div>
  );
}

function HeroSection({ locale }: { locale: string }) {
  const t = useTranslations("hero");

  return (
    <section className="bg-white border-b border-[#e5e5e5]">
      <div className="max-w-5xl mx-auto px-6 py-20 sm:py-28">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-[#3c3489] tracking-wide uppercase mb-4">
            {t("subtitle")}
          </p>
          <h1
            style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
            className="text-4xl sm:text-5xl text-[#1a1a1a] leading-tight mb-6"
          >
            {t("title")}
          </h1>
          <p className="text-lg text-[#5c5c5c] leading-relaxed mb-10 max-w-xl">
            {t("description")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <Link
              href={`/${locale}/form`}
              className="inline-flex items-center justify-center h-11 px-8 rounded-md bg-[#3c3489] text-white text-sm font-medium hover:bg-[#2e2770] transition-colors focus:outline-none focus:ring-2 focus:ring-[#3c3489] focus:ring-offset-2"
            >
              {t("cta")}
            </Link>
          </div>
          <p className="mt-5 text-xs text-[#5c5c5c]">{t("disclaimer")}</p>
        </div>
      </div>
    </section>
  );
}

function AboutSection() {
  const t = useTranslations("about");

  const points = [
    { key: "eligibility", icon: "✓" },
    { key: "process", icon: "✓" },
    { key: "tips", icon: "✓" },
    { key: "qa", icon: "✓" },
  ] as const;

  return (
    <section className="bg-[#fafaf9] border-b border-[#e5e5e5]">
      <div className="max-w-5xl mx-auto px-6 py-16 sm:py-20">
        <div className="max-w-2xl">
          <h2
            style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
            className="text-3xl text-[#1a1a1a] mb-4"
          >
            {t("title")}
          </h2>
          <p className="text-[#5c5c5c] leading-relaxed mb-8">{t("description")}</p>
          <ul className="space-y-3">
            {points.map((p) => (
              <li key={p.key} className="flex items-start gap-3">
                <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-[#3c3489] flex items-center justify-center">
                  <svg
                    width="10"
                    height="8"
                    viewBox="0 0 10 8"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M1 4L3.5 6.5L9 1"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span className="text-[#1a1a1a] text-sm">
                  {t(`points.${p.key}`)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function ProcessSection({ locale }: { locale: string }) {
  const t = useTranslations("hero");

  return (
    <section className="bg-white">
      <div className="max-w-5xl mx-auto px-6 py-16 sm:py-20">
        <div className="grid sm:grid-cols-3 gap-8">
          {[
            {
              step: "01",
              en: "Complete the Form",
              zh: "填写表格",
              desc_en: "Answer questions about your background and eligibility.",
              desc_zh: "回答有关您的背景和资格的问题。",
            },
            {
              step: "02",
              en: "Get Your Result",
              zh: "获取结果",
              desc_en: "Receive an instant eligibility assessment.",
              desc_zh: "即时收到资格评估结果。",
            },
            {
              step: "03",
              en: "Join the Webinar",
              zh: "参加研讨会",
              desc_en: "Pay and secure your seat to access expert guidance.",
              desc_zh: "付款后确认名额，获得专家指导。",
            },
          ].map((item) => (
            <div key={item.step} className="flex flex-col gap-3">
              <span className="text-xs font-semibold text-[#3c3489] tracking-widest">
                {item.step}
              </span>
              <h3 className="text-base font-semibold text-[#1a1a1a]">
                {locale === "zh" ? item.zh : item.en}
              </h3>
              <p className="text-sm text-[#5c5c5c] leading-relaxed">
                {locale === "zh" ? item.desc_zh : item.desc_en}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-12">
          <Link
            href={`/${locale}/form`}
            className="inline-flex items-center justify-center h-11 px-8 rounded-md bg-[#3c3489] text-white text-sm font-medium hover:bg-[#2e2770] transition-colors"
          >
            {t("cta")}
          </Link>
        </div>
      </div>
    </section>
  );
}
