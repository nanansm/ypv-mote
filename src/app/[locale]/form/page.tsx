import { getLocale, getTranslations } from "next-intl/server";
import { getQuestionsForSection } from "@/lib/questions";
import { ScreeningForm } from "@/components/form/screening-form";

export default async function FormPage() {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "form" });

  const section1 = getQuestionsForSection(locale, 1);
  const section2 = getQuestionsForSection(locale, 2);
  const section3 = getQuestionsForSection(locale, 3);

  const sectionLabels = [t("section1"), t("section2"), t("section3")];

  return (
    <div className="bg-[#fafaf9] min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1
            style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
            className="text-3xl text-[#1a1a1a] mb-2"
          >
            {t("title")}
          </h1>
          <p className="text-sm text-[#5c5c5c]">{t("subtitle")}</p>
        </div>

        <div className="bg-white rounded-lg border border-[#e5e5e5] p-6 sm:p-8">
          <ScreeningForm
            section1Questions={section1}
            section2Questions={section2}
            section3Questions={section3}
            sectionLabels={sectionLabels}
          />
        </div>
      </div>
    </div>
  );
}
