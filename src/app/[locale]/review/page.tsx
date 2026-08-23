import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { ReviewForm } from "@/components/review/review-form";
import { ReviewsList } from "@/components/review/reviews-list";
import { ReviewsSummary } from "@/components/review/review-visuals";
import { getReviewStats, listApprovedReviewsPaged } from "@/lib/reviews";

const PER_PAGE = 20;

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  // Layouts and pages render in parallel, so the layout's setRequestLocale
  // does not reliably land first — each page pins its own locale.
  setRequestLocale((await params).locale);
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "review" });
  const tTestimonials = await getTranslations({ locale, namespace: "testimonials" });

  const [stats, paged] = await Promise.all([
    getReviewStats(),
    listApprovedReviewsPaged({ page: 1, perPage: PER_PAGE }),
  ]);

  const averageLabel = tTestimonials("summary_average", { average: stats.average });
  const countLabel = tTestimonials("summary_count", { count: stats.total });

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

        {stats.total > 0 && (
          <div className="mb-8 pb-8 border-b border-[#e5e5e5]">
            <ReviewsSummary stats={stats} averageLabel={averageLabel} countLabel={countLabel} />
          </div>
        )}

        <h2
          style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
          className="text-xl sm:text-2xl text-[#1a1a1a] mb-4"
        >
          {t("list_title")}
        </h2>

        <div className="mb-10 sm:mb-12">
          <ReviewsList
            locale={locale}
            initialReviews={paged.reviews}
            initialTotal={paged.total}
            initialHasMore={paged.hasMore}
            perPage={PER_PAGE}
            labels={{
              filterAll: t("filter_all"),
              filterStarTemplate: t("filter_star", { rating: "{rating}" }),
              loadMore: t("load_more"),
              empty: t("empty"),
              emptyFiltered: t("empty_filtered"),
              readMore: tTestimonials("read_more"),
              readLess: tTestimonials("read_less"),
            }}
          />
        </div>

        <h2
          style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
          className="text-xl sm:text-2xl text-[#1a1a1a] mb-4"
        >
          {t("form_heading")}
        </h2>

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
