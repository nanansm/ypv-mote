"use client";

import { useState } from "react";
import { Stars } from "@/components/review/review-visuals";

type ReviewItem = {
  id: string;
  name: string;
  rating: number;
  comment: string;
  createdAt: string;
};

type Labels = {
  filterAll: string;
  filterStarTemplate: string; // "{rating} stars"
  loadMore: string;
  empty: string;
  emptyFiltered: string;
  readMore: string;
  readLess: string;
};

type Props = {
  locale: string;
  initialReviews: ReviewItem[];
  initialTotal: number;
  initialHasMore: boolean;
  perPage: number;
  labels: Labels;
};

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

function ReviewComment({
  comment,
  readMoreLabel,
  readLessLabel,
}: {
  comment: string;
  readMoreLabel: string;
  readLessLabel: string;
}) {
  const isLong = comment.length > 220;
  if (!isLong) {
    return <p className="text-sm text-[#1a1a1a] leading-relaxed">“{comment}”</p>;
  }
  return (
    <details className="group">
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

export function ReviewsList({
  locale,
  initialReviews,
  initialTotal,
  initialHasMore,
  perPage,
  labels,
}: Props) {
  const [reviewsState, setReviewsState] = useState<ReviewItem[]>(initialReviews);
  const [total, setTotal] = useState(initialTotal);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [page, setPage] = useState(1);
  const [rating, setRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  async function fetchPage(nextPage: number, nextRating: number | null) {
    const params = new URLSearchParams({ page: String(nextPage), perPage: String(perPage) });
    if (nextRating) params.set("rating", String(nextRating));
    const res = await fetch(`/api/reviews?${params.toString()}`);
    if (!res.ok) return null;
    return (await res.json()) as {
      reviews: ReviewItem[];
      total: number;
      hasMore: boolean;
    };
  }

  async function handleFilterChange(nextRating: number | null) {
    if (loading || nextRating === rating) return;
    setLoading(true);
    try {
      const data = await fetchPage(1, nextRating);
      if (data) {
        setRating(nextRating);
        setReviewsState(data.reviews);
        setTotal(data.total);
        setHasMore(data.hasMore);
        setPage(1);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleLoadMore() {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const nextPage = page + 1;
      const data = await fetchPage(nextPage, rating);
      if (data) {
        setReviewsState((prev) => [...prev, ...data.reviews]);
        setTotal(data.total);
        setHasMore(data.hasMore);
        setPage(nextPage);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-5">
        <button
          type="button"
          onClick={() => handleFilterChange(null)}
          disabled={loading}
          className={`text-xs px-3 py-1.5 rounded-full border transition-colors disabled:opacity-60 ${
            rating === null
              ? "bg-[#3c3489] border-[#3c3489] text-white"
              : "bg-white border-[#e5e5e5] text-[#5c5c5c] hover:border-[#3c3489]/40"
          }`}
        >
          {labels.filterAll}
        </button>
        {[5, 4, 3, 2, 1].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => handleFilterChange(n)}
            disabled={loading}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors disabled:opacity-60 ${
              rating === n
                ? "bg-[#3c3489] border-[#3c3489] text-white"
                : "bg-white border-[#e5e5e5] text-[#5c5c5c] hover:border-[#3c3489]/40"
            }`}
          >
            {labels.filterStarTemplate.replace("{rating}", String(n))}
          </button>
        ))}
      </div>

      {reviewsState.length === 0 ? (
        <p className="text-sm text-[#5c5c5c] py-6">
          {rating === null ? labels.empty : labels.emptyFiltered}
        </p>
      ) : (
        <ul className="space-y-4">
          {reviewsState.map((r) => (
            <li
              key={r.id}
              className="bg-white border border-[#e5e5e5] rounded-lg p-4 sm:p-5 flex flex-col gap-2"
            >
              <div className="flex items-center justify-between gap-2">
                <Stars rating={r.rating} />
                <span className="text-[10px] text-[#a0a0a0]">
                  {relativeTimeLabel(r.createdAt, locale)}
                </span>
              </div>
              <ReviewComment
                comment={r.comment}
                readMoreLabel={labels.readMore}
                readLessLabel={labels.readLess}
              />
              <p className="text-xs font-medium text-[#5c5c5c] pt-1">— {r.name}</p>
            </li>
          ))}
        </ul>
      )}

      {hasMore && (
        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={loading}
            className="inline-flex items-center justify-center h-10 px-5 rounded-md border border-[#e5e5e5] text-sm font-medium text-[#1a1a1a] hover:border-[#3c3489]/40 disabled:opacity-60 transition-colors"
          >
            {labels.loadMore}
          </button>
        </div>
      )}

      <p className="sr-only" aria-live="polite">
        {reviewsState.length} / {total}
      </p>
    </div>
  );
}
