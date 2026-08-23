import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getReviewStats, listApprovedReviews } from "@/lib/reviews";
import { ReviewsSummary, Stars } from "@/components/review/review-visuals";

const SERIF_STYLE = { fontFamily: "'Instrument Serif', Georgia, serif" };

function relativeTimeLabel(iso: string, locale: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "";
  const diffDays = Math.max(0, Math.round((now - then) / (24 * 60 * 60 * 1000)));
  if (diffDays < 1) return locale === "de" ? "heute" : "today";
  if (diffDays === 1) return locale === "de" ? "gestern" : "yesterday";
  if (diffDays < 7) return locale === "de" ? `vor ${diffDays} Tagen` : `${diffDays} days ago`;
  const weeks = Math.round(diffDays / 7);
  if (weeks < 5)
    return locale === "de"
      ? `vor ${weeks} Woche${weeks > 1 ? "n" : ""}`
      : `${weeks} week${weeks > 1 ? "s" : ""} ago`;
  const months = Math.round(diffDays / 30);
  if (months < 12)
    return locale === "de"
      ? `vor ${months} Monat${months > 1 ? "en" : ""}`
      : `${months} month${months > 1 ? "s" : ""} ago`;
  const years = Math.round(diffDays / 365);
  return locale === "de"
    ? `vor ${years} Jahr${years > 1 ? "en" : ""}`
    : `${years} year${years > 1 ? "s" : ""} ago`;
}

/** Comment body: renders in full, with a CSS-only (no JS) expand/collapse via
 * <details> once it's long enough to need clamping. */
function CommentBody({
  comment,
  readMoreLabel,
  readLessLabel,
}: {
  comment: string;
  readMoreLabel: string;
  readLessLabel: string;
}) {
  const isLong = comment.length > 160;
  if (!isLong) {
    return <p className="text-sm text-[#1a1a1a] leading-relaxed flex-1">“{comment}”</p>;
  }
  return (
    <details className="group flex-1">
      <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
        <span className="text-sm text-[#1a1a1a] leading-relaxed line-clamp-4 group-open:hidden">
          “{comment}”
        </span>
        <span className="hidden group-open:inline text-sm text-[#1a1a1a] leading-relaxed">
          “{comment}”
        </span>
        <span className="block text-xs font-medium text-[#3c3489] mt-1 group-open:hidden">
          {readMoreLabel}
        </span>
        <span className="hidden group-open:block text-xs font-medium text-[#3c3489] mt-1">
          {readLessLabel}
        </span>
      </summary>
    </details>
  );
}

export async function TestimonialsSection({ locale }: { locale: string }) {
  const [reviews, stats] = await Promise.all([listApprovedReviews(6), getReviewStats()]);
  if (reviews.length === 0) return null;

  const t = await getTranslations({ locale, namespace: "testimonials" });
  const averageLabel = t("summary_average", { average: stats.average });
  const countLabel = t("summary_count", { count: stats.total });

  return (
    <section className="bg-[#fafaf9] border-b border-[#e5e5e5]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <h2
          style={SERIF_STYLE}
          className="text-2xl sm:text-3xl text-[#1a1a1a] mb-6"
        >
          {t("title")}
        </h2>

        <div className="mb-8 sm:mb-10 pb-8 sm:pb-10 border-b border-[#e5e5e5]">
          <ReviewsSummary stats={stats} averageLabel={averageLabel} countLabel={countLabel} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {reviews.map((r) => (
            <article
              key={r.id}
              className="bg-white border border-[#e5e5e5] rounded-lg p-5 flex flex-col gap-3 hover:border-[#3c3489]/30 transition-colors"
            >
              <Stars rating={r.rating} />
              <CommentBody
                comment={r.comment}
                readMoreLabel={t("read_more")}
                readLessLabel={t("read_less")}
              />
              <div className="pt-2 border-t border-[#f0f0f0]">
                <p className="text-xs font-medium text-[#5c5c5c]">— {r.name}</p>
                <p className="text-[10px] text-[#a0a0a0] mt-0.5">
                  {relativeTimeLabel(r.createdAt, locale)}
                </p>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6">
          {stats.total > reviews.length && (
            <Link
              href={`/${locale}/review`}
              className="inline-flex items-center text-sm font-medium text-[#3c3489] hover:text-[#2e2770] transition-colors"
            >
              {t("see_all", { count: stats.total })} →
            </Link>
          )}
          <Link
            href={`/${locale}/review`}
            className="inline-flex items-center text-sm font-medium text-[#3c3489] hover:text-[#2e2770] transition-colors"
          >
            {t("cta")} →
          </Link>
        </div>
      </div>
    </section>
  );
}
