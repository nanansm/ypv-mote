import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { ReviewForm } from "@/components/review/review-form";

export default async function ReviewPage() {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "review" });

  return (
    <div className="bg-[#fafaf9] min-h-screen">
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <Link
          href={`/${locale}`}
          className="text-sm text-[#5c5c5c] hover:text-[#1a1a1a] transition-colors mb-6 inline-block"
        >
          ← {t("back_home")}
        </Link>

        <h1
          style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
          className="text-3xl sm:text-4xl text-[#1a1a1a] mb-2"
        >
          {t("title")}
        </h1>
        <p className="text-sm text-[#5c5c5c] mb-6 sm:mb-8">{t("subtitle")}</p>

        <ReviewForm
          locale={locale}
          labels={{
            nameLabel: t("name_label"),
            namePlaceholder: t("name_placeholder"),
            emailLabel: t("email_label"),
            emailPlaceholder: t("email_placeholder"),
            emailNote: t("email_note"),
            ratingLabel: t("rating_label"),
            commentLabel: t("comment_label"),
            commentPlaceholder: t("comment_placeholder"),
            submit: t("submit"),
            submitting: t("submitting"),
            successTitle: t("success_title"),
            successBody: t("success_body"),
            errorGeneric: t("error_generic"),
            duplicate: t("error_duplicate"),
            validation: t("error_validation"),
            rateLimit: t("error_rate_limit"),
            charsRemainingTemplate: t("chars_remaining", { count: "{count}" }),
          }}
        />
      </div>
    </div>
  );
}
