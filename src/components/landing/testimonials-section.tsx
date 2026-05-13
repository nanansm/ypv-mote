import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { listApprovedReviews } from "@/lib/reviews";

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

function truncate(text: string, max = 150): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max).trimEnd()}…`;
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg
          key={n}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill={n <= rating ? "#f59e0b" : "none"}
          stroke={n <= rating ? "#f59e0b" : "#d4d4d4"}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

export async function TestimonialsSection({ locale }: { locale: string }) {
  const reviews = listApprovedReviews(6);
  if (reviews.length === 0) return null;

  const t = await getTranslations({ locale, namespace: "testimonials" });

  return (
    <section className="bg-[#fafaf9] border-b border-[#e5e5e5]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <h2
          style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
          className="text-2xl sm:text-3xl text-[#1a1a1a] mb-8 sm:mb-10"
        >
          {t("title")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {reviews.map((r) => (
            <article
              key={r.id}
              className="bg-white border border-[#e5e5e5] rounded-lg p-5 flex flex-col gap-3 hover:border-[#3c3489]/30 transition-colors"
            >
              <Stars rating={r.rating} />
              <p className="text-sm text-[#1a1a1a] leading-relaxed flex-1">
                “{truncate(r.comment, 150)}”
              </p>
              <div className="pt-2 border-t border-[#f0f0f0]">
                <p className="text-xs font-medium text-[#5c5c5c]">— {r.name}</p>
                <p className="text-[10px] text-[#a0a0a0] mt-0.5">
                  {relativeTimeLabel(r.createdAt, locale)}
                </p>
              </div>
            </article>
          ))}
        </div>
        <div className="mt-8 text-center">
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
