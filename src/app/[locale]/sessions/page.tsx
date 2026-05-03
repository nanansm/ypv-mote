import { getLocale, getTranslations } from "next-intl/server";
import { SessionsPicker } from "@/components/sessions/sessions-picker";

export default async function SessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ submission_id?: string }>;
}) {
  const { submission_id } = await searchParams;
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "sessions" });

  return (
    <div className="bg-[#fafaf9] min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="mb-6 sm:mb-8">
          <h1
            style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
            className="text-3xl text-[#1a1a1a] mb-2"
          >
            {t("title")}
          </h1>
          <p className="text-sm text-[#5c5c5c] max-w-2xl">{t("subtitle")}</p>
        </div>

        <SessionsPicker
          locale={locale}
          submissionId={submission_id ?? null}
        />
      </div>
    </div>
  );
}
